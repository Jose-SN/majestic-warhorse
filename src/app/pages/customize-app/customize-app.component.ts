import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BRANDING_PRESETS } from 'src/app/core/branding/branding.defaults';
import { AppBranding, BrandingPreset, BrandingThemeColors } from 'src/app/core/branding/branding.model';
import { BrandingService } from 'src/app/core/branding/branding.service';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-customize-app',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customize-app.component.html',
  styleUrl: './customize-app.component.scss',
})
export class CustomizeAppComponent implements OnInit, OnDestroy {
  @Input() embedded = false;

  @HostBinding('class.customize-app-host--embedded')
  get embeddedHost(): boolean {
    return this.embedded;
  }

  readonly presets: BrandingPreset[] = BRANDING_PRESETS;
  draft!: AppBranding;
  saving = false;
  loading = true;
  activePresetId: string | null = null;
  private destroy$ = new Subject<void>();
  private localPreviewUrls: string[] = [];

  constructor(
    private brandingService: BrandingService,
    private commonService: CommonService,
    private router: Router
  ) {}

  get isOrganization(): boolean {
    return this.commonService.loginedUserInfo?.role === 'organization';
  }

  get organizationId(): string {
    return this.brandingService.resolveOrganizationId();
  }

  async ngOnInit(): Promise<void> {
    if (!this.isOrganization) {
      void this.router.navigate(
        this.embedded
          ? [DASHBOARD_NAV_ROUTES.settings, 'account']
          : [DASHBOARD_NAV_ROUTES.overview]
      );
      return;
    }

    if (!this.organizationId) {
      this.toast('organization_id is required for branding.', TOASTER_MESSAGE_TYPE.ERROR);
      void this.router.navigate(
        this.embedded
          ? [DASHBOARD_NAV_ROUTES.settings, 'account']
          : [DASHBOARD_NAV_ROUTES.overview]
      );
      return;
    }

    this.brandingService.branding$.pipe(takeUntil(this.destroy$)).subscribe((branding) => {
      // Avoid wiping in-progress logo/favicon selection with remote emissions.
      if (this.loading || this.saving || !this.draft) {
        this.draft = this.clone(branding);
        this.syncActivePreset();
      }
    });

    this.loading = true;
    try {
      await this.brandingService.reloadForOrganization();
    } finally {
      this.loading = false;
      this.draft = this.clone(this.brandingService.branding);
      this.syncActivePreset();
    }
  }

  ngOnDestroy(): void {
    this.revokeLocalPreviews();
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyPreset(preset: BrandingPreset): void {
    this.draft.colors = { ...preset.colors };
    this.activePresetId = preset.id;
  }

  onColorEdited(): void {
    this.syncActivePreset();
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast('Please choose an image file for the logo.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast('Logo must be under 2 MB.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    try {
      const objectUrl = URL.createObjectURL(file);
      this.trackLocalPreview(objectUrl);
      this.draft = { ...this.draft, logoUrl: objectUrl };
      // Persist as data URL for save payload
      const dataUrl = await this.brandingService.readFileAsDataUrl(file);
      this.draft = { ...this.draft, logoUrl: dataUrl };
      this.revokeLocalPreviews();
    } catch {
      this.toast('Could not read logo file.', TOASTER_MESSAGE_TYPE.ERROR);
    } finally {
      input.value = '';
    }
  }

  async onFaviconSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast('Please choose an image file for the favicon.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    if (file.size > 512 * 1024) {
      this.toast('Favicon must be under 512 KB.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    try {
      const objectUrl = URL.createObjectURL(file);
      this.trackLocalPreview(objectUrl);
      this.draft = { ...this.draft, faviconUrl: objectUrl };
      const dataUrl = await this.brandingService.readFileAsDataUrl(file);
      this.draft = { ...this.draft, faviconUrl: dataUrl };
      this.revokeLocalPreviews();
    } catch {
      this.toast('Could not read favicon file.', TOASTER_MESSAGE_TYPE.ERROR);
    } finally {
      input.value = '';
    }
  }

  async save(): Promise<void> {
    if (!this.draft.appName?.trim()) {
      this.toast('App name is required.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }
    if (!this.organizationId) {
      this.toast('organization_id is required to save branding.', TOASTER_MESSAGE_TYPE.ERROR);
      return;
    }

    this.saving = true;
    try {
      const saved = await this.brandingService.save({
        appName: this.draft.appName.trim(),
        tagline: this.draft.tagline?.trim() || '',
        logoUrl: this.draft.logoUrl,
        faviconUrl: this.draft.faviconUrl,
        colors: { ...this.draft.colors },
      });
      this.draft = this.clone(saved);
      this.syncActivePreset();
      this.toast('Branding saved for your organisation.', TOASTER_MESSAGE_TYPE.SUCCESS);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        'Could not save branding. Please try again.';
      this.toast(message, TOASTER_MESSAGE_TYPE.ERROR);
    } finally {
      this.saving = false;
    }
  }

  previewLive(): void {
    this.brandingService.previewLocal({
      appName: this.draft.appName.trim() || this.brandingService.appName,
      tagline: this.draft.tagline?.trim() || '',
      logoUrl: this.draft.logoUrl,
      faviconUrl: this.draft.faviconUrl,
      colors: { ...this.draft.colors },
    });
    this.toast('Live preview applied (not saved yet).', TOASTER_MESSAGE_TYPE.SUCCESS);
  }

  async reset(): Promise<void> {
    this.saving = true;
    try {
      await this.brandingService.resetToDefault();
      this.draft = this.clone(this.brandingService.branding);
      this.syncActivePreset();
      this.toast('Restored Majestic default branding.', TOASTER_MESSAGE_TYPE.SUCCESS);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        'Could not reset branding. Please try again.';
      this.toast(message, TOASTER_MESSAGE_TYPE.ERROR);
    } finally {
      this.saving = false;
    }
  }

  readonly colorGroups: { title: string; keys: (keyof BrandingThemeColors)[] }[] = [
    {
      title: 'Surfaces',
      keys: ['surfaceContainerLow', 'surface', 'surfaceContainer'],
    },
    {
      title: 'Brand',
      keys: ['primaryContainer', 'primary', 'gradientStart', 'gradientMid', 'gradientEnd'],
    },
    {
      title: 'Text',
      keys: ['onSurface', 'onSurfaceVariant'],
    },
    {
      title: 'Accents',
      keys: ['secondary', 'secondaryContainer', 'tertiary', 'tertiaryContainer'],
    },
    {
      title: 'Border',
      keys: ['outline'],
    },
  ];

  colorLabel(key: keyof BrandingThemeColors): string {
    const labels: Record<keyof BrandingThemeColors, string> = {
      surfaceContainerLow: 'Background',
      surface: 'Surface',
      surfaceContainer: 'Surface alt',
      onSurface: 'Text',
      onSurfaceVariant: 'Text muted',
      primary: 'Primary',
      primaryContainer: 'Primary accent',
      secondary: 'Secondary',
      secondaryContainer: 'Secondary dark',
      tertiary: 'Tertiary',
      tertiaryContainer: 'Tertiary dark',
      outline: 'Border',
      gradientStart: 'Gradient start',
      gradientMid: 'Gradient mid',
      gradientEnd: 'Gradient end',
    };
    return labels[key];
  }

  private syncActivePreset(): void {
    if (!this.draft?.colors) {
      this.activePresetId = null;
      return;
    }
    const match = this.presets.find((preset) =>
      this.colorsEqual(preset.colors, this.draft.colors)
    );
    this.activePresetId = match?.id ?? null;
  }

  private colorsEqual(a: BrandingThemeColors, b: BrandingThemeColors): boolean {
    return (Object.keys(a) as (keyof BrandingThemeColors)[]).every(
      (key) => a[key].toLowerCase() === b[key].toLowerCase()
    );
  }

  private clone(branding: AppBranding): AppBranding {
    return {
      ...branding,
      colors: { ...branding.colors },
    };
  }

  private trackLocalPreview(url: string): void {
    this.localPreviewUrls.push(url);
  }

  private revokeLocalPreviews(): void {
    this.localPreviewUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    this.localPreviewUrls = [];
  }

  private toast(message: string, messageType: string): void {
    this.commonService.openToaster({ message, messageType });
  }
}

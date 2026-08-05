import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AppBranding, BrandingThemeColors } from './branding.model';
import {
  DEFAULT_APP_BRANDING,
  DEFAULT_BRAND_FAVICON,
  DEFAULT_BRAND_LOGO,
  DEFAULT_THEME_COLORS,
} from './branding.defaults';
import { BrandingApiService } from 'src/app/services/api-service/branding-api.service';
import { CommonService } from 'src/app/shared/services/common.service';

const STORAGE_PREFIX = 'mw-branding';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly brandingSubject = new BehaviorSubject<AppBranding>(this.cloneDefault());
  readonly branding$: Observable<AppBranding> = this.brandingSubject.asObservable();
  private loadSeq = 0;

  constructor(
    private brandingApi: BrandingApiService,
    private commonService: CommonService
  ) {}

  /** Current branding snapshot. */
  get branding(): AppBranding {
    return this.brandingSubject.value;
  }

  get appName(): string {
    return this.branding.appName || DEFAULT_APP_BRANDING.appName;
  }

  get logoUrl(): string {
    return this.branding.logoUrl || DEFAULT_BRAND_LOGO;
  }

  get faviconUrl(): string {
    return this.branding.faviconUrl || DEFAULT_BRAND_FAVICON;
  }

  /** Active organization id (session first, then logged-in context). */
  resolveOrganizationId(): string {
    const fromSession = sessionStorage.getItem('organization_id') || '';
    const user = this.commonService.loginedUserInfo;
    const fromUser =
      user?.organization_id ||
      (user?.role === 'organization' ? user?.id : '') ||
      '';
    return (fromSession || fromUser || '').trim();
  }

  /**
   * Load branding for the active organization from the backend.
   * Uses defaults when no row exists or organization_id is missing.
   * Caches last successful payload in localStorage as offline fallback.
   */
  init(): void {
    void this.reloadForOrganization();
  }

  /** Re-load when organization context changes after login / org picker. */
  async reloadForOrganization(): Promise<void> {
    const seq = ++this.loadSeq;
    const organizationId = this.resolveOrganizationId();

    if (!organizationId) {
      this.applyLocal(this.cloneDefault());
      return;
    }

    // Optimistic cache while network request runs
    const cached = this.readFromStorage(this.storageKey(organizationId));
    if (cached) {
      this.applyLocal(this.mergeWithDefaults(cached));
    }

    try {
      const dto = await firstValueFrom(this.brandingApi.getBranding(organizationId));
      if (seq !== this.loadSeq) {
        return;
      }

      if (dto) {
        const next = this.mergeWithDefaults(this.brandingApi.toAppBranding(dto));
        this.persistCache(organizationId, next);
        this.applyLocal(next);
      } else {
        const defaults = this.cloneDefault();
        this.persistCache(organizationId, defaults);
        this.applyLocal(defaults);
      }
    } catch {
      if (seq !== this.loadSeq) {
        return;
      }
      // Keep cache/defaults already applied; do not block login on branding failure
      if (!cached) {
        this.applyLocal(this.cloneDefault());
      }
    }
  }

  /**
   * Persist branding to backend for the active organization.
   * organization_id is mandatory — throws if missing.
   */
  async save(partial: Partial<AppBranding>): Promise<AppBranding> {
    const organizationId = this.resolveOrganizationId();
    if (!organizationId) {
      throw new Error('organization_id is required to save branding');
    }

    const next: AppBranding = this.mergeWithDefaults({
      ...this.branding,
      ...partial,
      colors: {
        ...this.branding.colors,
        ...(partial.colors || {}),
      },
      updatedAt: new Date().toISOString(),
    });

    const saved = await firstValueFrom(
      this.brandingApi.saveBranding(this.brandingApi.toSavePayload(organizationId, next))
    );
    const merged = this.mergeWithDefaults(this.brandingApi.toAppBranding(saved));
    this.persistCache(organizationId, merged);
    this.applyLocal(merged);
    return merged;
  }

  /** Apply colors in-memory only (no backend save) — used for live preview. */
  previewLocal(partial: Partial<AppBranding>): AppBranding {
    const next = this.mergeWithDefaults({
      ...this.branding,
      ...partial,
      colors: {
        ...this.branding.colors,
        ...(partial.colors || {}),
      },
    });
    this.applyLocal(next);
    return next;
  }

  applyColors(colors: BrandingThemeColors): Promise<AppBranding> {
    return this.save({ colors: { ...colors } });
  }

  /** Reset to Majestic defaults and clear backend row for this organization. */
  async resetToDefault(): Promise<AppBranding> {
    const organizationId = this.resolveOrganizationId();
    const next = this.cloneDefault();

    if (organizationId) {
      try {
        await firstValueFrom(this.brandingApi.deleteBranding(organizationId));
      } catch {
        // Fall through — still apply defaults locally
      }
      this.persistCache(organizationId, next);
    }

    this.applyLocal(next);
    return next;
  }

  /** Read a local image file as a data URL for logo / favicon upload. */
  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private applyLocal(branding: AppBranding): void {
    this.brandingSubject.next(branding);
    this.applyToDom(branding);
  }

  private storageKey(organizationId: string): string {
    return organizationId ? `${STORAGE_PREFIX}:${organizationId}` : `${STORAGE_PREFIX}:global`;
  }

  private persistCache(organizationId: string, branding: AppBranding): void {
    try {
      localStorage.setItem(this.storageKey(organizationId), JSON.stringify(branding));
    } catch {
      // Quota / private mode — keep in-memory only
    }
  }

  private readFromStorage(key: string): AppBranding | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AppBranding;
    } catch {
      return null;
    }
  }

  private mergeWithDefaults(input: Partial<AppBranding>): AppBranding {
    return {
      appName: (input.appName || DEFAULT_APP_BRANDING.appName).trim() || DEFAULT_APP_BRANDING.appName,
      tagline: input.tagline ?? DEFAULT_APP_BRANDING.tagline,
      logoUrl: input.logoUrl || DEFAULT_BRAND_LOGO,
      faviconUrl: input.faviconUrl || DEFAULT_BRAND_FAVICON,
      colors: { ...DEFAULT_THEME_COLORS, ...(input.colors || {}) },
      updatedAt: input.updatedAt,
    };
  }

  private cloneDefault(): AppBranding {
    return {
      ...DEFAULT_APP_BRANDING,
      colors: { ...DEFAULT_THEME_COLORS },
    };
  }

  private applyToDom(branding: AppBranding): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const c = branding.colors;

    const set = (name: string, value: string) => root.style.setProperty(name, value);

    set('--mc-surface', c.surface);
    set('--mc-surface-container', c.surfaceContainer);
    set('--mc-surface-container-low', c.surfaceContainerLow);
    set('--mc-surface-container-lowest', c.surface);
    set('--mc-surface-container-high', c.surfaceContainer);
    set('--mc-surface-container-highest', c.surfaceContainer);
    set('--mc-on-surface', c.onSurface);
    set('--mc-on-surface-variant', c.onSurfaceVariant);
    set('--mc-primary', c.primary);
    set('--mc-primary-container', c.primaryContainer);
    set('--mc-secondary', c.secondary);
    set('--mc-secondary-container', c.secondaryContainer);
    set('--mc-tertiary', c.tertiary);
    set('--mc-tertiary-container', c.tertiaryContainer);
    set('--mc-outline', c.outline);
    set(
      '--mc-brand-gradient',
      `linear-gradient(135deg, ${c.gradientStart} 0%, ${c.gradientMid} 50%, ${c.gradientEnd} 100%)`
    );
    set(
      '--mc-brand-text-gradient',
      `linear-gradient(135deg, ${c.primary} 0%, ${c.secondary} 100%)`
    );

    set('--bg-main', c.surface);
    set('--bg-left-panel', c.surface);
    set('--bg-dark-blue', c.surfaceContainerLow);
    set('--bg-hover', c.secondaryContainer);
    set('--bg-orange', c.primaryContainer);
    set('--bg-magento', c.secondaryContainer);
    set('--btn-add', c.primaryContainer);
    set('--btn-upload', c.secondaryContainer);
    set('--bg-mit1', c.primaryContainer);
    set('--bg-mit2', c.secondaryContainer);
    set('--bg-mit4', c.gradientEnd);

    document.title = branding.appName || DEFAULT_APP_BRANDING.appName;
    this.updateFavicon(branding.faviconUrl || DEFAULT_BRAND_FAVICON);
    this.updateAppleTouchIcon(branding.logoUrl || DEFAULT_BRAND_LOGO);
    this.updateThemeColor(c.surface);
  }

  private updateFavicon(href: string): void {
    const head = document.head;
    let link = head.querySelector<HTMLLinkElement>("link[rel='icon'][data-branding='true']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.setAttribute('data-branding', 'true');
      head.appendChild(link);
    }
    link.type = href.startsWith('data:image/svg')
      ? 'image/svg+xml'
      : href.startsWith('data:image/png')
        ? 'image/png'
        : 'image/png';
    link.href = href;

    const primary = head.querySelector<HTMLLinkElement>("link[rel='icon']:not([data-branding])");
    if (primary) {
      primary.href = href;
    }
  }

  private updateAppleTouchIcon(href: string): void {
    const apple = document.head.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (apple) {
      apple.href = href;
    }
  }

  private updateThemeColor(color: string): void {
    const meta = document.head.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    if (meta) {
      meta.content = color;
    }
  }
}

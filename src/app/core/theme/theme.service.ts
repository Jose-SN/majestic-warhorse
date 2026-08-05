import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BrandingService } from 'src/app/core/branding/branding.service';
import {
  DARK_THEME_SURFACES,
  LIGHT_THEME_SURFACES,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from './theme.defaults';
import { AppThemeMode, ThemeOption, ThemeSurfacePalette } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly options: ThemeOption[] = THEME_OPTIONS;

  private readonly modeSubject = new BehaviorSubject<AppThemeMode>(this.readStored());
  readonly mode$: Observable<AppThemeMode> = this.modeSubject.asObservable();

  private brandingSubActive = false;

  constructor(private brandingService: BrandingService) {}

  get mode(): AppThemeMode {
    return this.modeSubject.value;
  }

  /** Call once from AppComponent after BrandingService.init(). */
  init(): void {
    this.apply(this.mode);

    if (!this.brandingSubActive) {
      this.brandingSubActive = true;
      this.brandingService.branding$.subscribe(() => {
        // Org branding updates must not wipe light/dark surface overlays.
        if (this.mode !== 'default') {
          this.applySurfaceOverlay(this.mode);
        }
      });
    }
  }

  setTheme(mode: AppThemeMode): void {
    if (mode !== 'default' && mode !== 'dark' && mode !== 'light') {
      mode = 'default';
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // private mode
    }
    this.modeSubject.next(mode);
    this.apply(mode);
  }

  /** Re-sync after branding DOM paint (default restores full cyber branding). */
  private apply(mode: AppThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode === 'light' ? 'light' : 'dark';

    if (mode === 'default') {
      this.brandingService.reapplyDom();
      return;
    }

    this.applySurfaceOverlay(mode);
  }

  private applySurfaceOverlay(mode: 'dark' | 'light'): void {
    const surfaces = mode === 'light' ? LIGHT_THEME_SURFACES : DARK_THEME_SURFACES;
    this.writeSurfaces(surfaces);
    this.flattenBrandEffects(mode);

    const meta = document.head.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    if (meta) {
      meta.content = surfaces.surfaceContainerLow;
    }
  }

  /** Calm modes: solid accents, no gradient tokens / glow shadows. */
  private flattenBrandEffects(mode: 'dark' | 'light'): void {
    const root = document.documentElement;
    const set = (name: string, value: string) => root.style.setProperty(name, value);
    const brand = this.brandingService.branding.colors;
    const accent =
      brand.primaryContainer ||
      getComputedStyle(root).getPropertyValue('--ds-primary').trim() ||
      '#ff6b2c';

    set('--mc-brand-gradient', accent);
    set('--mc-brand-text-gradient', accent);
    set('--ds-gradient-orange', accent);
    set('--ds-gradient-gold', accent);
    set('--ds-gradient-brand', accent);
    set('--ds-primary', accent);
    set('--color-primary', accent);
    set('--shadow-orange', 'none');
    set('--shadow-gold', 'none');
    set('--ds-motion-fast', '0ms');
    set('--ds-motion-normal', '0ms');
    set('--motion-fast', '0ms');
    set('--motion-normal', '0ms');

    if (mode === 'light') {
      // Light peach --mc-primary from cyber branding is unreadable on white —
      // force accent + dark ink for text roles.
      set('--mc-primary', accent);
      set('--mc-primary-container', accent);
      set('--mc-secondary', brand.secondaryContainer || accent);
      set('--mc-on-surface', LIGHT_THEME_SURFACES.onSurface);
      set('--mc-on-surface-variant', LIGHT_THEME_SURFACES.onSurfaceVariant);
      set('--shadow-card', '0 4px 16px rgba(15, 23, 42, 0.08)');
      set('--dashboard-glass', LIGHT_THEME_SURFACES.surface);
    } else {
      set('--shadow-card', '0 4px 16px rgba(0, 0, 0, 0.35)');
    }
  }

  private writeSurfaces(s: ThemeSurfacePalette): void {
    const root = document.documentElement;
    const set = (name: string, value: string) => root.style.setProperty(name, value);

    set('--color-background', s.surfaceContainerLow);
    set('--color-surface', s.surface);
    set('--color-surface-elevated', s.surfaceContainer);
    set('--color-text', s.onSurface);
    set('--color-muted', s.onSurfaceVariant);
    set('--color-border', s.outline);

    set('--ds-background', s.surfaceContainerLow);
    set('--ds-surface', s.surface);
    set('--ds-surface-alt', s.surfaceContainer);
    set('--ds-border', s.outline);
    set('--ds-text', s.onSurface);
    set('--ds-text-muted', s.onSurfaceVariant);

    set('--mc-surface', s.surface);
    set('--mc-surface-container', s.surfaceContainer);
    set('--mc-surface-container-low', s.surfaceContainerLow);
    set('--mc-surface-container-lowest', s.surfaceContainerLow);
    set('--mc-surface-container-high', s.surfaceContainer);
    set('--mc-surface-container-highest', s.outline);
    set('--mc-on-surface', s.onSurface);
    set('--mc-on-surface-variant', s.onSurfaceVariant);
    set('--mc-outline', s.outline);
    set('--mc-outline-variant', s.outline);

    set('--bg-main', s.surfaceContainerLow);
    set('--bg-login', s.surfaceContainerLow);
    set('--bg-left-panel', s.surfaceContainerLow);
    set('--bg-dark-blue', s.surface);
    set('--bg-nav-color', s.onSurfaceVariant);
    set('--bg-grey', s.onSurfaceVariant);
    set('--bg-label', s.onSurfaceVariant);
    set('--bg-card-border', s.outline);
    set('--bg-border-input', s.outline);
    set('--bg-input-border', s.outline);
    set('--bg-input', s.surface);
    set('--bg-divider', s.outline);
    set('--bg-tab-nav', s.surface);
    set('--bg-tab-active', s.surfaceContainer);
    set('--bg-list', s.surface);
    set('--bg-list-active', s.surfaceContainer);
    set('--bg-dropdown', s.surfaceContainer);
    set('--bg-panel-acco', s.surface);
    set('--bg-img', s.surfaceContainer);
    set('--dashboard-glass', `color-mix(in srgb, ${s.surface} 92%, transparent)`);
  }

  private readStored(): AppThemeMode {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === 'default' || raw === 'dark' || raw === 'light') {
        return raw;
      }
    } catch {
      // ignore
    }
    return 'default';
  }
}

import { AppBranding, BrandingPreset, BrandingThemeColors } from './branding.model';

export const DEFAULT_BRAND_LOGO = 'assets/images/logo-majestic-hourse.svg';
export const DEFAULT_BRAND_FAVICON = 'assets/icons/favicon-196.png';

/**
 * Default theme aligned to design.xml + docs/design_v1 (Enterprise Bitcoin).
 * Values map onto existing --mc-* tokens used across the app.
 */
export const DEFAULT_THEME_COLORS: BrandingThemeColors = {
  // Background / surfaces
  surface: '#0F1115',
  surfaceContainer: '#171A20',
  surfaceContainerLow: '#030304',
  // Text
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#94A3B8',
  // Brand orange
  primary: '#F7931A',
  primaryContainer: '#F7931A',
  // Gold accents
  secondary: '#FFD600',
  secondaryContainer: '#EA580C',
  // Supporting accents
  tertiary: '#FFD600',
  tertiaryContainer: '#FFD600',
  // Border
  outline: '#1E293B',
  // Gradients: Orange → Bitcoin → Gold
  gradientStart: '#EA580C',
  gradientMid: '#F7931A',
  gradientEnd: '#FFD600',
};

export const DEFAULT_APP_BRANDING: AppBranding = {
  appName: 'Majestic Warhorse',
  tagline: 'Learning platform for communities, schools, and instruction',
  logoUrl: DEFAULT_BRAND_LOGO,
  faviconUrl: DEFAULT_BRAND_FAVICON,
  colors: { ...DEFAULT_THEME_COLORS },
};

/** Presets stay within the Enterprise Bitcoin design system. */
export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'enterprise-bitcoin',
    label: 'Enterprise Bitcoin',
    colors: { ...DEFAULT_THEME_COLORS },
  },
  {
    id: 'gold-ledger',
    label: 'Gold Ledger',
    colors: {
      surface: '#0F1115',
      surfaceContainer: '#171A20',
      surfaceContainerLow: '#030304',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#94A3B8',
      primary: '#FFD600',
      primaryContainer: '#F7931A',
      secondary: '#FFD600',
      secondaryContainer: '#F7931A',
      tertiary: '#FFD600',
      tertiaryContainer: '#EA580C',
      outline: '#1E293B',
      gradientStart: '#F7931A',
      gradientMid: '#FFD600',
      gradientEnd: '#FFD600',
    },
  },
  {
    id: 'deep-ledger',
    label: 'Deep Ledger',
    colors: {
      surface: '#030304',
      surfaceContainer: '#0F1115',
      surfaceContainerLow: '#030304',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#94A3B8',
      primary: '#F7931A',
      primaryContainer: '#EA580C',
      secondary: '#FFD600',
      secondaryContainer: '#EA580C',
      tertiary: '#F7931A',
      tertiaryContainer: '#FFD600',
      outline: '#1E293B',
      gradientStart: '#EA580C',
      gradientMid: '#EA580C',
      gradientEnd: '#F7931A',
    },
  },
  {
    id: 'ramp-warm',
    label: 'Ramp Warm',
    colors: {
      surface: '#0F1115',
      surfaceContainer: '#171A20',
      surfaceContainerLow: '#0A0B0E',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#94A3B8',
      primary: '#F7931A',
      primaryContainer: '#F7931A',
      secondary: '#FFD600',
      secondaryContainer: '#F59E0B',
      tertiary: '#FFD600',
      tertiaryContainer: '#F7931A',
      outline: '#1E293B',
      gradientStart: '#EA580C',
      gradientMid: '#F7931A',
      gradientEnd: '#F59E0B',
    },
  },
];

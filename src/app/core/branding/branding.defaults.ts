import { AppBranding, BrandingPreset, BrandingThemeColors } from './branding.model';

export const DEFAULT_BRAND_LOGO = 'assets/images/logo-majestic-hourse.svg';
export const DEFAULT_BRAND_FAVICON = 'assets/icons/favicon-196.png';

/** Canonical brand gradient used across the product. */
export const BRAND_GRADIENT =
  'linear-gradient(135deg, #ff6b2c 0%, #ab0063 50%, #4a0084 100%)';

/**
 * Default theme — surfaces from design.xml; brand gradient is Majestic Cyber
 * (orange → magenta → purple). BrandingService applies --mc-brand-gradient.
 */
export const DEFAULT_THEME_COLORS: BrandingThemeColors = {
  surface: '#0F1115',
  surfaceContainer: '#171A20',
  surfaceContainerLow: '#030304',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#94A3B8',
  primary: '#ffb59a',
  primaryContainer: '#ff6b2c',
  secondary: '#ffb0cc',
  secondaryContainer: '#ab0063',
  tertiary: '#dcb8ff',
  tertiaryContainer: '#4a0084',
  outline: '#1E293B',
  gradientStart: '#ff6b2c',
  gradientMid: '#ab0063',
  gradientEnd: '#4a0084',
};

export const DEFAULT_APP_BRANDING: AppBranding = {
  appName: 'Majestic Warhorse',
  tagline: 'Learning platform for communities, schools, and instruction',
  logoUrl: DEFAULT_BRAND_LOGO,
  faviconUrl: DEFAULT_BRAND_FAVICON,
  colors: { ...DEFAULT_THEME_COLORS },
};

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'majestic-cyber',
    label: 'Majestic Cyber',
    colors: { ...DEFAULT_THEME_COLORS },
  },
  {
    id: 'ember-academy',
    label: 'Ember Academy',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primaryContainer: '#e85d04',
      secondaryContainer: '#9c2d0e',
      tertiaryContainer: '#c47a00',
      gradientStart: '#ff6b2c',
      gradientMid: '#ab0063',
      gradientEnd: '#4a0084',
    },
  },
  {
    id: 'ocean-school',
    label: 'Ocean School',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#7ec8ff',
      primaryContainer: '#1f7aec',
      secondary: '#9ad4c8',
      secondaryContainer: '#0d7377',
      tertiary: '#b8a9ff',
      tertiaryContainer: '#5c4db8',
      // Keep product brand gradient unless org customizes
      gradientStart: '#ff6b2c',
      gradientMid: '#ab0063',
      gradientEnd: '#4a0084',
    },
  },
  {
    id: 'forest-community',
    label: 'Forest Community',
    colors: {
      ...DEFAULT_THEME_COLORS,
      primary: '#a8e6a1',
      primaryContainer: '#2d6a4f',
      secondary: '#d8f3dc',
      secondaryContainer: '#40916c',
      tertiary: '#f4a261',
      tertiaryContainer: '#bc6c25',
      gradientStart: '#ff6b2c',
      gradientMid: '#ab0063',
      gradientEnd: '#4a0084',
    },
  },
];

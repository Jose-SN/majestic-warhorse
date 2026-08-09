import { AppBranding, BrandingPreset, BrandingThemeColors } from './branding.model';

export const DEFAULT_BRAND_LOGO = 'assets/images/logo-majestic-hourse.svg';
export const DEFAULT_BRAND_FAVICON = 'assets/icons/favicon-196.png';

/** Canonical brand gradient used across the product. */
export const BRAND_GRADIENT =
  'linear-gradient(135deg, #ff6b2c 0%, #ab0063 50%, #4a0084 100%)';

const baseSurfaces = {
  surface: '#0F1115',
  surfaceContainer: '#171A20',
  surfaceContainerLow: '#030304',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#94A3B8',
  outline: '#1E293B',
} as const;

/**
 * Default theme — dark surfaces + PetaxAI Learning brand gradient.
 * BrandingService applies --mc-brand-gradient from gradientStart/Mid/End.
 */
export const DEFAULT_THEME_COLORS: BrandingThemeColors = {
  ...baseSurfaces,
  primary: '#ffb59a',
  primaryContainer: '#ff6b2c',
  secondary: '#ffb0cc',
  secondaryContainer: '#ab0063',
  tertiary: '#dcb8ff',
  tertiaryContainer: '#4a0084',
  gradientStart: '#ff6b2c',
  gradientMid: '#ab0063',
  gradientEnd: '#4a0084',
};

export const DEFAULT_APP_BRANDING: AppBranding = {
  appName: 'PetaxAI Learning',
  tagline: 'Learning platform for communities, schools, and instruction',
  logoUrl: DEFAULT_BRAND_LOGO,
  faviconUrl: DEFAULT_BRAND_FAVICON,
  colors: { ...DEFAULT_THEME_COLORS },
};

function preset(
  id: string,
  label: string,
  colors: Partial<BrandingThemeColors>
): BrandingPreset {
  return {
    id,
    label,
    colors: { ...DEFAULT_THEME_COLORS, ...colors },
  };
}

/** Org customize presets — each has a distinct gradient + accent set. */
export const BRANDING_PRESETS: BrandingPreset[] = [
  preset('majestic-cyber', 'PetaxAI Signature', {}),
  preset('ember-academy', 'Ember Academy', {
    primary: '#ffc9a8',
    primaryContainer: '#e85d04',
    secondary: '#ffb4a2',
    secondaryContainer: '#9c2d0e',
    tertiary: '#ffe08a',
    tertiaryContainer: '#c47a00',
    gradientStart: '#ff6b2c',
    gradientMid: '#e85d04',
    gradientEnd: '#9c2d0e',
  }),
  preset('ocean-school', 'Ocean School', {
    primary: '#7ec8ff',
    primaryContainer: '#1f7aec',
    secondary: '#9ad4c8',
    secondaryContainer: '#0d7377',
    tertiary: '#b8a9ff',
    tertiaryContainer: '#5c4db8',
    gradientStart: '#1f7aec',
    gradientMid: '#0d7377',
    gradientEnd: '#5c4db8',
  }),
  preset('forest-community', 'Forest Community', {
    primary: '#a8e6a1',
    primaryContainer: '#2d6a4f',
    secondary: '#d8f3dc',
    secondaryContainer: '#40916c',
    tertiary: '#f4a261',
    tertiaryContainer: '#bc6c25',
    gradientStart: '#2d6a4f',
    gradientMid: '#40916c',
    gradientEnd: '#bc6c25',
  }),
  preset('midnight-gold', 'Midnight Gold', {
    surface: '#0B0D12',
    surfaceContainer: '#141824',
    surfaceContainerLow: '#050608',
    primary: '#ffe9a8',
    primaryContainer: '#d4a017',
    secondary: '#fff1c2',
    secondaryContainer: '#8a6a12',
    tertiary: '#c9d4ff',
    tertiaryContainer: '#3d4a7a',
    outline: '#252A38',
    gradientStart: '#d4a017',
    gradientMid: '#8a6a12',
    gradientEnd: '#3d4a7a',
  }),
  preset('royal-violet', 'Royal Violet', {
    primary: '#e0c3ff',
    primaryContainer: '#7c3aed',
    secondary: '#f0abfc',
    secondaryContainer: '#a21caf',
    tertiary: '#c4b5fd',
    tertiaryContainer: '#4c1d95',
    gradientStart: '#7c3aed',
    gradientMid: '#a21caf',
    gradientEnd: '#4c1d95',
  }),
  preset('coral-dawn', 'Coral Dawn', {
    primary: '#ffc2b8',
    primaryContainer: '#ff6f61',
    secondary: '#ffd6e0',
    secondaryContainer: '#e83e8c',
    tertiary: '#ffe0b2',
    tertiaryContainer: '#fb8c00',
    gradientStart: '#ff6f61',
    gradientMid: '#e83e8c',
    gradientEnd: '#fb8c00',
  }),
  preset('arctic-ice', 'Arctic Ice', {
    primary: '#b8e8ff',
    primaryContainer: '#38bdf8',
    secondary: '#bae6fd',
    secondaryContainer: '#0284c7',
    tertiary: '#a5f3fc',
    tertiaryContainer: '#0e7490',
    gradientStart: '#38bdf8',
    gradientMid: '#0284c7',
    gradientEnd: '#0e7490',
  }),
  preset('sunset-campus', 'Sunset Campus', {
    primary: '#ffd1a8',
    primaryContainer: '#f97316',
    secondary: '#fecdd3',
    secondaryContainer: '#e11d48',
    tertiary: '#fde68a',
    tertiaryContainer: '#b45309',
    gradientStart: '#f97316',
    gradientMid: '#e11d48',
    gradientEnd: '#7c2d12',
  }),
  preset('slate-professional', 'Slate Professional', {
    surface: '#0F1419',
    surfaceContainer: '#1A222C',
    surfaceContainerLow: '#0A0E12',
    primary: '#93c5fd',
    primaryContainer: '#3b82f6',
    secondary: '#cbd5e1',
    secondaryContainer: '#475569',
    tertiary: '#a5b4fc',
    tertiaryContainer: '#4338ca',
    outline: '#334155',
    gradientStart: '#3b82f6',
    gradientMid: '#475569',
    gradientEnd: '#4338ca',
  }),
  preset('crimson-ledger', 'Crimson Ledger', {
    primary: '#fecaca',
    primaryContainer: '#dc2626',
    secondary: '#fda4af',
    secondaryContainer: '#9f1239',
    tertiary: '#fcd34d',
    tertiaryContainer: '#b45309',
    gradientStart: '#dc2626',
    gradientMid: '#9f1239',
    gradientEnd: '#7f1d1d',
  }),
  preset('aurora-borealis', 'Aurora Borealis', {
    primary: '#a7f3d0',
    primaryContainer: '#10b981',
    secondary: '#a5f3fc',
    secondaryContainer: '#0891b2',
    tertiary: '#c4b5fd',
    tertiaryContainer: '#6d28d9',
    gradientStart: '#10b981',
    gradientMid: '#0891b2',
    gradientEnd: '#6d28d9',
  }),
];

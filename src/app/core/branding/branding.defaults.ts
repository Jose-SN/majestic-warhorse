import { AppBranding, BrandingPreset, BrandingThemeColors } from './branding.model';

export const DEFAULT_BRAND_LOGO = 'assets/images/logo-majestic-hourse.svg';
export const DEFAULT_BRAND_FAVICON = 'assets/icons/favicon-196.png';

export const DEFAULT_THEME_COLORS: BrandingThemeColors = {
  surface: '#131316',
  surfaceContainer: '#1f1f22',
  surfaceContainerLow: '#1b1b1e',
  onSurface: '#e4e1e6',
  onSurfaceVariant: '#e2bfb3',
  primary: '#ffb59a',
  primaryContainer: '#ff6b2c',
  secondary: '#ffb0cc',
  secondaryContainer: '#ab0063',
  tertiary: '#dcb8ff',
  tertiaryContainer: '#bb7bff',
  outline: '#a98a7f',
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
      surface: '#1a1210',
      surfaceContainer: '#2a1c18',
      surfaceContainerLow: '#221714',
      onSurface: '#f5e6df',
      onSurfaceVariant: '#e8c4b0',
      primary: '#ffb59a',
      primaryContainer: '#e85d04',
      secondary: '#ffc9a8',
      secondaryContainer: '#9c2d0e',
      tertiary: '#ffd166',
      tertiaryContainer: '#c47a00',
      outline: '#b08968',
      gradientStart: '#e85d04',
      gradientMid: '#9c2d0e',
      gradientEnd: '#3d1a0a',
    },
  },
  {
    id: 'ocean-school',
    label: 'Ocean School',
    colors: {
      surface: '#0d141c',
      surfaceContainer: '#162230',
      surfaceContainerLow: '#121c28',
      onSurface: '#e2eaf2',
      onSurfaceVariant: '#a8c0d4',
      primary: '#7ec8ff',
      primaryContainer: '#1f7aec',
      secondary: '#9ad4c8',
      secondaryContainer: '#0d7377',
      tertiary: '#b8a9ff',
      tertiaryContainer: '#5c4db8',
      outline: '#6b8599',
      gradientStart: '#1f7aec',
      gradientMid: '#0d7377',
      gradientEnd: '#1a2744',
    },
  },
  {
    id: 'forest-community',
    label: 'Forest Community',
    colors: {
      surface: '#101612',
      surfaceContainer: '#1a241c',
      surfaceContainerLow: '#151e17',
      onSurface: '#e6efe8',
      onSurfaceVariant: '#b5cbb8',
      primary: '#a8e6a1',
      primaryContainer: '#2d6a4f',
      secondary: '#d8f3dc',
      secondaryContainer: '#40916c',
      tertiary: '#f4a261',
      tertiaryContainer: '#bc6c25',
      outline: '#7a947f',
      gradientStart: '#2d6a4f',
      gradientMid: '#40916c',
      gradientEnd: '#1b4332',
    },
  },
];

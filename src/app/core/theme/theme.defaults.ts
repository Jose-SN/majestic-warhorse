import { ThemeOption, ThemeSurfacePalette, AppThemeMode } from './theme.model';

/** Neutral dark — surfaces only; brand gradient stays from BrandingService. */
export const DARK_THEME_SURFACES: ThemeSurfacePalette = {
  surfaceContainerLow: '#0A0A0B',
  surface: '#121214',
  surfaceContainer: '#1C1C1F',
  onSurface: '#F4F4F5',
  onSurfaceVariant: '#A1A1AA',
  outline: '#27272A',
};

/** Light — high-contrast surfaces; accents flattened by ThemeService. */
export const LIGHT_THEME_SURFACES: ThemeSurfacePalette = {
  surfaceContainerLow: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceContainer: '#E2E8F0',
  onSurface: '#0F172A',
  onSurfaceVariant: '#475569',
  outline: '#CBD5E1',
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Neutral dark',
    icon: 'dark_mode',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Bright surfaces',
    icon: 'light_mode',
  },
  {
    id: 'default',
    label: 'Signature',
    description: 'PetaxAI Signature',
    icon: 'auto_awesome',
  },
];

/** Applied when nothing is stored in localStorage. */
export const DEFAULT_APP_THEME: AppThemeMode = 'dark';

export const THEME_STORAGE_KEY = 'mw-app-theme';

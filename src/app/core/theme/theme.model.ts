/** App-wide appearance modes (independent of org brand accents). */
export type AppThemeMode = 'default' | 'dark' | 'light';

export interface ThemeOption {
  id: AppThemeMode;
  label: string;
  description: string;
  icon: string;
}

export interface ThemeSurfacePalette {
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
}

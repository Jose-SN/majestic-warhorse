/** Runtime white-label / org branding (persisted per organization_id).
 * Color values follow design.xml Enterprise Bitcoin tokens; see docs/design_v1.
 */
export interface BrandingThemeColors {
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  outline: string;
  /** Start / mid / end stops for --mc-brand-gradient */
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
}

export interface AppBranding {
  appName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  colors: BrandingThemeColors;
  updatedAt?: string;
}

export interface BrandingPreset {
  id: string;
  label: string;
  colors: BrandingThemeColors;
}

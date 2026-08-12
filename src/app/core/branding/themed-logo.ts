import { BrandingThemeColors } from './branding.model';
import {
  DEFAULT_BRAND_FAVICON,
  DEFAULT_BRAND_LOGO,
  DEFAULT_THEME_COLORS,
} from './branding.defaults';

export function isDefaultBrandLogo(url?: string | null): boolean {
  if (!url) {
    return true;
  }
  const path = url.split('?')[0].split('#')[0];
  return path.endsWith('petaxai-learning-logo.svg');
}

export function isDefaultBrandFavicon(url?: string | null): boolean {
  if (!url) {
    return true;
  }
  const path = url.split('?')[0].split('#')[0];
  return (
    path.endsWith('petaxai-learning-icon.svg') ||
    path.endsWith('favicon-196.png') ||
    path.endsWith('favicon.ico')
  );
}

function gradientStops(colors: BrandingThemeColors) {
  return {
    start: colors.gradientStart || DEFAULT_THEME_COLORS.gradientStart,
    mid: colors.gradientMid || DEFAULT_THEME_COLORS.gradientMid,
    end: colors.gradientEnd || DEFAULT_THEME_COLORS.gradientEnd,
    surface: colors.surface || DEFAULT_THEME_COLORS.surface,
  };
}

/** Icon-only PetaxAI mark (favicon / collapsed sidebar). */
export function buildThemedPetaxIconDataUrl(colors: BrandingThemeColors): string {
  const { start, mid, surface } = gradientStops(colors);

  const svg = `<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGradient" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="70" height="70" rx="18"
        fill="${surface}"
        stroke="url(#iconGradient)"
        stroke-width="2"/>
  <text x="36" y="50"
        text-anchor="middle"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="40"
        font-weight="800"
        fill="url(#iconGradient)">P</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Full PetaxAI wordmark logo, recolored to the org brand gradient. */
export function buildThemedPetaxLogoDataUrl(colors: BrandingThemeColors): string {
  const { start, mid, end, surface } = gradientStops(colors);

  const svg = `<svg width="222" height="72" viewBox="0 0 222 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGradient" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="textGradient" x1="84" y1="0" x2="222" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="50%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${end}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="70" height="70" rx="18"
        fill="${surface}"
        stroke="url(#iconGradient)"
        stroke-width="2"/>
  <text x="36" y="50"
        text-anchor="middle"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="40"
        font-weight="800"
        fill="url(#iconGradient)">P</text>
  <text x="84" y="32"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="36"
        font-weight="700"
        letter-spacing="-0.6"
        textLength="136"
        lengthAdjust="spacingAndGlyphs"
        fill="url(#textGradient)">PetaxAI</text>
  <text x="84" y="62"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="24"
        font-weight="500"
        letter-spacing="-0.2"
        textLength="136"
        lengthAdjust="spacingAndGlyphs"
        fill="url(#textGradient)">Learning</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveDisplayLogoUrl(
  logoUrl: string | undefined,
  colors: BrandingThemeColors
): string {
  if (isDefaultBrandLogo(logoUrl)) {
    return buildThemedPetaxLogoDataUrl(colors);
  }
  return logoUrl || DEFAULT_BRAND_LOGO;
}

export function resolveDisplayFaviconUrl(
  faviconUrl: string | undefined,
  colors: BrandingThemeColors
): string {
  if (isDefaultBrandFavicon(faviconUrl)) {
    return buildThemedPetaxIconDataUrl(colors);
  }
  return faviconUrl || DEFAULT_BRAND_FAVICON;
}

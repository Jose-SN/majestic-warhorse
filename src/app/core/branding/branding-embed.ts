import { AppBranding } from './branding.model';

/** postMessage type used by website / how-it-works embeds. */
export const BRANDING_EMBED_MESSAGE_TYPE = 'mw-branding';

export interface BrandingEmbedPayload {
  appName: string;
  tagline: string;
  logoUrl: string;
  colors: {
    primary: string;
    primaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    tertiary: string;
    tertiaryContainer: string;
    surface: string;
    surfaceContainer: string;
    surfaceContainerLow: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
  };
}

export function toBrandingEmbedPayload(branding: AppBranding): BrandingEmbedPayload {
  const c = branding.colors;
  return {
    appName: branding.appName,
    tagline: branding.tagline,
    logoUrl: branding.logoUrl,
    colors: {
      primary: c.primary,
      primaryContainer: c.primaryContainer,
      secondary: c.secondary,
      secondaryContainer: c.secondaryContainer,
      tertiary: c.tertiary,
      tertiaryContainer: c.tertiaryContainer,
      surface: c.surface,
      surfaceContainer: c.surfaceContainer,
      surfaceContainerLow: c.surfaceContainerLow,
      onSurface: c.onSurface,
      onSurfaceVariant: c.onSurfaceVariant,
      outline: c.outline,
      gradientStart: c.gradientStart,
      gradientMid: c.gradientMid,
      gradientEnd: c.gradientEnd,
    },
  };
}

export function postBrandingToFrame(
  frame: HTMLIFrameElement | null | undefined,
  branding: AppBranding
): void {
  const win = frame?.contentWindow;
  if (!win) {
    return;
  }
  win.postMessage(
    {
      type: BRANDING_EMBED_MESSAGE_TYPE,
      payload: toBrandingEmbedPayload(branding),
    },
    window.location.origin
  );
}

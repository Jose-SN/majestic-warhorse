import { environment } from 'src/environments/environment';

/** OAuth callback URL — production always uses the configured appUrl, not a cached dev value. */
export function getOAuthCallbackUrl(): string {
  const origin = environment.production
    ? environment.appUrl
    : typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : environment.appUrl;
  console.log('origin', origin);
  return `${origin.replace(/\/$/, '')}/auth/callback`;
}

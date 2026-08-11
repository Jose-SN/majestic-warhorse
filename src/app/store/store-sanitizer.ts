import { Action } from '@ngrx/store';

const REDACTED = '[REDACTED]';

const SENSITIVE_EXACT = new Set([
  'token',
  'authtoken',
  'auth_token',
  'jwt',
  'user',
  'password',
  'secret',
  'authorization',
  'login_details',
  'logindetails',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_EXACT.has(lower)) {
    return true;
  }
  return lower.endsWith('token') || lower.endsWith('secret') || lower.includes('password');
}

function redact(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redact(source[key]);
    }
    return out;
  }
  return value;
}

/** Strip tokens and user payloads before they reach Redux DevTools. */
export function stateSanitizer(state: unknown, _index: number): unknown {
  return redact(state);
}

/** Strip tokens and user payloads from action bodies in DevTools. */
export function actionSanitizer(action: Action, _id: number): Action {
  return redact(action) as unknown as Action;
}

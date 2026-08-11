import { actionSanitizer, stateSanitizer } from './store-sanitizer';

describe('store-sanitizer', () => {
  it('redacts token and user from state without mutating the original', () => {
    const state = {
      auth: {
        token: 'secret-jwt',
        user: { email: 'a@b.com' },
        organizationId: 'org-1',
      },
    };

    const sanitized = stateSanitizer(state, 0) as typeof state;

    expect(sanitized.auth.token).toBe('[REDACTED]');
    expect(sanitized.auth.user).toBe('[REDACTED]');
    expect(sanitized.auth.organizationId).toBe('org-1');
    expect(state.auth.token).toBe('secret-jwt');
  });

  it('redacts nested action payloads', () => {
    const action = {
      type: '[Auth] Establish Session',
      authToken: 'abc',
      login_details: { name: 'Ada' },
      organizationId: 'org-1',
    };

    const sanitized = actionSanitizer(action, 1) as typeof action;

    expect(sanitized.type).toBe('[Auth] Establish Session');
    expect(sanitized.authToken).toBe('[REDACTED]');
    expect(sanitized.login_details).toBe('[REDACTED]');
    expect(sanitized.organizationId).toBe('org-1');
  });
});

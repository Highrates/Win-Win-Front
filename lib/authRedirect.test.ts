import { describe, expect, it } from 'vitest';
import { defaultPostAuthPath, sanitizeCallbackUrl } from './authRedirect';

describe('sanitizeCallbackUrl', () => {
  it('allows internal account paths', () => {
    expect(sanitizeCallbackUrl('/account/favorites')).toBe('/account/favorites');
    expect(sanitizeCallbackUrl('/account/profile?tab=info')).toBe('/account/profile?tab=info');
  });

  it('rejects external and auth guest paths', () => {
    expect(sanitizeCallbackUrl('https://evil.test')).toBe('/account/orders');
    expect(sanitizeCallbackUrl('//evil.test/x')).toBe('/account/orders');
    expect(sanitizeCallbackUrl('/login/email')).toBe('/account/orders');
    expect(sanitizeCallbackUrl('/register/phone')).toBe('/account/orders');
  });

  it('uses fallback when empty', () => {
    expect(sanitizeCallbackUrl(null)).toBe('/account/orders');
    expect(sanitizeCallbackUrl('   ')).toBe('/account/orders');
  });
});

describe('defaultPostAuthPath', () => {
  it('welcome path when onboarding pending', () => {
    expect(defaultPostAuthPath({ profile: { profileOnboardingPending: true } })).toBe(
      '/account/profile?tab=info&welcome=1',
    );
  });

  it('orders otherwise', () => {
    expect(defaultPostAuthPath({ profile: { profileOnboardingPending: false } })).toBe('/account/orders');
    expect(defaultPostAuthPath(null)).toBe('/account/orders');
  });
});

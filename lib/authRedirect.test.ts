import { describe, expect, it } from 'vitest';
import {
  buildDesignerInviteProfilePath,
  defaultPostAuthPath,
  isGuestAuthPath,
  sanitizeCallbackUrl,
} from './authRedirect';

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
    expect(sanitizeCallbackUrl('/register/email')).toBe('/account/orders');
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

describe('isGuestAuthPath', () => {
  it('marks login/register entry points', () => {
    expect(isGuestAuthPath('/login')).toBe(true);
    expect(isGuestAuthPath('/login/email')).toBe(true);
    expect(isGuestAuthPath('/register')).toBe(true);
    expect(isGuestAuthPath('/register/email')).toBe(true);
  });

  it('excludes forgot/reset password from guest-auth redirect trap', () => {
    expect(isGuestAuthPath('/login/forgot-password')).toBe(false);
    expect(isGuestAuthPath('/login/reset-password')).toBe(false);
  });
});

describe('buildDesignerInviteProfilePath', () => {
  it('builds partner apply profile URL', () => {
    expect(buildDesignerInviteProfilePath()).toBe('/account/profile?tab=info&partnerApply=1');
    expect(buildDesignerInviteProfilePath('REF1')).toBe(
      '/account/profile?tab=info&partnerApply=1&prefillRef=REF1',
    );
  });
});

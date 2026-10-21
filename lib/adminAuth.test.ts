import { describe, expect, it } from 'vitest';
import { buildAdminLoginHref, sanitizeAdminCallbackUrl } from './adminAuth';

describe('sanitizeAdminCallbackUrl', () => {
  it('allows internal admin paths with query', () => {
    expect(sanitizeAdminCallbackUrl('/admin')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/admin/clients/abc')).toBe('/admin/clients/abc');
    expect(sanitizeAdminCallbackUrl('/admin/orders?bucket=new')).toBe('/admin/orders?bucket=new');
  });

  it('rejects login path even with query/hash (post-login loop)', () => {
    expect(sanitizeAdminCallbackUrl('/admin/login')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/admin/login?from=/admin')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/admin/login#x')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/admin/login/extra')).toBe('/admin');
  });

  it('rejects external and non-admin paths', () => {
    expect(sanitizeAdminCallbackUrl('https://evil.test')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('//evil.test/x')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/account/orders')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('/administrator')).toBe('/admin');
  });

  it('uses fallback when empty', () => {
    expect(sanitizeAdminCallbackUrl(null)).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('   ')).toBe('/admin');
    expect(sanitizeAdminCallbackUrl('', '/admin/orders')).toBe('/admin/orders');
  });
});

describe('buildAdminLoginHref', () => {
  it('adds from=pathname only (strips query/hash), matching middleware', () => {
    expect(buildAdminLoginHref('/admin/orders')).toBe('/admin/login?from=%2Fadmin%2Forders');
    expect(buildAdminLoginHref('/admin/orders?bucket=new')).toBe('/admin/login?from=%2Fadmin%2Forders');
    expect(buildAdminLoginHref('/admin')).toBe('/admin/login?from=%2Fadmin');
  });

  it('omits from for login / invalid / empty', () => {
    expect(buildAdminLoginHref('/admin/login')).toBe('/admin/login');
    expect(buildAdminLoginHref('/admin/login?x=1')).toBe('/admin/login');
    expect(buildAdminLoginHref('/account')).toBe('/admin/login');
    expect(buildAdminLoginHref('//evil')).toBe('/admin/login');
    expect(buildAdminLoginHref(null)).toBe('/admin/login');
    expect(buildAdminLoginHref('')).toBe('/admin/login');
  });
});

import { staffCanAccessAdminPath } from '@win-win/admin-sections';
import { describe, expect, it } from 'vitest';

describe('staffCanAccessAdminPath (frontend contract)', () => {
  it('denies unknown pathname for moderator', () => {
    expect(staffCanAccessAdminPath('/admin/foo', ['orders'], false)).toBe(false);
  });

  it('allows dashboard and staff/me for moderator without extra sections', () => {
    expect(staffCanAccessAdminPath('/admin', [], false)).toBe(true);
    expect(staffCanAccessAdminPath('/admin/settings/staff/me', [], false)).toBe(true);
  });

  it('allows login path without staff context', () => {
    expect(staffCanAccessAdminPath('/admin/login', [], false)).toBe(true);
  });
});

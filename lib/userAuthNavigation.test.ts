/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateAfterUserAuth } from './userAuthNavigation';

vi.mock('@/lib/userSessionClient', () => ({
  invalidateUserClientCaches: vi.fn(),
}));

describe('navigateAfterUserAuth (L5 hard nav)', () => {
  const replace = vi.fn();

  beforeEach(() => {
    replace.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, replace },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses window.location.replace, not soft router', async () => {
    const result = await navigateAfterUserAuth({
      callbackUrl: '/account/favorites',
    });
    expect(result).toEqual({ ok: true });
    expect(replace).toHaveBeenCalledWith('/account/favorites');
  });

  it('sanitizes guest auth callback to default orders', async () => {
    await navigateAfterUserAuth({ callbackUrl: '/login/email' });
    expect(replace).toHaveBeenCalledWith('/account/orders');
  });

  it('after designer invite claim → profile hard nav', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ prefillRef: 'REF' }),
      }),
    );
    await navigateAfterUserAuth({ designerInviteToken: 'tok' });
    expect(replace).toHaveBeenCalledWith(
      '/account/profile?tab=info&partnerApply=1&prefillRef=REF',
    );
  });
});

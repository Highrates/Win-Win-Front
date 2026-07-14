import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicSiteOriginFromEnv } from './serverRequestOrigin';

describe('getPublicSiteOriginFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers FRONTEND_PUBLIC_URL and strips trailing slash', () => {
    vi.stubEnv('FRONTEND_PUBLIC_URL', 'https://win-win.su/');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://other.example');
    expect(getPublicSiteOriginFromEnv()).toBe('https://win-win.su');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('FRONTEND_PUBLIC_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://win-win.su');
    expect(getPublicSiteOriginFromEnv()).toBe('https://win-win.su');
  });

  it('returns null when unset', () => {
    vi.stubEnv('FRONTEND_PUBLIC_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(getPublicSiteOriginFromEnv()).toBeNull();
  });
});

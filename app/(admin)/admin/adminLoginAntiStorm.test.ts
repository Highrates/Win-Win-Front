import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Регрессия шторма `_rsc` на /admin/login (useSearchParams + router.refresh + AdminChrome),
 * из‑за которого `next dev` не обслуживал вход в ЛК.
 */
const ADMIN_DIR = join(__dirname);

function readAdminSrc(...parts: string[]): string {
  return readFileSync(join(ADMIN_DIR, ...parts), 'utf8');
}

describe('admin login anti-storm contracts', () => {
  it('root layout is passthrough; chrome only in (shell) — login is sibling (L4)', () => {
    const root = readAdminSrc('layout.tsx');
    expect(root).not.toMatch(/AdminChrome/);
    expect(root).toMatch(/return\s+<>\s*\{children\}\s*<\/>/);

    const shell = readAdminSrc('(shell)', 'layout.tsx');
    expect(shell).toMatch(/<AdminChrome/);
    expect(shell).toMatch(/\bbuildAdminLoginHref\b/);
    // Shell must not special-case login via x-pathname — login is outside the group.
    expect(shell).not.toMatch(/pathname\s*===\s*['"]\/admin\/login['"]/);
  });

  it('AdminLoginForm: no useSearchParams / router.refresh; hard nav + sanitize', () => {
    const form = readAdminSrc('login', 'AdminLoginForm.tsx');
    expect(form).not.toMatch(/\buseSearchParams\b/);
    expect(form).not.toMatch(/\brouter\.refresh\s*\(/);
    expect(form).not.toMatch(/from\s+['"]next\/navigation['"]/);
    expect(form).toMatch(/\bsanitizeAdminCallbackUrl\b/);
    expect(form).toMatch(/window\.location\.replace\s*\(\s*sanitizeAdminCallbackUrl/);
    expect(form).toMatch(/window\.location\.assign\s*\(\s*sanitizeAdminCallbackUrl/);
  });

  it('login page: passes sanitized from from server searchParams (no client hook)', () => {
    const page = readAdminSrc('login', 'page.tsx');
    expect(page).not.toMatch(/\buseSearchParams\b/);
    expect(page).toMatch(/\bsanitizeAdminCallbackUrl\b/);
    expect(page).toMatch(/<AdminLoginForm[\s\S]*from=\{from\}/);
  });

  it('AdminChrome: locale auto-sync must not call router.refresh (manual switch may)', () => {
    const chrome = readAdminSrc('AdminChrome.tsx');
    const syncKey = 'localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY)';
    const syncStart = chrome.indexOf(syncKey);
    const setAdminLocale = chrome.indexOf('function setAdminLocale');
    expect(syncStart, 'locale sync block missing').toBeGreaterThanOrEqual(0);
    expect(setAdminLocale, 'setAdminLocale missing').toBeGreaterThan(syncStart);

    const autoSyncBlock = chrome.slice(syncStart, setAdminLocale);
    expect(autoSyncBlock).not.toMatch(/\brouter\.refresh\s*\(/);
    expect(autoSyncBlock).toMatch(/\bsetLocale\s*\(/);

    const manualBlock = chrome.slice(setAdminLocale, setAdminLocale + 400);
    expect(manualBlock).toMatch(/\brouter\.refresh\s*\(/);
  });

  it('shell layout / RouteGuard redirect to login with from=pathname (L3)', () => {
    const shell = readAdminSrc('(shell)', 'layout.tsx');
    expect(shell).toMatch(/redirect\(\s*buildAdminLoginHref\(/);
    expect(shell).not.toMatch(/redirect\(\s*['"]\/admin\/login['"]\s*\)/);

    const guard = readFileSync(
      join(ADMIN_DIR, '../../../lib/adminPermissions/AdminRouteGuard.tsx'),
      'utf8',
    );
    expect(guard).toMatch(/buildAdminLoginHref\(\s*pathname\s*\)/);
    expect(guard).not.toMatch(/replace\(\s*['"]\/admin\/login['"]\s*\)/);
  });
});

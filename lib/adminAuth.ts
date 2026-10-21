/** Имя httpOnly-cookie с JWT для админки (должно совпадать в middleware и API routes). */
export const ADMIN_ACCESS_TOKEN_COOKIE = 'admin_access_token';

export const ADMIN_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/**
 * Безопасный внутренний путь после admin login (`?from=`).
 * Как `sanitizeCallbackUrl`: только относительный `/admin…`, без open redirect и без возврата на `/admin/login`.
 */
export function sanitizeAdminCallbackUrl(raw: string | null | undefined, fallback = '/admin'): string {
  const v = (raw ?? '').trim();
  if (!v.startsWith('/') || v.startsWith('//')) return fallback;
  const pathOnly = v.split('?')[0]?.split('#')[0] ?? v;
  if (pathOnly !== '/admin' && !pathOnly.startsWith('/admin/')) return fallback;
  if (pathOnly === '/admin/login' || pathOnly.startsWith('/admin/login/')) return fallback;
  return v;
}

/**
 * URL страницы логина админки. `from` — только pathname (как middleware), без query/hash.
 */
export function buildAdminLoginHref(fromPathname?: string | null): string {
  const pathOnly = (fromPathname ?? '').trim().split('?')[0]?.split('#')[0] ?? '';
  if (
    !pathOnly.startsWith('/') ||
    pathOnly.startsWith('//') ||
    pathOnly === '/admin/login' ||
    pathOnly.startsWith('/admin/login/') ||
    (pathOnly !== '/admin' && !pathOnly.startsWith('/admin/'))
  ) {
    return '/admin/login';
  }
  return `/admin/login?from=${encodeURIComponent(pathOnly)}`;
}

/**
 * Флаг Secure для cookie админки. По HTTPS (в т.ч. за nginx с x-forwarded-proto: https) — true.
 * По HTTP без TLS — false, иначе браузер не сохранит cookie и вход в админку «не держится».
 * Принудительно: ADMIN_COOKIE_SECURE=0 | 1 в env на сервере Next.
 */
export function adminCookieSecure(request: Request): boolean {
  const v = process.env.ADMIN_COOKIE_SECURE?.toLowerCase();
  if (v === '0' || v === 'false' || v === 'off') return false;
  if (v === '1' || v === 'true' || v === 'on') return true;
  const fwd = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (fwd === 'https') return true;
  if (fwd === 'http') return false;
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

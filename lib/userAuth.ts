/** Имя httpOnly-cookie с JWT покупателя (личный кабинет). */
export const USER_ACCESS_TOKEN_COOKIE = 'user_access_token';

export const USER_TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/**
 * Флаг Secure для cookie покупателя. По HTTPS — true; по HTTP — false,
 * иначе браузер не сохранит cookie.
 * Принудительно: USER_COOKIE_SECURE=0 | 1 в env на сервере Next.
 */
export function userCookieSecure(request: Request): boolean {
  const v = process.env.USER_COOKIE_SECURE?.toLowerCase();
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


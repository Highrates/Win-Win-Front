import { clearLikesMeBatchCache } from '@/lib/likesMeBatch';

/** Устаревший ключ localStorage (до перехода на httpOnly cookie). */
const LEGACY_USER_ACCESS_TOKEN_KEY = 'winwin_user_access_token';

function clearLegacyUserAccessTokenStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LEGACY_USER_ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Событие после login/logout: провайдеры и Header обновляют auth без перезагрузки вкладки. */
export const USER_SESSION_CHANGED_EVENT = 'winwin:user-session-changed';

/**
 * Кэш результата `GET /api/user/session` на время жизни страницы (снижает N запросов с сетки карточек).
 */
let sessionAuthPromise: Promise<boolean> | null = null;

/** Прогрев с SSR (cookie / session) — один запрос session на страницу. */
export function primeCachedIsAuthenticated(authenticated: boolean): void {
  sessionAuthPromise = Promise.resolve(authenticated);
}

export function resetUserSessionClientCache(): void {
  sessionAuthPromise = null;
}

function dispatchUserSessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(USER_SESSION_CHANGED_EVENT));
}

/**
 * Сброс клиентских кэшей session и лайков (login, logout, смена пользователя).
 * `authenticated` — опционально прогреть кэш до следующего GET /api/user/session.
 */
export function invalidateUserClientCaches(opts?: { authenticated?: boolean | null }): void {
  resetUserSessionClientCache();
  clearLikesMeBatchCache();
  clearLegacyUserAccessTokenStorage();
  if (opts?.authenticated === true) primeCachedIsAuthenticated(true);
  else if (opts?.authenticated === false) primeCachedIsAuthenticated(false);
  dispatchUserSessionChanged();
}

/** @deprecated Используйте `invalidateUserClientCaches({ authenticated: false })`. */
export function resetUserClientCachesOnLogout(): void {
  invalidateUserClientCaches({ authenticated: false });
}

/**
 * После login/register cookie уже ставит BFF; здесь — сброс кэшей и событие для UI.
 * Резервный путь: POST /api/user/session (использует `establishUserSessionResponse`).
 */
export async function establishUserClientSession(accessToken: string): Promise<void> {
  const token = accessToken.trim();
  if (!token) return;

  try {
    const res = await fetch('/api/user/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_token: token }),
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok && process.env.NODE_ENV === 'development') {
      console.warn('[establishUserClientSession] POST /api/user/session failed', res.status);
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[establishUserClientSession]', e);
    }
  }

  invalidateUserClientCaches({ authenticated: true });
}

export function getCachedIsAuthenticated(): Promise<boolean> {
  if (!sessionAuthPromise) {
    sessionAuthPromise = fetch('/api/user/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return false;
        try {
          const j = (await r.json()) as { authenticated?: boolean };
          return j.authenticated === true;
        } catch {
          return false;
        }
      })
      .catch(() => false);
  }
  return sessionAuthPromise;
}

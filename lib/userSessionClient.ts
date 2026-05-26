import { clearLikesMeBatchCache } from '@/lib/likesMeBatch';

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
  if (opts?.authenticated === true) primeCachedIsAuthenticated(true);
  else if (opts?.authenticated === false) primeCachedIsAuthenticated(false);
  dispatchUserSessionChanged();
}

/** @deprecated Используйте `invalidateUserClientCaches({ authenticated: false })`. */
export function resetUserClientCachesOnLogout(): void {
  invalidateUserClientCaches({ authenticated: false });
}

/**
 * После успешного login/register: httpOnly cookie + сброс кэшей + событие для UI.
 * Вызывать перед `router.refresh()` на публичных страницах (SSR-likes, UserAuthProvider).
 */
export async function establishUserClientSession(accessToken: string): Promise<void> {
  await fetch('/api/user/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
    credentials: 'same-origin',
    cache: 'no-store',
  }).catch(() => {});
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

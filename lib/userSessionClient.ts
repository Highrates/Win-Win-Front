/**
 * Кэш результата `GET /api/user/session` на время жизни страницы (снижает N запросов с сетки карточек).
 */
let sessionAuthPromise: Promise<boolean> | null = null;

export function resetUserSessionClientCache(): void {
  sessionAuthPromise = null;
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

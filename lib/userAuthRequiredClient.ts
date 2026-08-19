import { getCachedIsAuthenticated, invalidateUserClientCaches } from '@/lib/userSessionClient';

export class UserAuthRequiredError extends Error {
  readonly code = 'AUTH_REQUIRED' as const;

  constructor(message = 'Войдите в аккаунт') {
    super(message);
    this.name = 'UserAuthRequiredError';
  }
}

export function buildUserLoginHref(returnPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(returnPath)}`;
}

export function redirectToUserLogin(returnPath?: string): void {
  if (typeof window === 'undefined') return;
  const path =
    returnPath ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(buildUserLoginHref(path));
}

export async function ensureUserAuthenticated(returnPath: string): Promise<boolean> {
  const ok = await getCachedIsAuthenticated();
  if (!ok) {
    redirectToUserLogin(returnPath);
    return false;
  }
  return true;
}

/** Сессия истекла или cookie отсутствует — сброс кэша и переход на login. */
export function handleUserAuthRequired(returnPath: string): void {
  invalidateUserClientCaches({ authenticated: false });
  redirectToUserLogin(returnPath);
}

export function throwIfUserAuthRequired(res: Response, message?: string): void {
  if (res.status !== 401) return;
  throw new UserAuthRequiredError(message);
}

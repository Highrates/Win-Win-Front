export type PostAuthUser = {
  profile?: { profileOnboardingPending?: boolean } | null;
};

const AUTH_GUEST_PREFIXES = ['/login', '/register'] as const;

/**
 * Безопасный внутренний путь после login/register или из middleware.
 * Отсекает open redirect и возврат на guest-auth страницы.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined, fallback = '/account/orders'): string {
  const v = (raw ?? '').trim();
  if (!v.startsWith('/') || v.startsWith('//')) return fallback;
  const pathOnly = v.split('?')[0]?.split('#')[0] ?? v;
  if (AUTH_GUEST_PREFIXES.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`))) {
    return fallback;
  }
  return v;
}

export function defaultPostAuthPath(user?: PostAuthUser | null): string {
  if (user?.profile?.profileOnboardingPending === true) {
    return '/account/profile?tab=info&welcome=1';
  }
  return '/account/orders';
}

export function buildDesignerInviteProfilePath(prefillRef?: string): string {
  const q = new URLSearchParams();
  q.set('tab', 'info');
  q.set('partnerApply', '1');
  const pr = (prefillRef ?? '').trim();
  if (pr) q.set('prefillRef', pr);
  return `/account/profile?${q.toString()}`;
}

export function isGuestAuthPath(pathname: string): boolean {
  if (pathname === '/login/forgot-password' || pathname === '/login/reset-password') {
    return false;
  }
  if (pathname === '/login' || pathname === '/login/email' || pathname === '/login/phone' || pathname === '/login/otp') {
    return true;
  }
  return pathname === '/register' || pathname === '/register/phone' || pathname === '/register/email';
}

import { cookies } from 'next/headers';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';
import { clearAdminAccessTokenCookieFromStore } from '@/lib/adminSessionServer';
import { getServerApiBase } from '@/lib/serverApiBase';
import type { AdminSessionUser } from '@/lib/adminStaffTypes';

export type AdminStaffSessionPayload = {
  authenticated: boolean;
  user?: AdminSessionUser;
  error?: 'api_unreachable';
};

/** Серверная сессия админки — та же логика, что `/api/admin/session`. */
export async function getAdminStaffSession(): Promise<AdminStaffSessionPayload> {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!token) {
    return { authenticated: false };
  }

  try {
    const res = await fetch(`${getServerApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      clearAdminAccessTokenCookieFromStore();
      return { authenticated: false };
    }
    const user = (await res.json()) as AdminSessionUser;
    if (!user?.staff) {
      clearAdminAccessTokenCookieFromStore();
      return { authenticated: false, user };
    }
    return { authenticated: true, user };
  } catch {
    return { authenticated: false, error: 'api_unreachable' };
  }
}

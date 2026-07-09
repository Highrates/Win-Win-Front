import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE, adminCookieSecure } from './adminAuth';

export function getAdminAccessTokenFromCookies(): string | null {
  return cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim() || null;
}

/** Сброс httpOnly-cookie админки из RSC (layout, getAdminStaffSession). */
export function clearAdminAccessTokenCookieFromStore(): void {
  try {
    cookies().delete(ADMIN_ACCESS_TOKEN_COOKIE);
  } catch {
    /* ignore */
  }
}

export function clearAdminAccessTokenCookieInResponse(
  res: NextResponse,
  request: Request,
): void {
  res.cookies.set({
    name: ADMIN_ACCESS_TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    secure: adminCookieSecure(request),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

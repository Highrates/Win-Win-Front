import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerApiBase } from './serverApiBase';
import { USER_ACCESS_TOKEN_COOKIE, userCookieSecure } from './userAuth';

export type ServerUserSession = {
  authenticated: boolean;
  accessToken: string | null;
};

export function getUserAccessTokenFromCookies(): string | null {
  return cookies().get(USER_ACCESS_TOKEN_COOKIE)?.value?.trim() || null;
}

/** Сброс httpOnly-cookie сессии из RSC (layout, getServerUserSession). */
export function clearUserSessionCookieFromStore(): void {
  try {
    cookies().delete(USER_ACCESS_TOKEN_COOKIE);
  } catch {
    /* ignore */
  }
}

export function clearUserSessionCookieInResponse(
  res: NextResponse,
  request: Request,
): void {
  res.cookies.set({
    name: USER_ACCESS_TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    secure: userCookieSecure(request),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function withUserAuthorizationHeaders(init?: RequestInit): RequestInit {
  const token = getUserAccessTokenFromCookies();
  const next: RequestInit = { ...init, headers: new Headers(init?.headers) };
  if (token) {
    (next.headers as Headers).set('Authorization', `Bearer ${token}`);
  }
  return next;
}

/** Одна проверка сессии на RSC-рендер (layout + fetch с likedByMe). */
export const getServerUserSession = cache(async (): Promise<ServerUserSession> => {
  const token = getUserAccessTokenFromCookies();
  if (!token) return { authenticated: false, accessToken: null };
  try {
    const res = await fetch(`${getServerApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      clearUserSessionCookieFromStore();
      return { authenticated: false, accessToken: null };
    }
    return { authenticated: true, accessToken: token };
  } catch {
    return { authenticated: false, accessToken: null };
  }
});

export async function getServerUserAuthenticated(): Promise<boolean> {
  return (await getServerUserSession()).authenticated;
}

export type UserSessionGetResult =
  | { authenticated: true; user: unknown }
  | { authenticated: false; error?: string };

export async function userSessionGetJson(request: Request, url: string): Promise<UserSessionGetResult> {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return { authenticated: false };
  }
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[userSession] fetch failed', url, e);
    return { authenticated: false, error: 'api_unreachable' };
  }
  if (!res.ok) {
    const out = NextResponse.json({ authenticated: false });
    clearUserSessionCookieInResponse(out, request);
    return { authenticated: false };
  }
  const user = await res.json();
  return { authenticated: true, user };
}

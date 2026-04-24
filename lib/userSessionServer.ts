import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { USER_ACCESS_TOKEN_COOKIE, userCookieSecure } from './userAuth';

export function getUserAccessTokenFromCookies(): string | null {
  return cookies().get(USER_ACCESS_TOKEN_COOKIE)?.value?.trim() || null;
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

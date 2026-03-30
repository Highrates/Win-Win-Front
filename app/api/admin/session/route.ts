import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE, adminCookieSecure } from '@/lib/adminAuth';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Проверка cookie и валидности сессии на бэкенде. */
export async function GET(request: Request) {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  let res: Response;
  try {
    res = await fetch(`${getServerApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/admin/session] fetch failed', e);
    return NextResponse.json({ authenticated: false, error: 'api_unreachable' });
  }

  if (!res.ok) {
    const out = NextResponse.json({ authenticated: false });
    out.cookies.set({
      name: ADMIN_ACCESS_TOKEN_COOKIE,
      value: '',
      httpOnly: true,
      secure: adminCookieSecure(request),
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return out;
  }

  const user = await res.json();
  return NextResponse.json({ authenticated: true, user });
}

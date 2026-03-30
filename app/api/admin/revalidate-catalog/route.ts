import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE, adminCookieSecure } from '@/lib/adminAuth';
import { CATALOG_PUBLIC_TAG } from '@/lib/catalogCache';
import { getServerApiBase } from '@/lib/serverApiBase';

/**
 * Сброс ISR/Data Cache публичного каталога после мутаций в админке.
 * Доступно только с валидной админской сессией.
 */
export async function POST(request: Request) {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${getServerApiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  if (!res.ok) {
    const out = NextResponse.json({ ok: false }, { status: 401 });
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

  revalidateTag(CATALOG_PUBLIC_TAG);
  return NextResponse.json({ ok: true });
}

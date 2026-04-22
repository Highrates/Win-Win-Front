import { NextResponse } from 'next/server';
import { USER_ACCESS_TOKEN_COOKIE, USER_TOKEN_MAX_AGE_SEC, userCookieSecure } from '@/lib/userAuth';

export async function POST(request: Request) {
  let body: { access_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = (body.access_token ?? '').trim();
  if (!token) {
    return NextResponse.json({ error: 'No access_token' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: USER_ACCESS_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: userCookieSecure(request),
    sameSite: 'lax',
    path: '/',
    maxAge: USER_TOKEN_MAX_AGE_SEC,
  });
  return response;
}


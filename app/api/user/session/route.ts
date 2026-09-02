import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { establishUserSessionResponse, fetchAuthMeWithToken } from '@/lib/userSessionEstablish';
import { userSessionGetJson } from '@/lib/userSessionServer';

export async function GET(request: Request) {
  const result = await userSessionGetJson(request, `${getServerApiBase()}/auth/me`);
  if (!result.authenticated) {
    return NextResponse.json({ authenticated: false, error: result.error });
  }
  return NextResponse.json({ authenticated: true, user: result.user });
}

/**
 * Опционально: установить cookie из тела (редко нужно — login/register уже cookie-only BFF).
 * Ответ без `access_token` в JSON.
 */
export async function POST(request: Request) {
  let body: { access_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = (body.access_token ?? '').trim();
  if (!token) {
    return NextResponse.json({ error: 'access_token required' }, { status: 400 });
  }

  const user = await fetchAuthMeWithToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return establishUserSessionResponse(request, token, user);
}

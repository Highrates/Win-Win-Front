import { NextResponse } from 'next/server';
import { sanitizeCallbackUrl } from '@/lib/authRedirect';
import { clearUserSessionCookieInResponse } from '@/lib/userSessionServer';

/** Куда отправить после сброса cookie — только внутренние guest-auth пути. */
function sanitizeClearSessionTarget(raw: string | null | undefined): string {
  const v = sanitizeCallbackUrl(raw, '/login/email');
  const pathOnly = v.split('?')[0]?.split('#')[0] ?? v;
  if (pathOnly === '/login' || pathOnly.startsWith('/login/') || pathOnly.startsWith('/register/')) {
    return v;
  }
  return '/login/email';
}

/**
 * GET: сбросить httpOnly `user_access_token` в браузере и редирект на login/register.
 * Используется из RSC layout ЛК при невалидной сессии — иначе middleware видит старую cookie и зацикливает редиректы.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = sanitizeClearSessionTarget(url.searchParams.get('then'));
  const res = NextResponse.redirect(new URL(target, url.origin));
  clearUserSessionCookieInResponse(res, request);
  return res;
}

import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { setUserAccessTokenCookie } from '@/lib/userAuth';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

type ProxyBase = {
  request: Request;
  /** путь относительно API base, напр. `auth/account/contact/email/start` */
  backendPath: string;
  method: 'POST' | 'PATCH';
  body?: string;
};

/**
 * Прокси к Nest с Authorization: текущий JWT покупателя.
 * `setCookieFromAccessToken` — снять `access_token` из JSON и записать в httpOnly cookie.
 */
export async function proxyUserBearer(
  { request, backendPath, method, body }: ProxyBase,
  setCookieFromAccessToken: boolean = false,
): Promise<NextResponse> {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const path = backendPath.replace(/^\//, '');
  const url = `${getServerApiBase()}/${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),
      },
      body,
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[proxyUserBearer] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();

  if (!res.ok) {
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  }

  if (!setCookieFromAccessToken) {
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  }

  let parsed: { access_token?: string; user?: unknown };
  try {
    parsed = JSON.parse(text) as { access_token?: string; user?: unknown };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 502 });
  }

  if (!parsed.access_token || typeof parsed.access_token !== 'string') {
    return NextResponse.json({ message: 'No access_token in response' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: parsed.user ?? null });
  setUserAccessTokenCookie(response, request, parsed.access_token);
  return response;
}

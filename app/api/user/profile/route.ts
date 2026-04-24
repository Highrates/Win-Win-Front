import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

async function forwardJson(request: Request, init: { method: string; body?: string }) {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const url = `${getServerApiBase()}/users/me/profile`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),
      },
      body: init.body,
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/user/profile] upstream failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

export async function GET(request: Request) {
  return forwardJson(request, { method: 'GET' });
}

export async function PATCH(request: Request) {
  let body = '';
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }
  return forwardJson(request, { method: 'PATCH', body });
}

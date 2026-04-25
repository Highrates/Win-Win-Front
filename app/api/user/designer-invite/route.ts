import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

export async function POST(request: Request) {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.text();
  const url = `${getServerApiBase()}/users/me/designer-invite`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body || '{}',
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/user/designer-invite]', e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

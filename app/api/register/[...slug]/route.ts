import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

function isAllowed(slug: string[]): boolean {
  const s = slug.filter((p) => p.length > 0);
  if (s.length === 1 && s[0] === 'complete') return true;
  if (s.length === 2 && s[0] === 'phone' && (s[1] === 'start' || s[1] === 'verify')) return true;
  if (s.length === 2 && s[0] === 'email' && (s[1] === 'start' || s[1] === 'verify')) return true;
  return false;
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug ?? [];
  if (!isAllowed(slug)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const path = `auth/register/${slug.join('/')}`;
  const url = new URL(request.url);
  const target = `${getServerApiBase()}/${path}${url.search}`;

  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': request.headers.get('content-type') || 'application/json',
  };

  let res: Response;
  try {
    res = await fetch(target, {
      method: 'POST',
      headers,
      body: body.byteLength > 0 ? body : '{}',
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upstream unreachable';
    return NextResponse.json(
      { message: `Не удалось связаться с API: ${msg}` },
      { status: 502 },
    );
  }

  if (res.status >= 300 && res.status < 400) {
    return NextResponse.json(
      { message: 'API вернуло перенаправление; проверьте API_URL (нужен прямой URL Nest).' },
      { status: 502 },
    );
  }

  const buf = await res.arrayBuffer();
  const out = new NextResponse(buf, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

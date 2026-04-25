import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export async function POST(request: Request) {
  const url = `${getServerApiBase()}/auth/designer-invite/verify`;
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body || '{}',
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/auth/designer-invite/verify]', e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Плоский список публичных кейсов партнёров (Nest `GET /designers/cases`). */
export async function GET() {
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/designers/cases`, {
      next: { revalidate: 60 },
    });
    const text = await res.text();
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch {
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
}

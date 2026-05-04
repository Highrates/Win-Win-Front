import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Плоский список публичных кейсов партнёров (Nest `GET /designers/cases[?product=]`). */
export async function GET(req: NextRequest) {
  try {
    const base = getServerApiBase();
    const product = req.nextUrl.searchParams.get('product');
    const qs = product && product.trim() ? `?product=${encodeURIComponent(product.trim())}` : '';
    const res = await fetch(`${base}/designers/cases${qs}`, {
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

import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Публичный список дизайнеров-партнёров Win-Win (прокси к Nest). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '20';
    const q = searchParams.get('q')?.trim();
    const base = getServerApiBase();
    const qs = new URLSearchParams({ page, limit });
    if (q) qs.set('q', q);
    const res = await fetch(`${base}/designers?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    const text = await res.text();
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch {
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 }, { status: 200 });
  }
}

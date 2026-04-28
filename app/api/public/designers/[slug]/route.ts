import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

type Params = { slug: string };

/** Публичная карточка дизайнера (прокси к Nest). */
export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { slug } = await context.params;
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/designers/${encodeURIComponent(slug)}`, {
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

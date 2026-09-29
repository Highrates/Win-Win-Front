import { NextResponse } from 'next/server';
import { DESIGNER_PUBLIC_REVALIDATE_SECONDS } from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';

type Params = { slug: string };

/** Публичная карточка дизайнера (прокси к Nest). */
export async function GET(request: Request, context: { params: Promise<Params> }) {
  const { slug } = await context.params;
  try {
    const base = getServerApiBase();
    const incoming = new URL(request.url);
    const qs = incoming.searchParams.toString();
    const res = await fetch(
      `${base}/designers/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`,
      { next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS } },
    );
    const text = await res.text();
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch {
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
}

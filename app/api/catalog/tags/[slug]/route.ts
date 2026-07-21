import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси контекстного тега по slug. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const encoded = encodeURIComponent(slug);
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/catalog/tags/${encoded}`, { next: catalogPublicFetchNext() });
    if (!res.ok) {
      return NextResponse.json({ error: 'Not found' }, { status: res.status === 404 ? 404 : 502 });
    }
    const data = await jsonFromResponse(res, null);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

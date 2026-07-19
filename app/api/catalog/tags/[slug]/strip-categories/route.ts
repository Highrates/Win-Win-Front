import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

type RouteContext = { params: Promise<{ slug: string }> };

/** Прокси категорий полосы главной для контекстного тега. */
export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const encoded = encodeURIComponent(slug);
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/catalog/tags/${encoded}/strip-categories`, {
      next: catalogPublicFetchNext(),
    });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data = await jsonFromResponse(res, { items: [] });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

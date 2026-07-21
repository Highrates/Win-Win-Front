import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси `GET /catalog/collections-and-sets` для lazy-load вкладки на hub. */
export async function GET() {
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/catalog/collections-and-sets`, {
      next: catalogPublicFetchNext(),
    });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data = await jsonFromResponse(res, { items: [] });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

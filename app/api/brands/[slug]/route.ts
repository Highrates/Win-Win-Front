import { NextRequest, NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';

/** Прокси `GET /brands/:slug` с опциональным `categoryId` (товары бренда в категории). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const categoryId = request.nextUrl.searchParams.get('categoryId')?.trim();
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  try {
    const base = getServerApiBase();
    const res = await fetch(
      `${base}/brands/${encodeURIComponent(slug)}${qs}`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (res.status === 404) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream' }, { status: res.status });
    }
    const data = await jsonFromResponse(res, null);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': categoryId
          ? 'public, max-age=60, stale-while-revalidate=300'
          : 'public, max-age=120, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'unreachable' }, { status: 502 });
  }
}

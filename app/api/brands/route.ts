import { NextRequest, NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси `GET /brands` с опциональным `categoryId` (бренды с товарами в категории). */
export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('categoryId')?.trim();
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/brands${qs}`, { next: catalogPublicFetchNext() });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await jsonFromResponse(res, []);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': categoryId
          ? 'public, max-age=60, stale-while-revalidate=300'
          : 'public, max-age=120, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

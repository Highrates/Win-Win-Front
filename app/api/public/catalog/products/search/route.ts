import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export const runtime = 'nodejs';

/** Прокси публичного `GET /catalog/products/search` для клиента ЛК (без секрета бэкенда). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const base = getServerApiBase();
  const upstream = new URL(`${base}/catalog/products/search`);
  for (const key of ['q', 'page', 'limit', 'categoryId', 'brandId']) {
    const v = url.searchParams.get(key);
    if (v != null && v !== '') upstream.searchParams.set(key, v);
  }
  const res = await fetch(upstream.toString(), { cache: 'no-store' });
  const ct = res.headers.get('content-type') ?? 'application/json';
  return new NextResponse(res.body, { status: res.status, headers: { 'content-type': ct } });
}

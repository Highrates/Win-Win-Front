import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';

export const runtime = 'nodejs';

const FORWARD_KEYS = [
  'categoryId',
  'tag',
  'brandId',
  'materialId',
  'priceFrom',
  'priceTo',
  'widthFrom',
  'widthTo',
  'heightFrom',
  'heightTo',
  'hasCase',
  'has3d',
  'hasDrawing',
] as const;

/** Прокси `GET /catalog/products/filter-options` (faceted). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const base = getServerApiBase();
  const upstream = new URL(`${base}/catalog/products/filter-options`);
  for (const key of FORWARD_KEYS) {
    const v = url.searchParams.get(key);
    if (v != null && v !== '') upstream.searchParams.set(key, v);
  }
  const res = await fetch(upstream.toString(), await publicFetchInitWithOptionalUserAuth());
  const ct = res.headers.get('content-type') ?? 'application/json';
  return new NextResponse(res.body, { status: res.status, headers: { 'content-type': ct } });
}

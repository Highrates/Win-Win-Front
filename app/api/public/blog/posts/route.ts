import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const base = getServerApiBase();
  const qs = request.nextUrl.searchParams.toString();
  const url = `${base}/blog/posts${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json; charset=utf-8' },
  });
}

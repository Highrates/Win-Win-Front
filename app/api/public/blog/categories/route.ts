import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = getServerApiBase();
  const res = await fetch(`${base}/blog/categories`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json; charset=utf-8' },
  });
}

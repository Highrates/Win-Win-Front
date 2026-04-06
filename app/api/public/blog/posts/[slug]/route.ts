import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { slug: raw } = await params;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* raw */
  }
  slug = slug.trim();
  if (!slug) {
    return NextResponse.json({ message: 'Not Found', statusCode: 404 }, { status: 404 });
  }
  const base = getServerApiBase();
  const res = await fetch(`${base}/blog/posts/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json; charset=utf-8' },
  });
}

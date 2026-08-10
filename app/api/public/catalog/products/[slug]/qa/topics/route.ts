import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }
  const base = getServerApiBase();
  const res = await fetch(
    `${base}/catalog/products/${encodeURIComponent(slug)}/qa/topics`,
    await publicFetchInitWithOptionalUserAuth(),
  );
  const ct = res.headers.get('content-type') ?? 'application/json';
  return new NextResponse(res.body, { status: res.status, headers: { 'content-type': ct } });
}

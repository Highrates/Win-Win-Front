import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const base = getServerApiBase();
  const res = await fetch(`${base}/catalog/products/resolve-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
  });
  const ct = res.headers.get('content-type') ?? 'application/json';
  return new NextResponse(res.body, { status: res.status, headers: { 'content-type': ct } });
}

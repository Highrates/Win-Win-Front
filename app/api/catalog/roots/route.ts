import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси корней для меню; тот же `next.tags`, что и в RSC — общий Data Cache с `revalidateTag`. */
export async function GET() {
  const base = getServerApiBase();
  const res = await fetch(`${base}/catalog/categories/roots`, { next: catalogPublicFetchNext() });
  if (!res.ok) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

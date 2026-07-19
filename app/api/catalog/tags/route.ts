import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси контекстных тегов каталога для навигации. */
export async function GET() {
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/catalog/tags`, { next: catalogPublicFetchNext() });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data = await jsonFromResponse(res, { items: [] });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

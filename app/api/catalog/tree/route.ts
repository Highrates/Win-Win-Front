import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { jsonFromResponse } from '@/lib/jsonFromResponse';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси дерева для ScrollCatalog; кэш согласован с `catalogPublic.ts`. */
export async function GET() {
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/catalog/categories/tree`, { next: catalogPublicFetchNext() });
    if (!res.ok) {
      return NextResponse.json({ roots: [] }, { status: 200 });
    }
    const data = await jsonFromResponse(res, { roots: [] });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ roots: [] }, { status: 200 });
  }
}

import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Прокси дерева для ScrollCatalog; кэш согласован с `catalogPublic.ts`. */
export async function GET() {
  const base = getServerApiBase();
  const res = await fetch(`${base}/catalog/categories/tree`, { next: catalogPublicFetchNext() });
  if (!res.ok) {
    return NextResponse.json({ roots: [] }, { status: 200 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

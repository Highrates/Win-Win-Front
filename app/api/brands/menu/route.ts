import { NextResponse } from 'next/server';
import { catalogPublicFetchNext } from '@/lib/catalogCache';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicBrandsMenuSlice, type PublicBrandListRow } from '@/lib/brandsPublic';

/** Прокси для супер-меню: первые 10 активных брендов по sortOrder. */
export async function GET() {
  try {
    const base = getServerApiBase();
    const res = await fetch(`${base}/brands`, { next: catalogPublicFetchNext() });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data: unknown = await res.json();
    const brands = Array.isArray(data) ? (data as PublicBrandListRow[]) : [];
    const items = publicBrandsMenuSlice(brands, 10);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

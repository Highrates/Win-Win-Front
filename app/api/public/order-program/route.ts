import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

const fallback = {
  designerOwnCatalogBonusPercent: 0,
  designerOwnMinimumCatalogSiteTotalRub: 0,
};

export async function GET() {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/settings/public/order-program`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(fallback);
    }
    const j = (await res.json()) as Partial<typeof fallback>;
    const designerOwnCatalogBonusPercent =
      typeof j.designerOwnCatalogBonusPercent === 'number' && Number.isFinite(j.designerOwnCatalogBonusPercent)
        ? Math.min(100, Math.max(0, j.designerOwnCatalogBonusPercent))
        : 0;
    const designerOwnMinimumCatalogSiteTotalRub =
      typeof j.designerOwnMinimumCatalogSiteTotalRub === 'number' && Number.isFinite(j.designerOwnMinimumCatalogSiteTotalRub)
        ? Math.max(0, Math.floor(j.designerOwnMinimumCatalogSiteTotalRub))
        : 0;
    return NextResponse.json({ designerOwnCatalogBonusPercent, designerOwnMinimumCatalogSiteTotalRub });
  } catch {
    return NextResponse.json(fallback);
  }
}

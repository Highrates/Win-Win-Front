'use client';

import { useMemo } from 'react';
import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import { catalogHitsToProductGridItems } from '@/lib/productGridItem';
import categoryStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

type Props = {
  catalogHits: CatalogProductSearchHit[];
  /** Колонки сетки на десктопе: 4 по умолчанию, 3 при открытых фильтрах. */
  columns?: 3 | 4;
};

export function CatalogProductGrid({ catalogHits, columns = 4 }: Props) {
  const items = useMemo(() => catalogHitsToProductGridItems(catalogHits), [catalogHits]);
  const gridClassName =
    columns === 3
      ? `${categoryStyles.marketGrid} ${categoryStyles.marketGridCols3}`
      : categoryStyles.marketGrid;
  return <ProductGridWithLikes items={items} gridClassName={gridClassName} />;
}

'use client';

import { useMemo } from 'react';
import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import { catalogHitsToProductGridItems } from '@/lib/productGridItem';
import categoryStyles from '@/app/(public)/categories/CategoryPage.module.css';

type Props = {
  catalogHits: CatalogProductSearchHit[];
};

export function CatalogProductGrid({ catalogHits }: Props) {
  const items = useMemo(() => catalogHitsToProductGridItems(catalogHits), [catalogHits]);
  return <ProductGridWithLikes items={items} gridClassName={categoryStyles.marketGrid} />;
}

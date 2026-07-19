'use client';

import {
  ScrollCatalogStripPanel,
  type ScrollCatalogStripItem,
} from '@/sections/home/ScrollCatalog/ScrollCatalogStripPanel';

export type CatalogSubcategoryCardItem = { slug: string; name: string; imageSrc: string };

/** Горизонтальная полоса подкатегорий на `/catalog/[slug]` (вёрстка как у полосы на главной). */
export function CatalogSubcategoryCardsStrip({ items }: { items: CatalogSubcategoryCardItem[] }) {
  const stripItems: ScrollCatalogStripItem[] = items.map((c) => ({
    key: c.slug,
    href: `/catalog/${c.slug}`,
    name: c.name,
    imageSrc: c.imageSrc,
  }));

  return <ScrollCatalogStripPanel items={stripItems} layout="fullBleed" tightTop />;
}

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CollectionProductsGrid,
  type CollectionProductRow,
} from '@/app/(site)/(public)/collections/[slug]/CollectionProductsGrid';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { findCatalogRootForCategoryId } from '@/lib/catalog/findCatalogRoot';
import type { CatalogFacetFilters } from '@/lib/catalog/catalogProductFilters';
import type { CatalogSortId } from '@/lib/catalog/catalogSort';
import type { PublicCatalogTag } from '@/lib/catalogPublic';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import styles from './BrandPage.module.css';

const ALL_TAB_ID = 'all';

type Props = {
  slug: string;
  catalogRoots: HomeCatalogRoot[];
  products: CollectionProductRow[];
  zones: PublicCatalogTag[];
  initialTagSlug?: string;
  initialFacets?: CatalogFacetFilters;
  initialSort?: CatalogSortId;
  initialPriceFrom?: number;
  initialPriceTo?: number;
};

export function BrandPageMarketClient({
  slug,
  catalogRoots,
  products,
  zones,
  initialTagSlug,
  initialFacets,
  initialSort,
  initialPriceFrom,
  initialPriceTo,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category')?.trim() || null;

  const rootIdByProduct = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const p of products) {
      if (!p.categoryId) {
        map.set(p.productId, null);
        continue;
      }
      const root = findCatalogRootForCategoryId(catalogRoots, p.categoryId);
      map.set(p.productId, root?.id ?? null);
    }
    return map;
  }, [products, catalogRoots]);

  const tabs = useMemo(() => {
    const withProducts = new Set<string>();
    for (const rootId of Array.from(rootIdByProduct.values())) {
      if (rootId) withProducts.add(rootId);
    }
    return [
      { id: ALL_TAB_ID, label: 'Все' },
      ...catalogRoots
        .filter((r) => withProducts.has(r.id))
        .map((r) => ({ id: r.id, label: r.name })),
    ];
  }, [catalogRoots, rootIdByProduct]);

  const activeId =
    categoryParam && tabs.some((t) => t.id === categoryParam) ? categoryParam : ALL_TAB_ID;

  const selectTab = useCallback(
    (tabId: string) => {
      if (tabId === activeId) return;
      const href =
        tabId === ALL_TAB_ID
          ? `/brands/${encodeURIComponent(slug)}`
          : `/brands/${encodeURIComponent(slug)}?category=${encodeURIComponent(tabId)}`;
      router.replace(href, { scroll: false });
    },
    [activeId, router, slug],
  );

  return (
    <section className={styles.marketSection} aria-label="Товары бренда">
      <div className="padding-global">
        <div className={styles.marketSectionInner}>
          {tabs.length > 1 ? (
            <UnderlineTabs
              ariaLabel="Категории товаров бренда"
              asTablist={false}
              tabs={tabs}
              activeId={activeId}
              onSelect={selectTab}
            />
          ) : null}

          <CollectionProductsGrid
            catalogRoots={catalogRoots}
            products={products}
            zones={zones}
            initialTagSlug={initialTagSlug}
            initialFacets={initialFacets}
            initialSort={initialSort}
            initialPriceFrom={initialPriceFrom}
            initialPriceTo={initialPriceTo}
          />
        </div>
      </div>
    </section>
  );
}

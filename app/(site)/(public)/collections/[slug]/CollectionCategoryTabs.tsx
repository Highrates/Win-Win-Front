'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { findCatalogRootForCategoryId } from '@/lib/catalog/findCatalogRoot';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import categoryStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

const ALL_TAB_ID = 'all';

type ProductCat = { productId: string; categoryId: string | null };

type Props = {
  collectionSlug: string;
  catalogRoots: HomeCatalogRoot[];
  products: ProductCat[];
};

export function CollectionCategoryTabs({ collectionSlug, catalogRoots, products }: Props) {
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
          ? `/collections/${encodeURIComponent(collectionSlug)}`
          : `/collections/${encodeURIComponent(collectionSlug)}?category=${encodeURIComponent(tabId)}`;
      router.replace(href, { scroll: false });
    },
    [activeId, collectionSlug, router],
  );

  if (tabs.length <= 1) return null;

  return (
    <section className={categoryStyles.catalogSectionsSlot} aria-label="Категории коллекции">
      <div className="padding-global">
        <UnderlineTabs
          ariaLabel="Категории коллекции"
          asTablist={false}
          tabs={tabs}
          activeId={activeId}
          onSelect={selectTab}
        />
      </div>
    </section>
  );
}

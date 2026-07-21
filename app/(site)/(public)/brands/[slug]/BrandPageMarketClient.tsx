'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import {
  fetchPublicBrandBySlugClient,
  type PublicBrandProductRow,
} from '@/lib/brandsPublic';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { brandProductRowToProductGridItem, type ProductGridItem } from '@/lib/productGridItem';
import styles from './BrandPage.module.css';

const ALL_PRODUCTS_TAB_ID = 'all';

type Props = {
  slug: string;
  catalogRoots: HomeCatalogRoot[];
  initialCategoryId: string | null;
  initialProducts: ProductGridItem[];
};

function resolveCategoryFromParam(
  param: string | null,
  roots: HomeCatalogRoot[],
): string {
  if (!param?.trim()) return ALL_PRODUCTS_TAB_ID;
  return roots.some((r) => r.id === param) ? param : ALL_PRODUCTS_TAB_ID;
}

export function BrandPageMarketClient({
  slug,
  catalogRoots,
  initialCategoryId,
  initialProducts,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(() =>
    initialCategoryId && catalogRoots.some((r) => r.id === initialCategoryId)
      ? initialCategoryId
      : ALL_PRODUCTS_TAB_ID,
  );

  const selfNavRef = useRef(false);
  const mountedRef = useRef(false);

  const tabs = useMemo(
    () => [
      { id: ALL_PRODUCTS_TAB_ID, name: 'Все товары' },
      ...catalogRoots.map((r) => ({ id: r.id, name: r.name })),
    ],
    [catalogRoots],
  );

  const applyProducts = useCallback((rows: PublicBrandProductRow[]) => {
    setProducts(rows.map(brandProductRowToProductGridItem));
  }, []);

  const loadProducts = useCallback(
    async (categoryId: string | null) => {
      setLoading(true);
      try {
        const row = await fetchPublicBrandBySlugClient(slug, categoryId);
        if (row?.products) applyProducts(row.products);
        else setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [applyProducts, slug],
  );

  const selectTab = useCallback(
    (tabId: string) => {
      if (tabId === activeId) return;
      selfNavRef.current = true;
      setActiveId(tabId);
      const categoryId = tabId === ALL_PRODUCTS_TAB_ID ? null : tabId;
      const href = categoryId
        ? `/brands/${slug}?category=${encodeURIComponent(categoryId)}`
        : `/brands/${slug}`;
      router.replace(href, { scroll: false });
      void loadProducts(categoryId);
    },
    [activeId, loadProducts, router, slug],
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (selfNavRef.current) {
      selfNavRef.current = false;
      return;
    }
    const param = searchParams.get('category');
    const nextId = resolveCategoryFromParam(param, catalogRoots);
    setActiveId(nextId);
    const categoryId = nextId === ALL_PRODUCTS_TAB_ID ? null : nextId;
    void loadProducts(categoryId);
  }, [searchParams, catalogRoots, loadProducts]);

  return (
    <section className={styles.marketSection} aria-label="Товары бренда">
      <div className="padding-global">
        <div className={styles.marketSectionInner}>
          {tabs.length > 1 ? (
            <UnderlineTabs
              ariaLabel="Категории товаров бренда"
              asTablist={false}
              tabs={tabs.map((tab) => ({ id: tab.id, label: tab.name }))}
              activeId={activeId}
              onSelect={selectTab}
            />
          ) : null}

          {loading ? (
            <p className={styles.loadingHint} role="status" aria-live="polite">
              Загружаем товары…
            </p>
          ) : null}

          <div className={styles.marketSectionRow}>
            <div className={styles.marketSectionRowLeft}>
              <div className={styles.marketFilterGroup}>
                <button type="button" aria-label="Фильтр">
                  <img src="/icons/filter.svg" alt="" width={20} height={20} />
                  <span>Фильтр</span>
                </button>
              </div>
              <div className={styles.marketSortGroup}>
                <button type="button" aria-label="Сортировка">
                  <img src="/icons/sort.svg" alt="" width={20} height={20} />
                  <span>Самые популярные</span>
                </button>
              </div>
            </div>
            <div className={styles.marketSectionRowResult}>
              <span className={styles.marketSectionRowResultLabel}>Результат: </span>
              <span className={styles.marketSectionRowResultValue}>{products.length}</span>
            </div>
          </div>
          <ProductGridWithLikes items={products} gridClassName={styles.marketGrid} />
        </div>
      </div>
    </section>
  );
}

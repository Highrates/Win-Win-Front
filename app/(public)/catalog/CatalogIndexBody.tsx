'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CatalogSectionsTabs } from '@/app/(public)/catalog/CatalogSectionsTabs';
import {
  CATEGORY_PER_PAGE,
  buildCatalogPaginationEntries,
} from '@/app/(public)/categories/categoryCatalogData';
import styles from '@/app/(public)/categories/CategoryPage.module.css';
import { CatalogProductGrid } from '@/components/CatalogProductGrid/CatalogProductGrid';
import { fetchCatalogProductsSearchClient } from '@/lib/catalogProductsSearchClient';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';

type Props = {
  roots: HomeCatalogRoot[];
  initialCategoryId: string;
  initialHits: CatalogProductSearchHit[];
  initialTotal: number;
  initialPage: number;
};

export function CatalogIndexBody({
  roots,
  initialCategoryId,
  initialHits,
  initialTotal,
  initialPage,
}: Props) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [hits, setHits] = useState(initialHits);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  const requestGenRef = useRef(0);
  const skipFetchRef = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  const loadProducts = useCallback(async (catId: string, pageNum: number) => {
    const gen = ++requestGenRef.current;
    setLoading(true);
    try {
      const data = await fetchCatalogProductsSearchClient({
        categoryId: catId,
        page: pageNum,
        limit: CATEGORY_PER_PAGE,
      });
      if (gen !== requestGenRef.current) return;
      const tp = Math.max(1, Math.ceil((data.total ?? 0) / CATEGORY_PER_PAGE));
      const pageEff = Math.min(Math.max(1, pageNum), tp);
      let hitsNext = data.hits ?? [];
      let totalNext = data.total ?? 0;
      if (pageEff !== pageNum) {
        const again = await fetchCatalogProductsSearchClient({
          categoryId: catId,
          page: pageEff,
          limit: CATEGORY_PER_PAGE,
        });
        if (gen !== requestGenRef.current) return;
        hitsNext = again.hits ?? [];
        totalNext = again.total ?? 0;
      }
      setHits(hitsNext);
      setTotal(totalNext);
      setPage(pageEff);
    } finally {
      if (gen === requestGenRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      if (categoryId === initialCategoryId && page === initialPage) return;
    }
    void loadProducts(categoryId, page);
  }, [categoryId, page, initialCategoryId, initialPage, loadProducts]);

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId((prev) => (prev === id ? prev : id));
    setPage(1);
  }, []);

  const goToPage = (next: number) => {
    const p = Math.min(Math.max(1, next), totalPages);
    if (p !== page) setPage(p);
  };

  return (
    <>
      <CatalogSectionsTabs initialRoots={roots} onActiveCategoryChange={handleCategoryChange} />

      <section className={styles.marketSection} aria-label="Каталог товаров">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
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
                <span className={styles.marketSectionRowResultValue}>{total}</span>
              </div>
            </div>
            <div aria-busy={loading} style={loading ? { opacity: 0.55, transition: 'opacity 0.15s' } : undefined}>
              <CatalogProductGrid catalogHits={hits} />
            </div>
            <nav className={styles.paginationWrapper} aria-label="Пагинация">
              {pageClamped <= 1 ? (
                <span className={styles.paginationBtnDisabled}>НАЗАД</span>
              ) : (
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => goToPage(pageClamped - 1)}
                >
                  НАЗАД
                </button>
              )}
              <div className={styles.paginationPages}>
                {buildCatalogPaginationEntries(pageClamped, totalPages).map((entry, idx) =>
                  entry === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className={styles.paginationEllipsis}
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : entry === pageClamped ? (
                    <span key={entry} className={styles.paginationPageCurrent}>
                      {entry}
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      className={styles.paginationPage}
                      onClick={() => goToPage(entry)}
                    >
                      {entry}
                    </button>
                  ),
                )}
              </div>
              {pageClamped >= totalPages ? (
                <span className={styles.paginationBtnDisabled}>ДАЛЕЕ</span>
              ) : (
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => goToPage(pageClamped + 1)}
                >
                  ДАЛЕЕ
                </button>
              )}
            </nav>
          </div>
        </div>
      </section>
    </>
  );
}

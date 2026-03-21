'use client';

import { useCallback, useMemo, useState } from 'react';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { getCategoryMarketProducts } from '@/app/(public)/categories/categoryCatalogData';
import recStyles from '@/sections/home/Recommendations/Recommendations.module.css';
import styles from './FavoritesPage.module.css';

/** Мок: позже — GET /favorites; много позиций для проверки подгрузки */
const FAVORITES_TOTAL_MOCK = 120;
const INITIAL_VISIBLE = 24;
const LOAD_MORE_STEP = 24;

const ALL_FAVORITES_MOCK = getCategoryMarketProducts(FAVORITES_TOTAL_MOCK);

export default function FavoritesPage() {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_VISIBLE, ALL_FAVORITES_MOCK.length),
  );

  const visibleItems = useMemo(
    () => ALL_FAVORITES_MOCK.slice(0, visibleCount),
    [visibleCount],
  );

  const hasMore = visibleCount < ALL_FAVORITES_MOCK.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, ALL_FAVORITES_MOCK.length));
  }, []);

  return (
    <>
      <div className={styles.grid}>
        {visibleItems.map((p) => (
          <ProductCard key={p.key} slug={p.slug} name={p.name} price={p.price} heartActive />
        ))}
      </div>
      {hasMore ? (
        <div className={recStyles.loadMoreWrapper}>
          <button type="button" className={recStyles.loadMoreBtn} onClick={handleLoadMore}>
            Загрузить еще
          </button>
        </div>
      ) : null}
    </>
  );
}

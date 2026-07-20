'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import { useGalleryAdvanceOnView } from '@/hooks/useGalleryAdvanceOnView';
import { recommendationItemsToProductGridItems } from '@/lib/productGridItem';
import { useInfiniteScrollSentinel } from '@/lib/useInfiniteScrollSentinel';
import styles from './Recommendations.module.css';
import type { RecommendationsStaticItem } from './recommendationsStaticItem';

export type { RecommendationsStaticItem };

/** Две строки сетки 4× на десктопе / 2× на мобилке */
const PAGE_SIZE = 8;

type RecommendationsProps = {
  title?: string;
  /** Опциональный id секции (например для скрытия sticky-панели при скролле) */
  id?: string;
  items: RecommendationsStaticItem[];
  /** При скролле к секции — все карточки с галереей листают на следующее фото */
  advanceGalleryOnScroll?: boolean;
  /**
   * Показывать товары порциями и подгружать следующие при приближении к низу секции.
   * По умолчанию включено для длинных списков.
   */
  progressiveLoad?: boolean;
};

export function Recommendations({
  title = 'Рекомендации',
  id,
  items,
  advanceGalleryOnScroll = false,
  progressiveLoad = true,
}: RecommendationsProps) {
  const { sectionRef, galleryAdvanceSignal } = useGalleryAdvanceOnView();
  const gridItems = recommendationItemsToProductGridItems(items);
  const [visibleCount, setVisibleCount] = useState(() =>
    progressiveLoad ? Math.min(PAGE_SIZE, gridItems.length) : gridItems.length,
  );

  useEffect(() => {
    setVisibleCount(
      progressiveLoad ? Math.min(PAGE_SIZE, gridItems.length) : gridItems.length,
    );
  }, [gridItems.length, progressiveLoad]);

  const hasMore = progressiveLoad && visibleCount < gridItems.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, gridItems.length));
  }, [gridItems.length]);

  const sentinelRef = useInfiniteScrollSentinel(loadMore, hasMore);

  if (!gridItems.length) return null;

  const visibleItems = progressiveLoad ? gridItems.slice(0, visibleCount) : gridItems;

  return (
    <section
      id={id}
      ref={advanceGalleryOnScroll ? sectionRef : undefined}
      className={styles.section}
    >
      <div className="padding-global">
        <h5 className={styles.title}>{title}</h5>
        <ProductGridWithLikes
          items={visibleItems}
          gridClassName={styles.grid}
          galleryAdvanceSignal={advanceGalleryOnScroll ? galleryAdvanceSignal : undefined}
        />
        {hasMore ? (
          <div
            ref={sentinelRef}
            className={styles.infiniteScrollSentinel}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </section>
  );
}

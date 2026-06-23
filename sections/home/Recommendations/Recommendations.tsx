'use client';

import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import { useGalleryAdvanceOnView } from '@/hooks/useGalleryAdvanceOnView';
import { recommendationItemsToProductGridItems } from '@/lib/productGridItem';
import styles from './Recommendations.module.css';
import type { RecommendationsStaticItem } from './recommendationsStaticItem';

export type { RecommendationsStaticItem };

type RecommendationsProps = {
  title?: string;
  /** Опциональный id секции (например для скрытия sticky-панели при скролле) */
  id?: string;
  items: RecommendationsStaticItem[];
  /** При скролле к секции — все карточки с галереей листают на следующее фото */
  advanceGalleryOnScroll?: boolean;
};

export function Recommendations({
  title = 'Рекомендации',
  id,
  items,
  advanceGalleryOnScroll = false,
}: RecommendationsProps) {
  const { sectionRef, galleryAdvanceSignal } = useGalleryAdvanceOnView();
  const gridItems = recommendationItemsToProductGridItems(items);
  if (!gridItems.length) return null;

  return (
    <section
      id={id}
      ref={advanceGalleryOnScroll ? sectionRef : undefined}
      className={styles.section}
    >
      <div className="padding-global">
        <h5 className={styles.title}>{title}</h5>
        <ProductGridWithLikes
          items={gridItems}
          gridClassName={styles.grid}
          galleryAdvanceSignal={advanceGalleryOnScroll ? galleryAdvanceSignal : undefined}
        />
      </div>
    </section>
  );
}

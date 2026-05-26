import { ProductGridWithLikes } from '@/components/ProductGridWithLikes';
import { recommendationItemsToProductGridItems } from '@/lib/productGridItem';
import styles from './Recommendations.module.css';
import type { RecommendationsStaticItem } from './recommendationsStaticItem';

export type { RecommendationsStaticItem };

type RecommendationsProps = {
  title?: string;
  /** Опциональный id секции (например для скрытия sticky-панели при скролле) */
  id?: string;
  items: RecommendationsStaticItem[];
};

export function Recommendations({ title = 'Рекомендации', id, items }: RecommendationsProps) {
  const gridItems = recommendationItemsToProductGridItems(items);
  if (!gridItems.length) return null;

  return (
    <section id={id} className={styles.section}>
      <div className="padding-global">
        <h5 className={styles.title}>{title}</h5>
        <ProductGridWithLikes items={gridItems} gridClassName={styles.grid} />
      </div>
    </section>
  );
}

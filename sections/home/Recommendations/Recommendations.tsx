import { ProductCard } from '@/components/ProductCard';
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
  if (!items.length) return null;

  return (
    <section id={id} className={styles.section}>
      <div className="padding-global">
        <h5 className={styles.title}>{title}</h5>
        <div className={styles.grid}>
          {items.map((p) => (
            <ProductCard
              key={p.productId ?? p.variantId ?? p.slug}
              slug={p.slug}
              name={p.name}
              price={p.price}
              variantId={p.variantId}
              imageUrl={p.imageUrl}
              imageUrls={p.imageUrls}
              productId={p.productId}
              collections={p.collections ?? 0}
              likes={typeof p.likes === 'number' ? p.likes : 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { ProductCard } from '@/components/ProductCard';
import styles from './Recommendations.module.css';

const PRODUCTS_POOL = [
  { slug: 'sofa-classic', name: 'Диван Classic', price: 135090 },
  { slug: 'kreslo-lounge', name: 'Кресло Lounge', price: 45000 },
  { slug: 'stolik-round', name: 'Столик Round', price: 28500 },
  { slug: 'konsol-wood', name: 'Консоль Wood', price: 67200 },
  { slug: 'stul-comfort', name: 'Стул Comfort', price: 19900 },
  { slug: 'puf-velvet', name: 'Пуф Velvet', price: 12400 },
  { slug: 'shkaf-modern', name: 'Шкаф Modern', price: 89000 },
  { slug: 'lampa-arc', name: 'Лампа Arc', price: 35090 },
  { slug: 'krovat-dream', name: 'Кровать Dream', price: 156000 },
  { slug: 'tumba-night', name: 'Тумба Night', price: 24300 },
  { slug: 'zerkalo-wall', name: 'Зеркало Wall', price: 31500 },
  { slug: 'polka-open', name: 'Полка Open', price: 14700 },
  { slug: 'stol-dining', name: 'Стол Dining', price: 78000 },
  { slug: 'bra-minimal', name: 'Бра Minimal', price: 9800 },
  { slug: 'komod-line', name: 'Комод Line', price: 54600 },
  { slug: 'kreslo-relax', name: 'Кресло Relax', price: 62000 },
  { slug: 'stol-coffee', name: 'Стол Coffee', price: 42000 },
  { slug: 'kreslo-wing', name: 'Кресло Wing', price: 73500 },
  { slug: 'svetilnik-spot', name: 'Светильник Spot', price: 11200 },
  { slug: 'polka-wall', name: 'Полка Wall', price: 18900 },
];

const ROWS_PER_LOAD = 4;
const COLS = 4;
const ITEMS_PER_LOAD = ROWS_PER_LOAD * COLS;

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const product = PRODUCTS_POOL[i % PRODUCTS_POOL.length];
    return { ...product, key: `${product.slug}-${i}` };
  });
}

type RecommendationsProps = {
  title?: string;
  /** Опциональный id секции (например для скрытия sticky-панели при скролле) */
  id?: string;
};

export function Recommendations({ title = 'Рекомендации', id }: RecommendationsProps) {
  const [items, setItems] = useState(() => generateItems(ITEMS_PER_LOAD));

  const handleLoadMore = useCallback(() => {
    setItems((prev) => {
      const next = generateItems(prev.length + ITEMS_PER_LOAD);
      return next;
    });
  }, []);

  return (
    <section id={id} className={styles.section}>
      <div className="padding-global">
        <h5 className={styles.title}>{title}</h5>
        <div className={styles.grid}>
          {items.map((p) => (
            <ProductCard key={p.key} slug={p.slug} name={p.name} price={p.price} />
          ))}
        </div>
        <div className={styles.loadMoreWrapper}>
          <button type="button" className={styles.loadMoreBtn} onClick={handleLoadMore}>
            Загрузить еще
          </button>
        </div>
      </div>
    </section>
  );
}

import { ProductCard } from '@/components/ProductCard/ProductCard';
import { CATEGORY_PRODUCTS_POOL } from '@/app/(public)/categories/categoryCatalogData';
import styles from './FavoritesPage.module.css';

/** Мок: позже заменить данными из GET /favorites */
const FAVORITE_PRODUCTS = CATEGORY_PRODUCTS_POOL.slice(0, 9);

export default function FavoritesPage() {
  return (
    <div className={styles.grid}>
      {FAVORITE_PRODUCTS.map((p) => (
        <ProductCard key={p.slug} slug={p.slug} name={p.name} price={p.price} heartActive />
      ))}
    </div>
  );
}

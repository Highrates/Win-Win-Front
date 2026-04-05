import styles from '../catalogAdmin.module.css';
import { ProductsListClient } from './ProductsListClient';

export default function AdminCatalogProductsPage() {
  return (
    <main>
      <h1 className={styles.title}>Товары</h1>
      <ProductsListClient />
    </main>
  );
}

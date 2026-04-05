import { ProductSetsListClient } from './ProductSetsListClient';
import styles from '../catalog/catalogAdmin.module.css';

export default function AdminProductSetsPage() {
  return (
    <main>
      <h1 className={styles.title}>Наборы</h1>
      <p className={styles.muted} style={{ marginTop: 0, marginBottom: 20 }}>
        Редакторские подборки только из товаров для витрины.
      </p>
      <ProductSetsListClient />
    </main>
  );
}

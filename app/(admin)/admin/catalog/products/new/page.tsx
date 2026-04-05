import Link from 'next/link';
import styles from '../../catalogAdmin.module.css';
import { ProductNewClient } from './ProductNewClient';

export default function AdminProductNewPage() {
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/catalog/products" className={styles.backLink}>
          ← К товарам
        </Link>
      </p>
      <h1 className={styles.title}>Новый товар</h1>
      <ProductNewClient />
    </main>
  );
}

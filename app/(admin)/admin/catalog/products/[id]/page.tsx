import Link from 'next/link';
import { ProductFormClient } from '../new/ProductNewClient';
import styles from '../../catalogAdmin.module.css';

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/catalog/products" className={styles.backLink}>
          ← К товарам
        </Link>
      </p>
      <h1 className={styles.title}>Редактирование товара</h1>
      <ProductFormClient productId={params.id} />
    </main>
  );
}

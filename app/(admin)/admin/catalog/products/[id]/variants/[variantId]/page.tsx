import Link from 'next/link';
import { VariantEditClient } from './VariantEditClient';
import styles from '../../../../catalogAdmin.module.css';

export default function AdminProductVariantPage({
  params,
}: {
  params: { id: string; variantId: string };
}) {
  const { id, variantId } = params;
  return (
    <main>
      <p className={styles.backRow}>
        <Link href={`/admin/catalog/products/${id}`} className={styles.backLink}>
          ← К карточке товара
        </Link>
      </p>
      <h1 className={styles.title}>Вариант товара</h1>
      <VariantEditClient productId={id} variantId={variantId} />
    </main>
  );
}

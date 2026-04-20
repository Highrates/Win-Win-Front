import Link from 'next/link';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { adminProductPageNav } from '@/lib/admin-i18n/adminProductNewI18n';
import { ProductFormClient } from '../new/ProductNewClient';
import styles from '../../catalogAdmin.module.css';

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const locale = getAdminLocale();
  const nav = adminProductPageNav(locale);
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/catalog/products" className={styles.backLink}>
          {nav.backProducts}
        </Link>
      </p>
      <h1 className={styles.title}>{nav.editTitle}</h1>
      <ProductFormClient productId={params.id} />
    </main>
  );
}

import Link from 'next/link';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { adminProductPageNav } from '@/lib/admin-i18n/adminProductNewI18n';
import styles from '../../catalogAdmin.module.css';
import { ProductNewClient } from './ProductNewClient';

export default function AdminProductNewPage() {
  const locale = getAdminLocale();
  const nav = adminProductPageNav(locale);
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/catalog/products" className={styles.backLink}>
          {nav.backProducts}
        </Link>
      </p>
      <h1 className={styles.title}>{nav.newTitle}</h1>
      <ProductNewClient />
    </main>
  );
}

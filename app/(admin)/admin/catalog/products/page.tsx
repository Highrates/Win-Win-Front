import Link from 'next/link';
import { Suspense } from 'react';
import { adminCatalogProductsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalogAdmin.module.css';
import { ProductsListClient } from './ProductsListClient';

export default function AdminCatalogProductsPage() {
  const locale = getAdminLocale();
  const t = adminCatalogProductsPage(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        <Link href="/admin/catalog/qa-queue">Очередь Q&A и переписки</Link>
      </p>
      <Suspense fallback={<p className={styles.muted}>…</p>}>
        <ProductsListClient />
      </Suspense>
    </main>
  );
}

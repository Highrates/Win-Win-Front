import Link from 'next/link';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { adminProductPageNav } from '@/lib/admin-i18n/adminProductNewI18n';
import { VariantEditClient } from './VariantEditClient';
import styles from '../../../../catalogAdmin.module.css';

export default function AdminProductVariantPage({
  params,
}: {
  params: { id: string; variantId: string };
}) {
  const { id, variantId } = params;
  const locale = getAdminLocale();
  const nav = adminProductPageNav(locale);
  return (
    <main>
      <p className={styles.backRow}>
        <Link href={`/admin/catalog/products/${id}`} className={styles.backLink}>
          {nav.backProductCard}
        </Link>
      </p>
      <h1 className={styles.title}>{nav.variantPageTitle}</h1>
      <VariantEditClient productId={id} variantId={variantId} />
    </main>
  );
}

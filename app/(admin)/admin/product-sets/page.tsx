import { adminProductSetsPageShell } from '@/lib/admin-i18n/adminProductSetsI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { ProductSetsListClient } from './ProductSetsListClient';
import styles from '../catalog/catalogAdmin.module.css';

export default function AdminProductSetsPage() {
  const locale = getAdminLocale();
  const t = adminProductSetsPageShell(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.muted} style={{ marginTop: 0, marginBottom: 20 }}>
        {t.lead}
      </p>
      <ProductSetsListClient />
    </main>
  );
}

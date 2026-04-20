import { adminCatalogCategoriesPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalogAdmin.module.css';
import { CategoriesListClient } from './CategoriesListClient';

export default function AdminCategoriesPage() {
  const locale = getAdminLocale();
  const t = adminCatalogCategoriesPage(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <CategoriesListClient />
    </main>
  );
}

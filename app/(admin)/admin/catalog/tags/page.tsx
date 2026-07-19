import { adminCatalogTagsPageShell } from '@/lib/admin-i18n/adminCatalogTagsI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalogAdmin.module.css';
import { CatalogTagsListClient } from './CatalogTagsListClient';

export default function AdminCatalogTagsPage() {
  const locale = getAdminLocale();
  const t = adminCatalogTagsPageShell(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <CatalogTagsListClient />
    </main>
  );
}

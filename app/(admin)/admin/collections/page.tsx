import { adminCollectionsPageShell } from '@/lib/admin-i18n/adminCollectionsI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { CollectionsListClient } from './CollectionsListClient';
import styles from '../catalog/catalogAdmin.module.css';

export default function AdminCollectionsPage() {
  const locale = getAdminLocale();
  const t = adminCollectionsPageShell(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.muted} style={{ marginTop: 0, marginBottom: 20 }}>
        {t.lead}
      </p>
      <CollectionsListClient />
    </main>
  );
}

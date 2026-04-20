import { adminJournalPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalog/catalogAdmin.module.css';
import { JournalClient } from './JournalClient';

export default function AdminJournalPage() {
  const locale = getAdminLocale();
  const t = adminJournalPage(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <p className={styles.lead}>{t.lead}</p>
      <JournalClient />
    </main>
  );
}

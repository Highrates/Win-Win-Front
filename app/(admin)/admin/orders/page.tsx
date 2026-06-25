import { adminOrdersPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalog/catalogAdmin.module.css';
import { AdminOrdersSectionClient } from './AdminOrdersSectionClient';

export default function AdminOrdersPage() {
  const locale = getAdminLocale();
  const t = adminOrdersPage(locale);
  return (
    <main>
      <h1 className={styles.title}>{t.title}</h1>
      <AdminOrdersSectionClient />
    </main>
  );
}

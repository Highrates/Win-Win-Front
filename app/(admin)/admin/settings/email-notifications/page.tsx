import Link from 'next/link';
import { adminNavBackToDashboard } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import { EmailNotificationsAdminClient } from './EmailNotificationsAdminClient';

export default function AdminEmailNotificationsPage() {
  const locale = getAdminLocale();
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>Email-уведомления</h1>
      <EmailNotificationsAdminClient />
    </main>
  );
}

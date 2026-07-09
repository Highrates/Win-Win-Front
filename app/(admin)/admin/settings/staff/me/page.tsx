import Link from 'next/link';
import { adminNavBackToDashboard, adminStaffMePage } from '@/lib/admin-i18n/adminStaffI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import catalogStyles from '../../../catalog/catalogAdmin.module.css';
import { StaffMeClient } from './StaffMeClient';

export default function AdminStaffMePage() {
  const locale = getAdminLocale();
  const t = adminStaffMePage(locale);
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.pageTitle}</h1>
      <StaffMeClient />
    </main>
  );
}

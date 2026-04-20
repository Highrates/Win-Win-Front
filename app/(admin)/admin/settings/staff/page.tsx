import Link from 'next/link';
import { adminNavBackToDashboard, adminSettingsStaffPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminSettingsStaffPage() {
  const locale = getAdminLocale();
  const t = adminSettingsStaffPage(locale);
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <p className={catalogStyles.lead}>{t.devNote}</p>
    </main>
  );
}

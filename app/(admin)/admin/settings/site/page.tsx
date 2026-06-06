import Link from 'next/link';
import { adminNavBackToDashboard, adminSettingsSitePage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import { SiteSettingsClient } from './site/SiteSettingsClient';

export default function AdminSettingsSitePage() {
  const locale = getAdminLocale();
  const t = adminSettingsSitePage(locale);
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <SiteSettingsClient />
    </main>
  );
}

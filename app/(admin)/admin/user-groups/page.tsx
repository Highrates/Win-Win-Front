import Link from 'next/link';
import { adminNavBackToDashboard, adminUserGroupsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { UserGroupsAdminClient } from './UserGroupsAdminClient';
import catalogStyles from '../catalog/catalogAdmin.module.css';

export default function AdminUserGroupsPage() {
  const locale = getAdminLocale();
  const t = adminUserGroupsPage(locale);
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <UserGroupsAdminClient />
    </main>
  );
}

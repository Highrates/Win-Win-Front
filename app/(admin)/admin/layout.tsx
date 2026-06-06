import { getAdminBuildId } from '@/lib/adminDeployRecovery/getAdminBuildId';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { AdminChrome } from './AdminChrome';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = getAdminLocale();
  const buildId = getAdminBuildId();
  return (
    <AdminChrome initialLocale={initialLocale} buildId={buildId}>
      {children}
    </AdminChrome>
  );
}

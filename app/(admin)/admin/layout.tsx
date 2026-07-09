import { redirect } from 'next/navigation';
import { getAdminBuildId } from '@/lib/adminDeployRecovery/getAdminBuildId';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { assertStaffCanAccessAdminPath } from '@/lib/adminPermissions/assertAdminPathAccess';
import { getAdminPathname } from '@/lib/adminPermissions/getAdminPathname';
import { getAdminStaffSession } from '@/lib/adminPermissions/getAdminStaffSession';
import { AdminChrome } from './AdminChrome';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = getAdminPathname();

  if (pathname && pathname !== '/admin/login') {
    const session = await getAdminStaffSession();
    if (session.error !== 'api_unreachable') {
      if (!session.authenticated || !session.user?.staff) {
        redirect('/admin/login');
      }
      if (!assertStaffCanAccessAdminPath(pathname, session.user.staff)) {
        redirect('/admin?denied=1');
      }
    }
  }

  const initialLocale = getAdminLocale();
  const buildId = getAdminBuildId();
  return (
    <AdminChrome initialLocale={initialLocale} buildId={buildId}>
      {children}
    </AdminChrome>
  );
}

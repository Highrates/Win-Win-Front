import { redirect } from 'next/navigation';
import { buildAdminLoginHref } from '@/lib/adminAuth';
import { getAdminBuildId } from '@/lib/adminDeployRecovery/getAdminBuildId';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { assertStaffCanAccessAdminPath } from '@/lib/adminPermissions/assertAdminPathAccess';
import { getAdminPathname } from '@/lib/adminPermissions/getAdminPathname';
import { getAdminStaffSession } from '@/lib/adminPermissions/getAdminStaffSession';
import { AdminChrome } from '../AdminChrome';

/**
 * Авторизованная оболочка админки. Login живёт вне этой группы —
 * skip chrome не зависит от `x-pathname` (пустой header больше не возвращает chrome на логин).
 */
export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = getAdminPathname();

  const session = await getAdminStaffSession();
  if (session.error !== 'api_unreachable') {
    if (!session.authenticated || !session.user?.staff) {
      redirect(buildAdminLoginHref(pathname || null));
    }
    if (pathname && !assertStaffCanAccessAdminPath(pathname, session.user.staff)) {
      redirect('/admin?denied=1');
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

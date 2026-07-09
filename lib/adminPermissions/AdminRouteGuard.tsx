'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AdminPermissionsLoadingShell } from './AdminPermissionsLoadingShell';
import { useAdminPermissions } from './AdminPermissionsProvider';

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { loading, staff, canAccessPathname } = useAdminPermissions();

  useEffect(() => {
    if (loading || pathname === '/admin/login') return;
    if (!staff) {
      router.replace('/admin/login');
      return;
    }
    if (!canAccessPathname(pathname)) {
      router.replace('/admin?denied=1');
    }
  }, [loading, pathname, staff, canAccessPathname, router]);

  if (loading) {
    return <AdminPermissionsLoadingShell />;
  }

  if (pathname !== '/admin/login' && !staff) {
    return <AdminPermissionsLoadingShell />;
  }

  if (pathname !== '/admin/login' && !canAccessPathname(pathname)) {
    return <AdminPermissionsLoadingShell />;
  }

  return <>{children}</>;
}

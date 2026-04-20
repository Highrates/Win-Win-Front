import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { AdminChrome } from './AdminChrome';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = getAdminLocale();
  return (
    <AdminChrome initialLocale={initialLocale}>{children}</AdminChrome>
  );
}

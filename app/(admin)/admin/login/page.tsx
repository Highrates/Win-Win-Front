import { sanitizeAdminCallbackUrl } from '@/lib/adminAuth';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { AdminLoginForm } from './AdminLoginForm';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { from?: string | string[] };
}) {
  const locale = getAdminLocale();
  const rawFrom = searchParams?.from;
  const raw = typeof rawFrom === 'string' ? rawFrom : Array.isArray(rawFrom) ? rawFrom[0] : null;
  const from = sanitizeAdminCallbackUrl(raw);

  return <AdminLoginForm initialLocale={locale} from={from} />;
}

import { adminReferralsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';

export default function AdminReferralsPage() {
  const locale = getAdminLocale();
  const t = adminReferralsPage(locale);
  return (
    <main>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>
    </main>
  );
}

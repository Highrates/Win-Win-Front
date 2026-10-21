import { adminReferralsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { ReferralsAdminClient } from './ReferralsAdminClient';

export default function AdminReferralsPage() {
  const locale = getAdminLocale();
  const t = adminReferralsPage(locale);
  return <ReferralsAdminClient title={t.title} labels={t.tabLabels} leads={t.tabLeads} />;
}

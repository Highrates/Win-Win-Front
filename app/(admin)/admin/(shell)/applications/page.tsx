import { adminApplicationsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { ApplicationsAdminClient } from './ApplicationsAdminClient';

export default function AdminApplicationsPage() {
  const locale = getAdminLocale();
  const t = adminApplicationsPage(locale);
  return (
    <ApplicationsAdminClient title={t.title} labels={t.tabLabels} leads={t.tabLeads} designer={t.designer} />
  );
}

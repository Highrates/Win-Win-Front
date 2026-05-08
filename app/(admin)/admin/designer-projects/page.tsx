import { adminDesignerProjectsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { DesignerProjectsAdminClient } from './DesignerProjectsAdminClient';

export default function AdminDesignerProjectsPage() {
  const locale = getAdminLocale();
  const t = adminDesignerProjectsPage(locale);
  return (
    <DesignerProjectsAdminClient
      title={t.title}
      lead={t.lead}
      searchPlaceholder={t.searchPlaceholder}
      thProject={t.thProject}
      thUser={t.thUser}
      thLines={t.thLines}
      thRooms={t.thRooms}
      thTotal={t.thTotal}
      thUpdated={t.thUpdated}
      empty={t.empty}
      loadingLabel={t.loading}
      prev={t.prev}
      next={t.next}
    />
  );
}

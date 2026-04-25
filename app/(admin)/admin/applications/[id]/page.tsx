import { adminApplicationDetailPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { ApplicationDetailClient } from './ApplicationDetailClient';

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = getAdminLocale();
  const t = adminApplicationDetailPage(locale);
  return <ApplicationDetailClient id={id} t={t} />;
}

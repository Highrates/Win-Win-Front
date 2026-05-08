import { notFound } from 'next/navigation';
import { adminDesignerProjectsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { DesignerProjectAdminDetailClient } from './DesignerProjectAdminDetailClient';

export default async function AdminDesignerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();
  const locale = getAdminLocale();
  const t = adminDesignerProjectsPage(locale);
  return (
    <DesignerProjectAdminDetailClient
      projectId={id}
      t={{
        detailBack: t.detailBack,
        detailUser: t.detailUser,
        detailAddress: t.detailAddress,
        detailUpdated: t.detailUpdated,
        detailTotal: t.detailTotal,
        linesTitle: t.linesTitle,
        lineProduct: t.lineProduct,
        lineCategory: t.lineCategory,
        lineQty: t.lineQty,
        lineUnit: t.lineUnit,
        lineVariant: t.lineVariant,
        lineTotal: t.lineTotal,
        loading: t.loading,
        errLoad: t.errLoad,
      }}
    />
  );
}

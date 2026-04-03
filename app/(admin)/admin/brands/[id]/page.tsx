import { BrandEditorClient } from '../BrandEditorClient';

export default function AdminBrandDetailPage({ params }: { params: { id: string } }) {
  return <BrandEditorClient brandId={params.id} />;
}

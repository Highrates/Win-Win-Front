import { CategoryDetailClient } from './CategoryDetailClient';

export default function AdminCategoryDetailPage({ params }: { params: { id: string } }) {
  return <CategoryDetailClient id={params.id} />;
}

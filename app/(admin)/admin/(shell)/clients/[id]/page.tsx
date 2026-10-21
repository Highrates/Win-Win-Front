import { AdminClientDetailClient } from './AdminClientDetailClient';

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminClientDetailClient id={id} />;
}

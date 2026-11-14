import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from '../ToursAdminNav';
import { TourEditorClient } from '../TourEditorClient';

export default async function AdminTourEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1 className={catalogStyles.title}>Редактирование тура</h1>
      <ToursAdminNav />
      <TourEditorClient tourId={id} />
    </main>
  );
}

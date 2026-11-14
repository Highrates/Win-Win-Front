import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from '../ToursAdminNav';
import { TourEditorClient } from '../TourEditorClient';

export default function AdminTourNewPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Новый тур</h1>
      <ToursAdminNav />
      <TourEditorClient />
    </main>
  );
}

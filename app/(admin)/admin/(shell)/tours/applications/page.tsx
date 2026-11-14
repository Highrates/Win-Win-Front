import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from '../ToursAdminNav';
import { TourApplicationsClient } from './ApplicationsClient';

export default function AdminTourApplicationsPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Заявки на туры</h1>
      <ToursAdminNav />
      <TourApplicationsClient />
    </main>
  );
}

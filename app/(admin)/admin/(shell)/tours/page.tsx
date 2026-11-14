import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from './ToursAdminNav';
import { ToursListClient } from './ToursListClient';

export default function AdminToursPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Туры в Китай</h1>
      <ToursAdminNav />
      <ToursListClient />
    </main>
  );
}

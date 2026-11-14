import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from '../ToursAdminNav';
import { LandingEditorClient } from './LandingEditorClient';

export default function AdminToursLandingPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Лендинг туров</h1>
      <ToursAdminNav />
      <LandingEditorClient />
    </main>
  );
}

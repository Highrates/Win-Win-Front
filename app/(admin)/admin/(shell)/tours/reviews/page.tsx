import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ToursAdminNav } from '../ToursAdminNav';
import { TourReviewsClient } from './ReviewsClient';

export default function AdminTourReviewsPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Отзывы о турах</h1>
      <ToursAdminNav />
      <TourReviewsClient />
    </main>
  );
}

import Link from 'next/link';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import styles from '../../../catalog/catalogAdmin.module.css';
import { SourcingAdminDetailClient } from './SourcingAdminDetailClient';

export default function AdminSourcingRequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/orders?section=sourcing" className={styles.backLink}>
          ← К заявкам на подбор
        </Link>
      </p>
      <h1 className={styles.title}>Заявка на подбор {formatOrderDisplayId(params.id)}</h1>
      <SourcingAdminDetailClient id={params.id} />
    </main>
  );
}

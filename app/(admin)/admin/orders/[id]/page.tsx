import Link from 'next/link';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import styles from '../../catalog/catalogAdmin.module.css';
import { OrderAdminDetailClient } from './OrderAdminDetailClient';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const locale = getAdminLocale();
  const t = adminOrderDetailStrings(locale);
  return (
    <main>
      <p className={styles.backRow}>
        <Link href="/admin/orders" className={styles.backLink}>
          {t.backList}
        </Link>
      </p>
      <h1 className={styles.title}>
        {t.title} {formatOrderDisplayId(params.id)}
      </h1>
      <OrderAdminDetailClient orderId={params.id} />
    </main>
  );
}

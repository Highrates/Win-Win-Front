import Link from 'next/link';
import { adminOrderKpStrings } from '@/lib/admin-i18n/adminOrderKpI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { OrderKpEditorClient } from './OrderKpEditorClient';

export default function AdminOrderKpPage({ params }: { params: { id: string } }) {
  const locale = getAdminLocale();
  const t = adminOrderKpStrings(locale);
  const orderHref = `/admin/orders/${encodeURIComponent(params.id)}`;
  const displayId = formatOrderDisplayId(params.id);
  return (
    <main>
      <nav className={styles.breadcrumb} aria-label={t.crumbNavAria}>
        <Link href="/admin/orders" className={styles.breadcrumbLink}>
          {t.crumbOrders}
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden>
          /
        </span>
        <Link href={orderHref} className={styles.breadcrumbLink}>
          {displayId}
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden>
          /
        </span>
        <span className={styles.breadcrumbCurrent}>{t.pageTitle}</span>
      </nav>
      <h1 className={styles.title}>
        {t.pageTitle} · {displayId}
      </h1>
      <OrderKpEditorClient orderId={params.id} />
    </main>
  );
}

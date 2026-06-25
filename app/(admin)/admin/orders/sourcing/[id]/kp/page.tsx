import Link from 'next/link';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { adminSourcingKpStrings } from '@/lib/admin-i18n/adminSourcingKpI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import styles from '../../../../catalog/catalogAdmin.module.css';
import { SourcingKpEditorClient } from './SourcingKpEditorClient';

export default function AdminSourcingKpPage({ params }: { params: { id: string } }) {
  const locale = getAdminLocale();
  const t = adminSourcingKpStrings(locale);
  const d = adminOrderDetailStrings(locale);
  return (
    <main>
      <p className={styles.backRow}>
        <Link href={`/admin/orders/sourcing/${encodeURIComponent(params.id)}`} className={styles.backLink}>
          {t.backToRequest}
        </Link>
      </p>
      <h1 className={styles.title}>
        {d.actionPrepareCp} · {formatOrderDisplayId(params.id)}
      </h1>
      <SourcingKpEditorClient sourcingRequestId={params.id} />
    </main>
  );
}

import Link from 'next/link';
import { adminSourcingKpStrings } from '@/lib/admin-i18n/adminSourcingKpI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { SourcingKpEditorClient } from './SourcingKpEditorClient';

export default function AdminSourcingKpPage({ params }: { params: { id: string } }) {
  const locale = getAdminLocale();
  const t = adminSourcingKpStrings(locale);
  const detailHref = `/admin/orders/sourcing/${encodeURIComponent(params.id)}`;
  const displayId = formatOrderDisplayId(params.id);
  return (
    <main>
      <nav className={styles.breadcrumb} aria-label={t.crumbNavAria}>
        <Link href="/admin/orders/sourcing" className={styles.breadcrumbLink}>
          {t.crumbSourcing}
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden>
          /
        </span>
        <Link href={detailHref} className={styles.breadcrumbLink}>
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
      <SourcingKpEditorClient sourcingRequestId={params.id} />
    </main>
  );
}

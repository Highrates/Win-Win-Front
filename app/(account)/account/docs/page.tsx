import { AccountDocRow } from '@/components/AccountDocRow/AccountDocRow';
import { ACCOUNT_DOCS_GROUPS } from '@/lib/account/docsTimeline';
import { formatAccountDocDateHeader } from '@/lib/account/formatAccountDocDate';
import styles from './page.module.css';

export default function DocsPage() {
  return (
    <div className={styles.page} aria-label="Документы">
      {ACCOUNT_DOCS_GROUPS.map((group) => (
        <div key={group.dateISO} className={styles.dateBlock}>
          <div className={styles.dateWrapper}>
            <span className={styles.dateLabel}>{formatAccountDocDateHeader(group.dateISO)}</span>
            <span className={styles.dateLine} aria-hidden />
          </div>
          <div className={styles.docsWrapper}>
            {group.docs.map((doc) => (
              <AccountDocRow key={doc.id} title={doc.title} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

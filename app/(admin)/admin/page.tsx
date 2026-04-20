import Link from 'next/link';
import { adminDashboardStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from './dashboard.module.css';

export default function AdminDashboardPage() {
  const locale = getAdminLocale();
  const { title, lead, links } = adminDashboardStrings(locale);
  return (
    <main>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
      <ul className={styles.grid}>
        {links.map(({ href, label, note }) => (
          <li key={href}>
            <Link href={href} className={styles.card}>
              <span className={styles.cardTitle}>{label}</span>
              <span className={styles.cardNote}>{note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

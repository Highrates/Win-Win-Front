import Link from 'next/link';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminSettingsStaffPage() {
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          ← В админку
        </Link>
      </p>
      <h1 className={catalogStyles.title}>Сотрудники</h1>
      <p className={catalogStyles.lead}>Раздел в разработке.</p>
    </main>
  );
}

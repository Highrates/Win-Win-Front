import { Suspense } from 'react';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { adminLoginStrings } from '@/lib/admin-i18n/adminLoginI18n';
import { AdminLoginForm } from './AdminLoginForm';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const locale = getAdminLocale();
  const str = adminLoginStrings(locale);
  return (
    <Suspense
      fallback={
        <div className={styles.wrap}>
          <main className={styles.card}>
            <p className={styles.hint}>{str.loading}</p>
          </main>
        </div>
      }
    >
      <AdminLoginForm initialLocale={locale} />
    </Suspense>
  );
}

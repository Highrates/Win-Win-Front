import { adminBrandsPageTitle } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '../catalog/catalogAdmin.module.css';
import { BrandsListClient } from './BrandsListClient';

export default function AdminBrandsPage() {
  const locale = getAdminLocale();
  return (
    <main>
      <h1 className={styles.title}>{adminBrandsPageTitle(locale)}</h1>
      <BrandsListClient />
    </main>
  );
}

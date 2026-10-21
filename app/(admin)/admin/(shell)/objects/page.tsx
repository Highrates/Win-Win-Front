import { adminObjectsPageStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import { ObjectsLibraryClient } from './ObjectsLibraryClient';

export default function AdminObjectsPage() {
  const locale = getAdminLocale();
  const { title, compressLink } = adminObjectsPageStrings(locale);
  return (
    <main>
      <h1 className={styles.title}>{title}</h1>
      <ObjectsLibraryClient
        lead={
          <p className={styles.lead}>
            <a
              href="https://www.iloveimg.com/compress-image"
              target="_blank"
              rel="noopener noreferrer"
            >
              {compressLink}
            </a>
          </p>
        }
      />
    </main>
  );
}

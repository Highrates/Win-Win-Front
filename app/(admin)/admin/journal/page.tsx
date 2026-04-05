import styles from '../catalog/catalogAdmin.module.css';
import { JournalClient } from './JournalClient';

export default function AdminJournalPage() {
  return (
    <main>
      <h1 className={styles.title}>Журнал</h1>
      <p className={styles.lead}>Кто и что менял в админке, входы и загрузки файлов.</p>
      <JournalClient />
    </main>
  );
}

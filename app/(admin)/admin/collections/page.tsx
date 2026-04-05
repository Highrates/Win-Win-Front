import { CollectionsListClient } from './CollectionsListClient';
import styles from '../catalog/catalogAdmin.module.css';

export default function AdminCollectionsPage() {
  return (
    <main>
      <h1 className={styles.title}>Коллекции</h1>
      <p className={styles.muted} style={{ marginTop: 0, marginBottom: 20 }}>
        Редакторские подборки товаров или брендов для витрины.
      </p>
      <CollectionsListClient />
    </main>
  );
}

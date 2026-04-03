import styles from '../catalog/catalogAdmin.module.css';
import { ObjectsLibraryClient } from './ObjectsLibraryClient';

export default function AdminObjectsPage() {
  return (
    <main>
      <h1 className={styles.title}>Объекты</h1>
      <ObjectsLibraryClient />
    </main>
  );
}

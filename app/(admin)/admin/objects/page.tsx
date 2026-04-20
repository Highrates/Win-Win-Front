import styles from '../catalog/catalogAdmin.module.css';
import { ObjectsLibraryClient } from './ObjectsLibraryClient';

export default function AdminObjectsPage() {
  return (
    <main>
      <h1 className={styles.title}>Объекты</h1>
      <p className={styles.lead}>
        <a
          href="https://www.iloveimg.com/compress-image"
          target="_blank"
          rel="noopener noreferrer"
        >
          Сжимать тут
        </a>
      </p>
      <ObjectsLibraryClient />
    </main>
  );
}

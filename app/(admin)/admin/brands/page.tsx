import styles from '../catalog/catalogAdmin.module.css';
import { BrandsListClient } from './BrandsListClient';

export default function AdminBrandsPage() {
  return (
    <main>
      <h1 className={styles.title}>Бренды</h1>
      <BrandsListClient />
    </main>
  );
}

import styles from '../catalogAdmin.module.css';
import { CategoriesListClient } from './CategoriesListClient';

export default function AdminCategoriesPage() {
  return (
    <main>
      <h1 className={styles.title}>Категории</h1>
      <CategoriesListClient />
    </main>
  );
}

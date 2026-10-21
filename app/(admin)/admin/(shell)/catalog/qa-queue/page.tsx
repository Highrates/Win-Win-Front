'use client';

import { ProductQaQueueClient } from './ProductQaQueueClient';
import { AdminProductQaQueuePageTitle } from './AdminProductQaQueuePageTitle';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';

export default function AdminProductQaQueuePage() {
  return (
    <main>
      <AdminProductQaQueuePageTitle className={styles.title} />
      <ProductQaQueueClient />
    </main>
  );
}

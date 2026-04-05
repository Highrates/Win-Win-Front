import styles from '../catalog/catalogAdmin.module.css';
import { OrdersAdminClient } from './OrdersAdminClient';

export default function AdminOrdersPage() {
  return (
    <main>
      <h1 className={styles.title}>Заказы</h1>
      <p className={styles.lead}>Список заказов и смена статуса (ADMIN / MODERATOR).</p>
      <OrdersAdminClient />
    </main>
  );
}

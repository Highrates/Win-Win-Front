import Link from 'next/link';
import styles from './ProductQaChatPanel.module.css';

export function ProductChatStaffBanner() {
  return (
    <>
      Вы вошли как сотрудник — отвечайте покупателям из{' '}
      <Link href="/admin/catalog/qa-queue" className={styles.guestLink}>
        админки
      </Link>
    </>
  );
}

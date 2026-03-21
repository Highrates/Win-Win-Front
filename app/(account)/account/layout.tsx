import { CustomerAccountSidebar } from '@/components/CustomerAccountSidebar/CustomerAccountSidebar';
import styles from './AccountLayout.module.css';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <section className={styles.accountMainSection} aria-label="Личный кабинет">
        <div className="padding-global">
          <div className={styles.accountLayoutWrapper}>
            <div className={styles.accountSidebarSlot}>
              <CustomerAccountSidebar />
            </div>
            <div className={styles.accountContent}>{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

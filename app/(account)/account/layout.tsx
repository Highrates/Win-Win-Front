import { redirect } from 'next/navigation';
import { CustomerAccountSidebarContainer } from '@/components/CustomerAccountSidebar/CustomerAccountSidebarContainer';
import { getServerUserSession } from '@/lib/userSessionServer';
import styles from './AccountLayout.module.css';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerUserSession();
  if (!session.authenticated) {
    redirect('/login/email');
  }
  return (
    <main>
      <section className={styles.accountMainSection} aria-label="Личный кабинет">
        <div className="padding-global">
          <div className={styles.accountLayoutWrapper}>
            <div className={styles.accountSidebarSlot}>
              <CustomerAccountSidebarContainer />
            </div>
            <div className={styles.accountContent}>{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

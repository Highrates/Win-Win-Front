import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CustomerAccountSidebar } from '@/components/CustomerAccountSidebar/CustomerAccountSidebar';
import { USER_ACCESS_TOKEN_COOKIE } from '@/lib/userAuth';
import styles from './AccountLayout.module.css';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(USER_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login/email');
  }
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

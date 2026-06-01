import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { LoginEmailForm } from '@/components/auth-forms';
import { redirectIfUserAuthenticated } from '@/lib/authGuestServer';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Вход в аккаунт — Win-Win',
  description: 'Вход по email или телефону и паролю',
};

export default async function LoginEmailPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  await redirectIfUserAuthenticated(searchParams?.callbackUrl);
  return (
    <AuthPageShell
      sectionAriaLabel="Вход в аккаунт"
      title="Вход в аккаунт"
      subtitle={
        <>
          Впервые у нас?{' '}
          <Link href="/register" className={styles.authLinkAccent}>
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginEmailForm />
    </AuthPageShell>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { LoginEmailForm } from '@/components/auth-forms';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Вход в аккаунт — Win-Win',
  description: 'Вход по email и паролю',
};

export default function LoginEmailPage() {
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

      <Link href="/login/phone" className={styles.authAltMethod}>
        Войти по номеру телефона
      </Link>
    </AuthPageShell>
  );
}

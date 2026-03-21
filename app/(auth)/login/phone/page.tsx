import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { LoginPhoneForm } from '@/components/auth-forms';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Вход по телефону — Win-Win',
  description: 'Вход в аккаунт по номеру телефона',
};

export default function LoginPhonePage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Вход по номеру телефона"
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
      <LoginPhoneForm />

      <Link href="/login/email" className={styles.authAltMethod}>
        Войти по email
      </Link>
    </AuthPageShell>
  );
}

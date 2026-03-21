import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { RegisterEmailForm } from '@/components/auth-forms';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Регистрация — Win-Win',
  description: 'Создание аккаунта по email',
};

export default function RegisterEmailPage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Регистрация по email"
      title="Регистрация"
      subtitle={
        <>
          Уже есть аккаунт?{' '}
          <Link href="/login" className={styles.authLinkAccent}>
            Войти
          </Link>
        </>
      }
    >
      <RegisterEmailForm />

      <Link href="/register/phone" className={styles.authAltMethod}>
        Регистрация по номеру телефона
      </Link>
    </AuthPageShell>
  );
}

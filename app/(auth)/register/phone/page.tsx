import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { RegisterPhoneForm } from '@/components/auth-forms';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Регистрация по телефону — Win-Win',
  description: 'Создание аккаунта по номеру телефона',
};

export default function RegisterPhonePage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Регистрация по номеру телефона"
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
      <RegisterPhoneForm />

      <Link href="/register/email" className={styles.authAltMethod}>
        Регистрация по email
      </Link>
    </AuthPageShell>
  );
}

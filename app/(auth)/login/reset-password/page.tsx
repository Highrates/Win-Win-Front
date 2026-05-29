import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { ResetPasswordForm } from '@/components/auth-forms/ResetPasswordForm';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Новый пароль — Win-Win',
  description: 'Задайте новый пароль для входа в аккаунт',
};

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Новый пароль"
      title="Новый пароль"
      subtitle="Задайте новый пароль для входа в личный кабинет."
      backHref="/login"
    >
      <ResetPasswordForm />

      <Link href="/login" className={styles.authAltMethod}>
        Вернуться ко входу
      </Link>
    </AuthPageShell>
  );
}

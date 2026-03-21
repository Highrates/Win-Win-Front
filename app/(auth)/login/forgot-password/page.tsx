import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageShell } from '@/components/AuthPageShell';
import { ForgotPasswordForm } from '@/components/auth-forms';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Забыли пароль — Win-Win',
  description: 'Восстановление доступа к аккаунту',
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Восстановление пароля"
      title="Забыли пароль"
      subtitle="Укажите email — отправим ссылку для сброса пароля."
      backHref="/login"
    >
      <ForgotPasswordForm />

      <Link href="/login" className={styles.authAltMethod}>
        Вернуться ко входу
      </Link>
    </AuthPageShell>
  );
}

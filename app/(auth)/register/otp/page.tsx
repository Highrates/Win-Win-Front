import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { AuthPageShell } from '@/components/AuthPageShell';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Подтверждение номера — Win-Win',
  description: 'Ввод кода из SMS при регистрации',
};

export default function RegisterOtpPage() {
  return (
    <AuthPageShell
      sectionAriaLabel="Подтверждение номера при регистрации"
      title="Ожидание OTP"
      subtitle={
        <p className={styles.authOtpHint}>
          Введите код из SMS, чтобы завершить регистрацию по номеру телефона.
        </p>
      }
      backHref="/register/phone"
    >
      <form className={styles.authForm} noValidate>
        <div className={styles.authFields}>
          <TextField
            label="Код из SMS"
            type="text"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            maxLength={6}
          />
        </div>

        <Button type="submit" variant="primary">
          Подтвердить
        </Button>
      </form>

      <button type="button" className={styles.authAltMethod}>
        Отправить код повторно
      </button>
    </AuthPageShell>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { passwordResetRequest } from '@/lib/passwordResetApi';
import { validateEmailRequired } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get('email') ?? '');
        const err = validateEmailRequired(email);
        setEmailError(err);
        if (err) return;

        setBusy(true);
        try {
          const data = await passwordResetRequest(email.trim().toLowerCase());
          setSuccessMessage(
            data.devHint ? `${data.message}\n\n${data.devHint}` : data.message,
          );
        } catch (submitErr) {
          setFormError(submitErr instanceof Error ? submitErr.message : 'Не удалось отправить письмо');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={styles.authFields}>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder=""
          error={emailError ?? undefined}
          onChange={() => {
            setEmailError(null);
            setFormError(null);
            setSuccessMessage(null);
          }}
        />
        {successMessage ? (
          <p className={styles.authOtpHint} role="status" style={{ whiteSpace: 'pre-line' }}>
            {successMessage}
          </p>
        ) : null}
        {formError ? (
          <p className={styles.authError} role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="primary" disabled={busy || !!successMessage}>
        {busy ? 'Отправка…' : 'Отправить ссылку'}
      </Button>
    </form>
  );
}

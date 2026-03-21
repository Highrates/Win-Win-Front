'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { validateEmailRequired } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function ForgotPasswordForm() {
  const [emailError, setEmailError] = useState<string | null>(null);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get('email') ?? '');
        const err = validateEmailRequired(email);
        setEmailError(err);
        if (err) return;
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
          onChange={() => setEmailError(null)}
        />
      </div>

      <Button type="submit" variant="primary">
        Отправить ссылку
      </Button>
    </form>
  );
}

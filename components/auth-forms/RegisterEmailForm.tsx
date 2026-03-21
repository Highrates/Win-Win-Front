'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { validateEmailRequired } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function RegisterEmailForm() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get('email') ?? '');
        const password = String(fd.get('password') ?? '');
        const confirm = String(fd.get('passwordConfirm') ?? '');

        const eErr = validateEmailRequired(email);
        const pErr = !password.trim() ? 'Введите пароль' : null;
        const cErr =
          !confirm.trim() ? 'Повторите пароль' : password !== confirm ? 'Пароли не совпадают' : null;

        setEmailError(eErr);
        setPasswordError(pErr);
        setConfirmError(cErr);
        if (eErr || pErr || cErr) return;
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
        <TextField
          label="Пароль"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder=""
          error={passwordError ?? undefined}
          onChange={() => setPasswordError(null)}
        />
        <TextField
          label="Повторите пароль"
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          placeholder=""
          error={confirmError ?? undefined}
          onChange={() => setConfirmError(null)}
        />
      </div>

      <Button type="submit" variant="primary">
        Зарегистрироваться
      </Button>
    </form>
  );
}

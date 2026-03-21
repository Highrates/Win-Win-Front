'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { validateEmailRequired } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function LoginEmailForm() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get('email') ?? '');
        const password = String(fd.get('password') ?? '');

        const eErr = validateEmailRequired(email);
        const pErr = !password.trim() ? 'Введите пароль' : null;

        setEmailError(eErr);
        setPasswordError(pErr);
        if (eErr || pErr) return;
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
          autoComplete="current-password"
          placeholder=""
          error={passwordError ?? undefined}
          onChange={() => setPasswordError(null)}
        />
        <Link href="/login/forgot-password" className={styles.authForgotLink}>
          Забыли пароль
        </Link>
      </div>

      <Button type="submit" variant="primary">
        Войти
      </Button>
    </form>
  );
}

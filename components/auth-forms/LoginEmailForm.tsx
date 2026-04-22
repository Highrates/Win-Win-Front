'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { setUserAccessToken } from '@/lib/userAuthStorage';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function LoginEmailForm() {
  const router = useRouter();
  const [idError, setIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.currentTarget);
        const emailOrPhone = String(fd.get('emailOrPhone') ?? '');
        const password = String(fd.get('password') ?? '');

        const eErr = !emailOrPhone.trim() ? 'Укажите почту или номер телефона' : null;
        const pErr = !password.trim() ? 'Введите пароль' : null;

        setIdError(eErr);
        setPasswordError(pErr);
        if (eErr || pErr) return;

        setBusy(true);
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ emailOrPhone, password }),
            credentials: 'same-origin',
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            access_token?: string;
            error?: string;
          };
          if (!res.ok || !data.access_token) {
            setFormError(data.error || 'Не удалось войти');
            return;
          }

          // Для клиентских запросов (если они появятся) + совместимость с регистрацией.
          setUserAccessToken(data.access_token);
          router.push('/account');
          router.refresh();
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Не удалось войти');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={styles.authFields}>
        <TextField
          label="Почта или номер телефона"
          type="text"
          name="emailOrPhone"
          autoComplete="username"
          placeholder=""
          error={idError ?? undefined}
          onChange={() => setIdError(null)}
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
        {formError ? (
          <p className={styles.authError} role="alert">
            {formError}
          </p>
        ) : null}
        <Link href="/login/forgot-password" className={styles.authForgotLink}>
          Забыли пароль
        </Link>
      </div>

      <Button type="submit" variant="primary" disabled={busy}>
        {busy ? 'Вход…' : 'Войти'}
      </Button>
    </form>
  );
}

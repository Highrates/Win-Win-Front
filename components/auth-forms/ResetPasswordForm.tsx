'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { passwordResetConfirm, passwordResetVerify } from '@/lib/passwordResetApi';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get('t') ?? '').trim();

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenError('Ссылка недействительна или истекла');
      return;
    }
    let cancelled = false;
    void passwordResetVerify(token)
      .then((r) => {
        if (cancelled) return;
        if (r.valid) {
          setTokenValid(true);
          setTokenError(null);
        } else {
          setTokenValid(false);
          setTokenError(r.message ?? 'Ссылка недействительна или истекла');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokenValid(false);
          setTokenError('Не удалось проверить ссылку. Попробуйте позже.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (tokenValid === null) {
    return <p className={styles.authOtpHint}>Проверяем ссылку…</p>;
  }

  if (!tokenValid) {
    return (
      <>
        <p className={styles.authError} role="alert">
          {tokenError ?? 'Ссылка недействительна или истекла'}
        </p>
        <Link href="/login/forgot-password" className={styles.authAltMethod}>
          Запросить новую ссылку
        </Link>
      </>
    );
  }

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.currentTarget);
        const password = String(fd.get('password') ?? '');
        const confirm = String(fd.get('passwordConfirm') ?? '');
        if (password.length < 8) {
          setFormError('Пароль не короче 8 символов');
          return;
        }
        if (password !== confirm) {
          setFormError('Пароли не совпадают');
          return;
        }

        setBusy(true);
        try {
          await passwordResetConfirm(token, password);
          router.push('/login/email?reset=ok');
        } catch (submitErr) {
          setFormError(submitErr instanceof Error ? submitErr.message : 'Не удалось сохранить пароль');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={styles.authFields}>
        <TextField label="Новый пароль" type="password" name="password" autoComplete="new-password" />
        <TextField
          label="Повторите пароль"
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
        />
        {formError ? (
          <p className={styles.authError} role="alert">
            {formError}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="primary" disabled={busy}>
        {busy ? 'Сохранение…' : 'Сохранить пароль'}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<p className={styles.authOtpHint}>Загрузка…</p>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}

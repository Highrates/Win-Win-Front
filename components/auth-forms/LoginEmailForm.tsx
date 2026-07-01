'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { navigateAfterUserAuth } from '@/lib/userAuthNavigation';
import {
  formatDesignerInviteClaimError,
} from '@/lib/designerInvites/loginHints';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

function LoginEmailFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designerInviteToken = (searchParams.get('designerInvite') ?? '').trim() || undefined;
  const prefillEmailFromUrl = useMemo(
    () => (searchParams.get('prefillEmail') ?? '').trim().toLowerCase() || '',
    [searchParams],
  );
  const designerInviteError = useMemo(
    () => (searchParams.get('designerInviteError') ?? '').trim() || '',
    [searchParams],
  );
  const callbackUrl = searchParams.get('callbackUrl');
  const resetOk = searchParams.get('reset') === 'ok';
  const [inviteEmail, setInviteEmail] = useState(prefillEmailFromUrl);
  const [identity, setIdentity] = useState(prefillEmailFromUrl);
  const [idError, setIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInviteEmail(prefillEmailFromUrl);
    if (prefillEmailFromUrl) setIdentity(prefillEmailFromUrl);
  }, [prefillEmailFromUrl]);

  useEffect(() => {
    if (!designerInviteToken || prefillEmailFromUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/designer-invite/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ token: designerInviteToken }),
        });
        const body = (await res.json().catch(() => ({}))) as { email?: string };
        const email = (body.email ?? '').trim().toLowerCase();
        if (!cancelled && res.ok && email) {
          setInviteEmail(email);
          setIdentity((prev) => prev || email);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designerInviteToken, prefillEmailFromUrl]);

  const inviteEmailHint = designerInviteToken && inviteEmail ? inviteEmail : null;

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.currentTarget);
        const emailOrPhone = String(fd.get('emailOrPhone') ?? identity ?? '');
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
            error?: string;
            user?: { profile?: { profileOnboardingPending?: boolean } | null };
          };
          if (!res.ok || data.ok !== true) {
            setFormError(data.error || 'Не удалось войти');
            return;
          }

          const nav = await navigateAfterUserAuth(router, {
            callbackUrl,
            user: data.user,
            designerInviteToken,
          });
          if (!nav.ok) {
            setFormError(formatDesignerInviteClaimError(nav.error, inviteEmailHint));
          }
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Не удалось войти');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={styles.authFields}>
        {inviteEmailHint ? (
          <p className={styles.authOtpHint}>
            Войдите с email из приглашения: <strong>{inviteEmailHint}</strong>
          </p>
        ) : null}
        <TextField
          label="Почта или номер телефона"
          type="text"
          name="emailOrPhone"
          autoComplete="username"
          placeholder=""
          value={identity}
          error={idError ?? undefined}
          onChange={(e) => {
            setIdentity(e.target.value);
            setIdError(null);
          }}
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
        {designerInviteError && !formError ? (
          <p className={styles.authError} role="alert">
            {designerInviteError}
          </p>
        ) : null}
        {formError ? (
          <p className={styles.authError} role="alert">
            {formError}
          </p>
        ) : null}
        {resetOk && !formError && !designerInviteError ? (
          <p className={styles.authOtpHint} role="status">
            Пароль обновлён. Войдите с новым паролем.
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

export function LoginEmailForm() {
  return (
    <Suspense fallback={<p className={styles.authOtpHint}>Загрузка…</p>}>
      <LoginEmailFormInner />
    </Suspense>
  );
}

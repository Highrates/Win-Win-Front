'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { setUserAccessToken } from '@/lib/userAuthStorage';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

const INVITE_KEY = 'winwin-designer-invite';

function LoginEmailFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDesignerInvite = searchParams.get('fromDesignerInvite') === '1';
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
            user?: { profile?: { profileOnboardingPending?: boolean } | null };
          };
          if (!res.ok || !data.access_token) {
            setFormError(data.error || 'Не удалось войти');
            return;
          }

          setUserAccessToken(data.access_token);
          await fetch('/api/user/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ access_token: data.access_token }),
            credentials: 'same-origin',
          }).catch(() => {});

          let inviteToken: string | null = null;
          try {
            inviteToken = sessionStorage.getItem(INVITE_KEY);
          } catch {
            /* */
          }

          if (fromDesignerInvite || inviteToken) {
            if (!inviteToken) {
              setFormError('Сессия приглашения утеряна. Откройте ссылку из письма снова.');
              return;
            }
            const cr = await fetch('/api/user/designer-invite/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ token: inviteToken }),
              credentials: 'same-origin',
            });
            const cj = (await cr.json().catch(() => ({}))) as { prefillRef?: string; message?: string };
            try {
              sessionStorage.removeItem(INVITE_KEY);
            } catch {
              /* */
            }
            if (cr.ok) {
              const q = new URLSearchParams();
              q.set('tab', 'info');
              q.set('partnerApply', '1');
              const pr = typeof cj.prefillRef === 'string' ? cj.prefillRef.trim() : '';
              if (pr) q.set('prefillRef', pr);
              router.push(`/account/profile?${q.toString()}`);
              router.refresh();
              return;
            }
            setFormError(
              typeof cj.message === 'string' && cj.message.trim()
                ? cj.message
                : 'Не удалось применить приглашение',
            );
            return;
          }

          const pending = data.user?.profile?.profileOnboardingPending;
          if (pending === true) {
            router.push('/account/profile?tab=info&welcome=1');
          } else {
            router.push('/account/orders');
          }
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

export function LoginEmailForm() {
  return (
    <Suspense fallback={<p className={styles.authOtpHint}>Загрузка…</p>}>
      <LoginEmailFormInner />
    </Suspense>
  );
}

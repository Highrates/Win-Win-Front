'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { TurnstileWidget } from '@/components/TurnstileWidget/TurnstileWidget';
import { passwordResetRequest } from '@/lib/passwordResetApi';
import { isTurnstileRequired } from '@/lib/turnstile';
import { validateEmailRequired } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

function ForgotPasswordFormInner() {
  const searchParams = useSearchParams();
  const prefillFromUrl = useMemo(() => {
    const fromEmail = (searchParams.get('email') ?? '').trim().toLowerCase();
    const fromPrefill = (searchParams.get('prefillEmail') ?? '').trim().toLowerCase();
    const raw = fromEmail || fromPrefill;
    return raw && !validateEmailRequired(raw) ? raw : '';
  }, [searchParams]);

  const [email, setEmail] = useState(prefillFromUrl);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const turnstileRequired = isTurnstileRequired();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    if (prefillFromUrl) setEmail(prefillFromUrl);
  }, [prefillFromUrl]);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);
        const err = validateEmailRequired(email);
        setEmailError(err);
        if (err) return;

        if (turnstileRequired && !turnstileToken) {
          setFormError('Подтвердите, что вы не робот');
          return;
        }

        setBusy(true);
        try {
          const data = await passwordResetRequest(email.trim().toLowerCase(), turnstileToken);
          setSuccessMessage(data.message);
          if (turnstileRequired) {
            setTurnstileToken(null);
            setTurnstileResetKey((k) => k + 1);
          }
        } catch (submitErr) {
          const msg =
            submitErr instanceof Error ? submitErr.message : 'Не удалось отправить письмо';
          setFormError(msg);
          if (turnstileRequired) {
            setTurnstileToken(null);
            setTurnstileResetKey((k) => k + 1);
          }
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
          value={email}
          error={emailError ?? undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
            setFormError(null);
            setSuccessMessage(null);
          }}
        />
        {turnstileRequired ? (
          <TurnstileWidget resetKey={turnstileResetKey} onToken={setTurnstileToken} />
        ) : null}
        {successMessage ? (
          <p className={styles.authOtpHint} role="status">
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

export function ForgotPasswordForm() {
  return (
    <Suspense fallback={<p className={styles.authOtpHint}>Загрузка…</p>}>
      <ForgotPasswordFormInner />
    </Suspense>
  );
}

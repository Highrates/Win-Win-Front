'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AuthPageShell } from '@/components/AuthPageShell';
import { Button } from '@/components/Button';
import { PhoneField } from '@/components/PhoneField';
import { TextField } from '@/components/TextField';
import { TurnstileWidget } from '@/components/TurnstileWidget/TurnstileWidget';
import {
  registerComplete,
  registerEmailStart,
  registerEmailVerify,
  registerPhoneStart,
  registerPhoneVerify,
} from '@/lib/registerApi';
import {
  buildDesignerInviteProfilePath,
  sanitizeCallbackUrl,
} from '@/lib/authRedirect';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';
import { isTurnstileRequired } from '@/lib/turnstile';
import { validateEmailRequired, validateE164Phone, validatePassword } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';
import flowStyles from './RegisterFlow.module.css';

function appendReferralWarningParam(url: string, warning?: string): string {
  const w = warning?.trim();
  if (!w) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}referralWarning=${encodeURIComponent(w)}`;
}

function buildRegisterAltHref(
  targetChannel: RegisterChannel,
  params: { ref?: string; callbackUrl?: string | null },
): string {
  const q = new URLSearchParams();
  const ref = params.ref?.trim();
  if (ref) q.set('ref', ref);
  const callbackUrl = params.callbackUrl?.trim();
  if (callbackUrl) q.set('callbackUrl', callbackUrl);
  const base = targetChannel === 'phone' ? '/register/phone' : '/register/email';
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export type RegisterChannel = 'phone' | 'email';

type Step = 1 | 2 | 3;

export function RegisterFlow({ channel }: { channel: RegisterChannel }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = useMemo(
    () => (searchParams.get('ref') ?? searchParams.get('r') ?? '').trim() || undefined,
    [searchParams],
  );
  const designerInviteToken = useMemo(
    () => (searchParams.get('designerInvite') ?? '').trim() || undefined,
    [searchParams],
  );
  const callbackUrl = useMemo(
    () => searchParams.get('callbackUrl'),
    [searchParams],
  );
  const prefillEmail = useMemo(
    () => (searchParams.get('prefillEmail') ?? '').trim().toLowerCase() || '',
    [searchParams],
  );
  const pdId = useId();
  const smsId = useId();

  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [completionToken, setCompletionToken] = useState<string | null>(null);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const turnstileRequired = isTurnstileRequired();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    if (channel === 'email' && prefillEmail) setEmail(prefillEmail);
  }, [channel, prefillEmail]);

  useEffect(() => {
    if (!designerInviteToken || channel !== 'phone') return;
    const q = new URLSearchParams();
    q.set('designerInvite', designerInviteToken);
    if (refFromUrl) q.set('ref', refFromUrl);
    if (prefillEmail) q.set('prefillEmail', prefillEmail);
    router.replace(`/register/email?${q.toString()}`);
  }, [designerInviteToken, channel, refFromUrl, prefillEmail, router]);

  const inviteEmailLocked = Boolean(designerInviteToken);
  const altRegisterHref = buildRegisterAltHref(channel === 'phone' ? 'email' : 'phone', {
    ref: refFromUrl,
    callbackUrl,
  });
  const altRegisterLabel = channel === 'phone' ? 'Регистрация по email' : 'Регистрация по номеру телефона';

  async function onStep1Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!consentPersonalData) {
      setFormError('Нужно согласие на обработку персональных данных');
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setFormError('Подтвердите, что вы не робот');
      return;
    }

    setBusy(true);
    try {
      if (channel === 'phone') {
        const fd = new FormData(e.currentTarget);
        const phoneRaw = String(fd.get('phone') ?? '');
        const pErr = validateE164Phone(phoneRaw);
        setPhoneError(pErr);
        if (pErr) return;
        const normalized = phoneRaw.trim();
        setPhone(normalized);
        await registerPhoneStart({
          phone: normalized,
          consentPersonalData: true,
          consentSms,
          turnstileToken,
        });
      } else {
        const emailRaw = email.trim() || String(new FormData(e.currentTarget).get('email') ?? '');
        const eErr = validateEmailRequired(emailRaw);
        setEmailError(eErr);
        if (eErr) return;
        const normalized = emailRaw.trim().toLowerCase();
        setEmail(normalized);
        await registerEmailStart({
          email: normalized,
          consentPersonalData: true,
          consentSms,
          turnstileToken,
        });
      }
      setStep(2);
      if (turnstileRequired) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось отправить код');
      if (turnstileRequired) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onStep2Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const otpFieldName = channel === 'phone' ? 'one-time-code' : 'email-registration-otp';
    const code = String(fd.get(otpFieldName) ?? '').replace(/\D/g, '');
    if (code.length !== 6) {
      setFormError('Введите 6 цифр кода');
      return;
    }
    setBusy(true);
    try {
      if (channel === 'phone') {
        const { completionToken: token } = await registerPhoneVerify({ phone, code });
        setCompletionToken(token);
      } else {
        const { completionToken: token } = await registerEmailVerify({ email, code });
        setCompletionToken(token);
      }
      setStep(3);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setFormError(null);
    if (turnstileRequired && !turnstileToken) {
      setFormError('Подтвердите, что вы не робот');
      return;
    }
    setBusy(true);
    try {
      if (channel === 'phone') {
        await registerPhoneStart({
          phone,
          consentPersonalData: true,
          consentSms,
          turnstileToken,
        });
      } else {
        await registerEmailStart({
          email,
          consentPersonalData: true,
          consentSms,
          turnstileToken,
        });
      }
      if (turnstileRequired) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось отправить код повторно');
      if (turnstileRequired) {
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onStep3Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!completionToken) {
      setFormError('Сессия регистрации устарела. Начните сначала.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('passwordConfirm') ?? '');
    const pErr = validatePassword(password);
    if (pErr) {
      setFormError(pErr);
      return;
    }
    if (password !== confirm) {
      setFormError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    try {
      const data = await registerComplete({
        completionToken,
        password,
        ...(refFromUrl && refFromUrl.length >= 3 ? { referralCode: refFromUrl } : {}),
        ...(designerInviteToken ? { designerInviteToken } : {}),
      });
      invalidateUserClientCaches({ authenticated: true });
      if (designerInviteToken) {
        router.replace(
          appendReferralWarningParam(buildDesignerInviteProfilePath(refFromUrl), data.referralWarning),
        );
      } else {
        const pending = data.user?.profile?.profileOnboardingPending;
        const target =
          pending === true || pending === undefined
            ? '/account/profile?tab=info&welcome=1'
            : sanitizeCallbackUrl(callbackUrl, '/account/orders');
        router.replace(appendReferralWarningParam(target, data.referralWarning));
      }
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось завершить регистрацию');
    } finally {
      setBusy(false);
    }
  }

  const subtitle = (
    <>
      Уже есть аккаунт?{' '}
      <Link href="/login" className={styles.authLinkAccent}>
        Войти
      </Link>
    </>
  );

  const backToStep1 = (
    <button type="button" className={styles.authBack} onClick={() => setStep(1)}>
      <img
        src="/icons/arrow-right.svg"
        alt=""
        width={12}
        height={7}
        className={styles.authBackArrow}
      />
      <span className={styles.authBackText}>Назад</span>
    </button>
  );

  const backToStep2 = (
    <button type="button" className={styles.authBack} onClick={() => setStep(2)}>
      <img
        src="/icons/arrow-right.svg"
        alt=""
        width={12}
        height={7}
        className={styles.authBackArrow}
      />
      <span className={styles.authBackText}>Назад</span>
    </button>
  );

  const backFromRegisterStart = (
    <button
      type="button"
      className={styles.authBack}
      onClick={() => {
        // /register редиректит на /register/email, поэтому обычный backHref не работает.
        // Если пользователь пришёл со страницы логина — вернём его туда через history.
        try {
          router.back();
        } catch {
          router.push('/login/email');
        }
      }}
    >
      <img
        src="/icons/arrow-right.svg"
        alt=""
        width={12}
        height={7}
        className={styles.authBackArrow}
      />
      <span className={styles.authBackText}>Назад</span>
    </button>
  );

  if (step === 1) {
    return (
      <AuthPageShell
        sectionAriaLabel={channel === 'phone' ? 'Регистрация по телефону' : 'Регистрация по email'}
        title="Регистрация"
        subtitle={subtitle}
        backSlot={backFromRegisterStart}
      >
        <form className={styles.authForm} noValidate onSubmit={onStep1Submit}>
          <div className={styles.authFields}>
            {channel === 'phone' ? (
              <PhoneField
                error={phoneError ?? undefined}
                onPhoneChange={() => {
                  setPhoneError(null);
                  setFormError(null);
                }}
              />
            ) : (
              <>
                {inviteEmailLocked ? (
                  <p className={styles.authOtpHint}>Регистрация только на адрес из приглашения.</p>
                ) : null}
                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  readOnly={inviteEmailLocked}
                  onChange={(ev) => {
                    if (inviteEmailLocked) return;
                    setEmail(ev.target.value);
                    setEmailError(null);
                    setFormError(null);
                  }}
                  error={emailError ?? undefined}
                />
              </>
            )}
            <div className={flowStyles.labelRow}>
              <AccountCheckbox
                id={pdId}
                name="consentPersonalData"
                className={flowStyles.checkboxForm}
                checked={consentPersonalData}
                onChange={(ev) => setConsentPersonalData(ev.target.checked)}
              />
              <label htmlFor={pdId} className={flowStyles.labelPd}>
                Согласие на обработку персональных данных (обязательно)
              </label>
            </div>
            <div className={flowStyles.labelRow}>
              <AccountCheckbox
                id={smsId}
                name="consentSms"
                className={flowStyles.checkboxForm}
                checked={consentSms}
                onChange={(ev) => setConsentSms(ev.target.checked)}
              />
              <label htmlFor={smsId} className={flowStyles.labelSms}>
                Согласен получать информационные SMS
              </label>
            </div>
            {turnstileRequired ? (
              <TurnstileWidget resetKey={turnstileResetKey} onToken={setTurnstileToken} />
            ) : null}
            {formError ? (
              <p className={flowStyles.formError} role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Отправка…' : 'Получить код'}
          </Button>
        </form>

        {!designerInviteToken ? (
          <Link href={altRegisterHref} className={styles.authAltMethod}>
            {altRegisterLabel}
          </Link>
        ) : null}
      </AuthPageShell>
    );
  }

  if (step === 2) {
    const otpHint =
      channel === 'phone' ? (
        <p className={styles.authOtpHint}>
          Мы отправили код в SMS на номер {phone}. Введите код из сообщения.
        </p>
      ) : (
        <p className={styles.authOtpHint}>
          Мы отправили код на {email}. Введите код из письма.
        </p>
      );

    return (
      <AuthPageShell
        sectionAriaLabel="Подтверждение регистрации"
        title="Подтверждение"
        subtitle={otpHint}
        backSlot={backToStep1}
      >
        <form className={styles.authForm} noValidate onSubmit={onStep2Submit}>
          <div className={styles.authFields}>
            <TextField
              key={`register-otp-${channel}-${email || phone}`}
              label={channel === 'phone' ? 'Код из SMS' : 'Код из письма'}
              type="text"
              name={channel === 'phone' ? 'one-time-code' : 'email-registration-otp'}
              inputMode="numeric"
              autoComplete={channel === 'phone' ? 'one-time-code' : 'off'}
              autoCorrect="off"
              spellCheck={false}
              placeholder="••••••"
              maxLength={6}
            />
            {formError ? (
              <p className={flowStyles.formError} role="alert">
                {formError}
              </p>
            ) : null}
            {turnstileRequired ? (
              <TurnstileWidget resetKey={turnstileResetKey} onToken={setTurnstileToken} />
            ) : null}
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Проверка…' : 'Подтвердить'}
          </Button>
        </form>
        <button
          type="button"
          className={styles.authAltMethod}
          onClick={resendCode}
          disabled={busy}
        >
          Отправить код повторно
        </button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      sectionAriaLabel="Пароль для нового аккаунта"
      title="Задайте пароль"
      subtitle={
        <p className={styles.authOtpHint}>После сохранения вы войдёте в личный кабинет.</p>
      }
      backSlot={backToStep2}
    >
      <form className={styles.authForm} noValidate onSubmit={onStep3Submit}>
        <div className={styles.authFields}>
          <TextField
            label="Пароль"
            type="password"
            name="password"
            autoComplete="new-password"
          />
          <TextField
            label="Повторите пароль"
            type="password"
            name="passwordConfirm"
            autoComplete="new-password"
          />
          {formError ? (
            <p className={flowStyles.formError} role="alert">
              {formError}
            </p>
          ) : null}
        </div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Сохранение…' : 'Завершить регистрацию'}
        </Button>
      </form>
    </AuthPageShell>
  );
}

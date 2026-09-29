'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import styles from '../profileSettings.module.css';
import { formatPhoneForInput, type SettingsMeUser } from './settingsTypes';

type Channel = 'email' | 'phone';

type Props = {
  channel: Channel;
  user: SettingsMeUser | null;
  onUserUpdated: (user: SettingsMeUser | null) => void;
  onVerified: (user: SettingsMeUser | null) => void;
  style?: React.CSSProperties;
};

type ChannelCopy = {
  ariaLabel: string;
  title: string;
  fieldLabel: string;
  fieldName: string;
  fieldType: string;
  autoComplete: string;
  codeLabel: string;
  codeName: string;
  verifyLabel: string;
  verifyBusyLabel: string;
  startPath: string;
  verifyPath: string;
  currentHelp: (hasCurrent: boolean) => string;
  alreadyBoundErr: string;
  invalidStartErr: string;
  pendingInfo: string;
  successInfo: string;
};

const EMAIL_COPY: ChannelCopy = {
  ariaLabel: 'Email',
  title: 'Email',
  fieldLabel: 'Email',
  fieldName: 'settings-email',
  fieldType: 'email',
  autoComplete: 'email',
  codeLabel: 'Код из письма',
  codeName: 'email-otp',
  verifyLabel: 'Подтвердить email',
  verifyBusyLabel: 'Проверка…',
  startPath: '/api/user/auth/account/contact/email/start',
  verifyPath: '/api/user/auth/account/contact/email/verify',
  currentHelp: (has) =>
    has
      ? ' — можно сменить: укажите новый email, получите код в письме и подтвердите. После смены вход по новому email и по телефону (если привязан) будет работать с тем же паролем.'
      : ' — укажите email, нажмите «Отправить код», введите код из письма. После привязки вход возможен и по email, и по телефону.',
  alreadyBoundErr: 'Этот email уже привязан',
  invalidStartErr: 'Введите корректный email',
  pendingInfo: 'Код отправлен на email. Введите его и нажмите «Подтвердить email».',
  successInfo: 'Email сохранён. Вход теперь доступен и по email, и по телефону (если оба указаны).',
};

const PHONE_COPY: ChannelCopy = {
  ariaLabel: 'Телефон',
  title: 'Телефон',
  fieldLabel: 'Телефон',
  fieldName: 'settings-phone',
  fieldType: 'tel',
  autoComplete: 'tel',
  codeLabel: 'Код из SMS',
  codeName: 'phone-otp',
  verifyLabel: 'Подтвердить телефон',
  verifyBusyLabel: 'Проверка…',
  startPath: '/api/user/auth/account/contact/phone/start',
  verifyPath: '/api/user/auth/account/contact/phone/verify',
  currentHelp: (has) =>
    has
      ? ' — смена по SMS-коду на новый номер. Пароль остаётся прежним; вход можно выполнять по email и по телефону.'
      : ' — привяжите телефон: «Отправить код», введите код из SMS, подтвердите.',
  alreadyBoundErr: 'Этот телефон уже привязан',
  invalidStartErr: 'Введите номер, не менее 10 цифр',
  pendingInfo: 'Код отправлен в SMS. Введите его и нажмите «Подтвердить телефон».',
  successInfo: 'Телефон сохранён. Вход по телефону и email будет работать, если оба привязаны.',
};

export function SettingsContactOtpSection({ channel, user, onUserUpdated, onVerified, style }: Props) {
  const c = channel === 'email' ? EMAIL_COPY : PHONE_COPY;
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (channel === 'email') setInput((user.email ?? '').trim());
    else setInput(formatPhoneForInput(user.phone));
  }, [user, channel]);

  const currentDisplay =
    channel === 'email'
      ? user?.email?.trim()
        ? user.email
        : 'не указан'
      : user?.phone?.trim()
        ? formatPhoneForInput(user.phone)
        : 'не указан';
  const hasCurrent =
    channel === 'email' ? Boolean(user?.email?.trim()) : Boolean(user?.phone?.trim());

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (channel === 'email') {
      if (!input.trim().includes('@')) {
        setErr(c.invalidStartErr);
        return;
      }
      if (user && (user.email ?? '').toLowerCase() === input.trim().toLowerCase()) {
        setErr(c.alreadyBoundErr);
        return;
      }
    } else {
      if (input.replace(/\D/g, '').length < 10) {
        setErr(c.invalidStartErr);
        return;
      }
      if (user?.phone && user.phone === input.replace(/\D/g, '')) {
        setErr(c.alreadyBoundErr);
        return;
      }
    }
    setBusy(true);
    try {
      const body =
        channel === 'email'
          ? { email: input.trim().toLowerCase() }
          : { phone: input };
      const res = await fetch(c.startPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setErr(await readApiErrorMessage(res));
        return;
      }
      setPending(true);
      setInfo(c.pendingInfo);
    } catch {
      setErr('Сеть или сервер недоступны');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setErr('Введите 6-значный код');
      return;
    }
    setBusy(true);
    try {
      const body =
        channel === 'email'
          ? { email: input.trim().toLowerCase(), code: digits }
          : { phone: input, code: digits };
      const res = await fetch(c.verifyPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        user?: SettingsMeUser;
        message?: string;
      };
      if (!res.ok) {
        setErr((await readApiErrorMessage(res)) || data.message || 'Ошибка');
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
        onVerified(data.user);
      } else {
        onVerified(null);
      }
      setCode('');
      setPending(false);
      setInfo(c.successInfo);
    } catch {
      setErr('Сеть или сервер недоступны');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.settingsSection} aria-label={c.ariaLabel} style={style}>
      <h2 className={styles.settingsBlockTitle}>{c.title}</h2>
      <p className={styles.settingsHelp}>
        Текущий: <strong>{currentDisplay}</strong>
        {c.currentHelp(hasCurrent)}
      </p>
      {info ? <p className={styles.settingsMuted}>{info}</p> : null}
      {err ? (
        <p className={styles.settingsInlineError} role="alert">
          {err}
        </p>
      ) : null}
      <form className={styles.settingsFields} onSubmit={(e) => void onStart(e)}>
        <TextField
          label={c.fieldLabel}
          type={c.fieldType}
          name={c.fieldName}
          autoComplete={c.autoComplete}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setErr(null);
          }}
        />
        <div className={styles.settingsActions}>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && !pending ? 'Отправка…' : 'Отправить код'}
          </Button>
        </div>
      </form>
      {pending ? (
        <form className={styles.settingsFields} onSubmit={(e) => void onVerify(e)} style={{ marginTop: 12 }}>
          <TextField
            label={c.codeLabel}
            name={c.codeName}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
              setErr(null);
            }}
            maxLength={6}
          />
          <div className={styles.settingsActions}>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? c.verifyBusyLabel : c.verifyLabel}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

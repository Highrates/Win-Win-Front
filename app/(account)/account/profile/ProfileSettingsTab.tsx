'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { resetUserSessionClientCache } from '@/lib/userSessionClient';
import styles from './page.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type MeUser = {
  id: string;
  email: string | null;
  phone: string | null;
  consentPersonalDataAcceptedAt: string | null;
  consentSmsMarketingAcceptedAt: string | null;
};

function formatPhoneForInput(raw: string | null | undefined): string {
  if (!raw || !String(raw).trim()) return '';
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}–${d.slice(7, 9)}–${d.slice(9, 11)}`;
  }
  if (d.length === 10) {
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}–${d.slice(6, 8)}–${d.slice(8, 10)}`;
  }
  return raw;
}

type Props = {
  onSessionChanged?: () => void;
};

export function ProfileSettingsTab({ onSessionChanged }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [emailInput, setEmailInput] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  const [phoneInput, setPhoneInput] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [phonePending, setPhonePending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [consentPersonal, setConsentPersonal] = useState(true);
  const [consentSms, setConsentSms] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentInfo, setConsentInfo] = useState<string | null>(null);
  const [consentErr, setConsentErr] = useState<string | null>(null);

  const [partnerVitrine, setPartnerVitrine] = useState<{
    winWinPartnerApproved?: boolean;
    designerSlug?: string | null;
    designerSiteVisible?: boolean;
  } | null>(null);
  const [designerSiteBusy, setDesignerSiteBusy] = useState(false);
  const [designerSiteErr, setDesignerSiteErr] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const closeDeleteModal = useCallback(() => setDeleteModalOpen(false), []);
  useModalBodyLock(deleteModalOpen, closeDeleteModal);

  const loadSession = useCallback(async () => {
    setLoadingUser(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/session', { cache: 'no-store', credentials: 'same-origin' });
      const data = (await res.json()) as { authenticated?: boolean; user?: MeUser; error?: string };
      if (!res.ok || !data.authenticated || !data.user) {
        setLoadError('Не удалось загрузить данные аккаунта');
        setUser(null);
        return;
      }
      const u = data.user;
      setUser(u);
      setEmailInput((u.email ?? '').trim());
      setPhoneInput(formatPhoneForInput(u.phone));
      setConsentPersonal(!!u.consentPersonalDataAcceptedAt);
      setConsentSms(!!u.consentSmsMarketingAcceptedAt);
    } catch {
      setLoadError('Не удалось загрузить данные аккаунта');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setDesignerSiteErr(null);
      try {
        const res = await fetch('/api/user/profile', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const p = (await res.json()) as {
          winWinPartnerApproved?: boolean;
          designerSlug?: string | null;
          designerSiteVisible?: boolean;
        };
        if (!cancelled) setPartnerVitrine(p);
      } catch {
        if (!cancelled) setPartnerVitrine(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
      resetUserSessionClientCache();
      router.push('/');
      router.refresh();
    } catch {
      /* cookie всё равно мог очиститься; ведём на главную */
      resetUserSessionClientCache();
      router.push('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  const afterAuthSuccess = useCallback(
    (nextUser: MeUser | null) => {
      resetUserSessionClientCache();
      if (nextUser) {
        setUser(nextUser);
        setEmailInput((nextUser.email ?? '').trim());
        setPhoneInput(formatPhoneForInput(nextUser.phone));
      }
      setEmailCode('');
      setPhoneCode('');
      setEmailPending(false);
      setPhonePending(false);
      onSessionChanged?.();
      router.refresh();
    },
    [onSessionChanged, router],
  );

  const onEmailStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr(null);
    setEmailInfo(null);
    const em = emailInput.trim().toLowerCase();
    if (!em.includes('@')) {
      setEmailErr('Введите корректный email');
      return;
    }
    if (user && (user.email ?? '').toLowerCase() === em) {
      setEmailErr('Этот email уже привязан');
      return;
    }
    setEmailBusy(true);
    try {
      const res = await fetch('/api/user/auth/account/contact/email/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: em }),
      });
      if (!res.ok) {
        setEmailErr(await readApiErrorMessage(res));
        return;
      }
      setEmailPending(true);
      setEmailInfo('Код отправлен на email. Введите его и нажмите «Подтвердить email».');
    } catch {
      setEmailErr('Сеть или сервер недоступны');
    } finally {
      setEmailBusy(false);
    }
  };

  const onEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr(null);
    const em = emailInput.trim().toLowerCase();
    const code = emailCode.replace(/\D/g, '');
    if (code.length !== 6) {
      setEmailErr('Введите 6-значный код');
      return;
    }
    setEmailBusy(true);
    try {
      const res = await fetch('/api/user/auth/account/contact/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: em, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; user?: MeUser; message?: string };
      if (!res.ok) {
        setEmailErr((await readApiErrorMessage(res)) || data.message || 'Ошибка');
        return;
      }
      if (data.user) {
        afterAuthSuccess(data.user as MeUser);
      } else {
        void loadSession();
        afterAuthSuccess(null);
      }
      setEmailInfo('Email сохранён. Вход теперь доступен и по email, и по телефону (если оба указаны).');
    } catch {
      setEmailErr('Сеть или сервер недоступны');
    } finally {
      setEmailBusy(false);
    }
  };

  const onPhoneStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneErr(null);
    setPhoneInfo(null);
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneErr('Введите номер, не менее 10 цифр');
      return;
    }
    if (user && user.phone && user.phone === digits) {
      setPhoneErr('Этот телефон уже привязан');
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await fetch('/api/user/auth/account/contact/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone: phoneInput }),
      });
      if (!res.ok) {
        setPhoneErr(await readApiErrorMessage(res));
        return;
      }
      setPhonePending(true);
      setPhoneInfo('Код отправлен в SMS. Введите его и нажмите «Подтвердить телефон».');
    } catch {
      setPhoneErr('Сеть или сервер недоступны');
    } finally {
      setPhoneBusy(false);
    }
  };

  const onPhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneErr(null);
    const code = phoneCode.replace(/\D/g, '');
    if (code.length !== 6) {
      setPhoneErr('Введите 6-значный код');
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await fetch('/api/user/auth/account/contact/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone: phoneInput, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; user?: MeUser };
      if (!res.ok) {
        setPhoneErr(await readApiErrorMessage(res));
        return;
      }
      if (data.user) {
        afterAuthSuccess(data.user as MeUser);
      } else {
        void loadSession();
        afterAuthSuccess(null);
      }
      setPhoneInfo('Телефон сохранён. Вход по телефону и email будет работать, если оба привязаны.');
    } catch {
      setPhoneErr('Сеть или сервер недоступны');
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword.trim()) {
      setPasswordError('Введите текущий пароль');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Новый пароль — не менее 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        setPasswordError(await readApiErrorMessage(res));
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Сеть или сервер недоступны');
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleSaveConsents = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsentInfo(null);
    setConsentErr(null);
    setConsentBusy(true);
    try {
      const res = await fetch('/api/user/consents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          consentPersonalData: consentPersonal,
          consentSmsMarketing: consentSms,
        }),
      });
      if (!res.ok) {
        setConsentErr(await readApiErrorMessage(res));
        return;
      }
      const j = (await res.json()) as { consentPersonalDataAcceptedAt?: string | null; consentSmsMarketingAcceptedAt?: string | null };
      setUser((u) =>
        u
          ? {
              ...u,
              consentPersonalDataAcceptedAt: j.consentPersonalDataAcceptedAt ?? (consentPersonal ? new Date().toISOString() : null),
              consentSmsMarketingAcceptedAt: j.consentSmsMarketingAcceptedAt ?? (consentSms ? new Date().toISOString() : null),
            }
          : u,
      );
      setConsentInfo('Сохранено');
    } catch {
      setConsentErr('Сеть или сервер недоступны');
    } finally {
      setConsentBusy(false);
    }
  };

  const onDesignerSiteVisibleChange = async (visible: boolean) => {
    setDesignerSiteErr(null);
    const prev = partnerVitrine;
    setPartnerVitrine((v) => (v ? { ...v, designerSiteVisible: visible } : v));
    setDesignerSiteBusy(true);
    try {
      const res = await fetch('/api/user/designer-site-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ visible }),
      });
      if (!res.ok) {
        if (prev) setPartnerVitrine(prev);
        setDesignerSiteErr(await readApiErrorMessage(res));
        return;
      }
      const p = (await res.json()) as {
        winWinPartnerApproved?: boolean;
        designerSlug?: string | null;
        designerSiteVisible?: boolean;
      };
      setPartnerVitrine((v) => ({
        winWinPartnerApproved:
          typeof p.winWinPartnerApproved === 'boolean' ? p.winWinPartnerApproved : Boolean(v?.winWinPartnerApproved),
        designerSlug: p.designerSlug ?? v?.designerSlug ?? null,
        designerSiteVisible: typeof p.designerSiteVisible === 'boolean' ? p.designerSiteVisible : Boolean(v?.designerSiteVisible),
      }));
      onSessionChanged?.();
      router.refresh();
    } catch {
      if (prev) setPartnerVitrine(prev);
      setDesignerSiteErr('Не удалось сохранить. Попробуйте позже.');
    } finally {
      setDesignerSiteBusy(false);
    }
  };

  if (loadingUser) {
    const sh = styles.skeletonShimmer;
    return (
      <div className={styles.settingsRoot} aria-busy aria-label="Загрузка настроек">
        <div className={styles.settingsLoadSections}>
          <div className={styles.settingsLoadSection}>
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '42%', height: 16 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '100%', height: 12 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '94%', height: 12 }} />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '28%', height: 16 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '72%', height: 12 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '100%', maxWidth: 400, height: 40, borderRadius: 10 }} />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '32%', height: 16 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '76%', height: 12 }} />
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '100%', maxWidth: 400, height: 40, borderRadius: 10 }} />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '24%', height: 16 }} />
            <div className={`${styles.skeletonBlock} ${sh}`} style={{ height: 140 }} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.settingsRoot} role="alert">
        <p className={styles.settingsInlineError}>{loadError}</p>
      </div>
    );
  }

  // Публикация в «Дизайнерах» — только одобренный партнёр (`GET /api/user/profile`).
  const isApprovedPartnerDesigner =
    partnerVitrine != null && partnerVitrine.winWinPartnerApproved === true;

  return (
    <>
      <div className={styles.settingsRoot} aria-label="Настройки аккаунта">
        {isApprovedPartnerDesigner ? (
          <section
            className={`${styles.settingsSection} ${styles.page_settingsSection}`}
            aria-label="Публикация профиля на сайте"
          >
            <h2 className={styles.settingsBlockTitle}>Публикация профиля на сайте</h2>
            <p className={styles.settingsHelp}>
              Включите, если хотите, чтобы ваш профиль отображался на сайте в разделе «Дизайнеры».
              {partnerVitrine.designerSlug ? (
                <>
                  {' '}
                  Публичный адрес: <strong>/designers/{partnerVitrine.designerSlug}</strong>.
                </>
              ) : null}
            </p>
            {designerSiteErr ? (
              <p className={styles.settingsInlineError} role="alert">
                {designerSiteErr}
              </p>
            ) : null}
            <label
              className={`${styles.settingsSwitchRow} ${styles.page_settingsSwitchRow}`}
            >
              <AccountCheckbox
                className={`${styles.settingsSwitchCheckbox} ${styles.page_settingsSwitchCheckbox}`}
                checked={Boolean(partnerVitrine.designerSiteVisible)}
                disabled={designerSiteBusy}
                onChange={(e) => {
                  void onDesignerSiteVisibleChange(e.target.checked);
                }}
                aria-label="Показывать страницу дизайнера на сайте"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>Опубликовать</span>
              </span>
            </label>
          </section>
        ) : null}

        <section className={styles.settingsSection} aria-label="Email">
          <h2 className={styles.settingsBlockTitle}>Email</h2>
          <p className={styles.settingsHelp}>
            Текущий: <strong>{user?.email?.trim() ? user.email : 'не указан'}</strong>
            {user?.email
              ? ' — можно сменить: укажите новый email, получите код в письме и подтвердите. После смены вход по новому email и по телефону (если привязан) будет работать с тем же паролем.'
              : ' — укажите email, нажмите «Отправить код», введите код из письма. После привязки вход возможен и по email, и по телефону.'}
          </p>
          {emailInfo ? <p className={styles.settingsMuted}>{emailInfo}</p> : null}
          {emailErr ? (
            <p className={styles.settingsInlineError} role="alert">
              {emailErr}
            </p>
          ) : null}
          <form className={styles.settingsFields} onSubmit={onEmailStart}>
            <TextField
              label="Email"
              type="email"
              name="settings-email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailErr(null);
              }}
            />
            <div className={styles.settingsActions}>
              <Button type="submit" variant="primary" disabled={emailBusy}>
                {emailBusy && !emailPending ? 'Отправка…' : 'Отправить код'}
              </Button>
            </div>
          </form>
          {emailPending ? (
            <form className={styles.settingsFields} onSubmit={onEmailVerify} style={{ marginTop: 12 }}>
              <TextField
                label="Код из письма"
                name="email-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={emailCode}
                onChange={(e) => {
                  setEmailCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
                  setEmailErr(null);
                }}
                maxLength={6}
              />
              <div className={styles.settingsActions}>
                <Button type="submit" variant="primary" disabled={emailBusy}>
                  {emailBusy ? 'Проверка…' : 'Подтвердить email'}
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <section className={styles.settingsSection} aria-label="Телефон" style={{ marginTop: 24 }}>
          <h2 className={styles.settingsBlockTitle}>Телефон</h2>
          <p className={styles.settingsHelp}>
            Текущий: <strong>{user?.phone?.trim() ? formatPhoneForInput(user.phone) : 'не указан'}</strong>
            {user?.phone
              ? ' — смена по SMS-коду на новый номер. Пароль остаётся прежним; вход сможно выполнять по email и по телефону.'
              : ' — привяжите телефон: «Отправить код», введите код из SMS, подтвердите.'}
          </p>
          {phoneInfo ? <p className={styles.settingsMuted}>{phoneInfo}</p> : null}
          {phoneErr ? (
            <p className={styles.settingsInlineError} role="alert">
              {phoneErr}
            </p>
          ) : null}
          <form className={styles.settingsFields} onSubmit={onPhoneStart}>
            <TextField
              label="Телефон"
              type="tel"
              name="settings-phone"
              autoComplete="tel"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setPhoneErr(null);
              }}
            />
            <div className={styles.settingsActions}>
              <Button type="submit" variant="primary" disabled={phoneBusy}>
                {phoneBusy && !phonePending ? 'Отправка…' : 'Отправить код'}
              </Button>
            </div>
          </form>
          {phonePending ? (
            <form className={styles.settingsFields} onSubmit={onPhoneVerify} style={{ marginTop: 12 }}>
              <TextField
                label="Код из SMS"
                name="phone-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={phoneCode}
                onChange={(e) => {
                  setPhoneCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
                  setPhoneErr(null);
                }}
                maxLength={6}
              />
              <div className={styles.settingsActions}>
                <Button type="submit" variant="primary" disabled={phoneBusy}>
                  {phoneBusy ? 'Проверка…' : 'Подтвердить телефон'}
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <form className={styles.settingsSection} onSubmit={handleChangePassword} style={{ marginTop: 24 }}>
          <h2 className={styles.settingsBlockTitle}>Пароль</h2>
          <div className={styles.settingsFields}>
            <TextField
              label="Текущий пароль"
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setPasswordError(null);
                setCurrentPassword(e.target.value);
              }}
            />
            <TextField
              label="Новый пароль"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setPasswordError(null);
                setNewPassword(e.target.value);
              }}
            />
            <TextField
              label="Повторите новый пароль"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setPasswordError(null);
                setConfirmPassword(e.target.value);
              }}
            />
          </div>
          {passwordError ? (
            <p className={styles.settingsInlineError} role="alert">
              {passwordError}
            </p>
          ) : null}
          <div className={styles.settingsActions}>
            <Button type="submit" variant="primary" disabled={passwordBusy}>
              {passwordBusy ? 'Сохранение…' : 'Сменить пароль'}
            </Button>
          </div>
        </form>

        <form className={styles.settingsSection} onSubmit={handleSaveConsents} style={{ marginTop: 8 }}>
          <div className={styles.settingsSwitches}>
            <h2 className={styles.settingsSwitchesTitle}>Согласия и уведомления</h2>
            <p className={styles.settingsHelp} style={{ marginTop: 0 }}>
              Согласия сопоставлены с данными в аккаунте. Отдельно от транзакционных SMS с кодом подтверждения.
            </p>
            {consentInfo ? <p className={styles.settingsMuted}>{consentInfo}</p> : null}
            {consentErr ? (
              <p className={styles.settingsInlineError} role="alert">
                {consentErr}
              </p>
            ) : null}
            <label className={styles.settingsSwitchRow}>
              <AccountCheckbox
                className={styles.settingsSwitchCheckbox}
                checked={consentPersonal}
                onChange={(e) => {
                  setConsentPersonal(e.target.checked);
                  setConsentErr(null);
                }}
                aria-label="Согласие на обработку персональных данных"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>Обработка персональных данных</span>
                <span className={styles.settingsSwitchDesc}>Необходимо для ведения аккаунта и исполнения договора (оферты)</span>
              </span>
            </label>
            <label className={styles.settingsSwitchRow}>
              <AccountCheckbox
                className={styles.settingsSwitchCheckbox}
                checked={consentSms}
                onChange={(e) => {
                  setConsentSms(e.target.checked);
                  setConsentErr(null);
                }}
                aria-label="Согласие на рекламные и сервисные SMS"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>SMS: новости и предложения</span>
                <span className={styles.settingsSwitchDesc}>
                  Неотложные SMS с кодом подтверждения могут приходить без этого согласия
                </span>
              </span>
            </label>
          </div>
          <div className={styles.settingsActions}>
            <Button type="submit" variant="primary" disabled={consentBusy}>
              {consentBusy ? 'Сохранение…' : 'Сохранить согласия'}
            </Button>
          </div>
        </form>

        <section
          className={`${styles.settingsSection} ${styles.settingsDangerZone}`}
          aria-label="Сессия и удаление аккаунта"
        >
          <Button
            type="button"
            variant="secondary"
            className={styles.settingsBtnSecondary}
            onClick={() => {
              void handleLogout();
            }}
            disabled={loggingOut}
          >
            {loggingOut ? 'Выход…' : 'Выйти из аккаунта'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={`${styles.settingsBtnSecondary} ${styles.settingsDeleteBtn}`}
            onClick={() => setDeleteModalOpen(true)}
          >
            Удалить аккаунт
          </Button>
        </section>
      </div>

      {deleteModalOpen ? (
        <>
          <button
            type="button"
            className={styles.settingsConfirmBackdrop}
            aria-label="Закрыть"
            onClick={closeDeleteModal}
          />
          <div
            className={styles.settingsConfirmPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-delete-title"
          >
            <header className={styles.settingsConfirmHeader}>
              <button type="button" className={styles.aboutModalIconBtn} onClick={closeDeleteModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </header>
            <div className={styles.settingsConfirmBody}>
              <h3 id="settings-delete-title" className={styles.settingsConfirmTitle}>
                Удалить аккаунт?
              </h3>
              <p className={styles.settingsConfirmText}>
                Мы отправим подтверждение на ваш email. До финального подтверждения вход останется доступен.
              </p>
              <div className={styles.settingsConfirmActions}>
                <Button type="button" variant="secondary" className={styles.settingsBtnSecondary} onClick={closeDeleteModal}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.settingsConfirmDanger}
                  onClick={() => {
                    closeDeleteModal();
                  }}
                >
                  Запросить удаление
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

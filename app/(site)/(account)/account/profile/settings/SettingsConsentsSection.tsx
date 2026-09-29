'use client';

import { useEffect, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { Button } from '@/components/Button';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import styles from '../profileSettings.module.css';
import type { SettingsMeUser } from './settingsTypes';

type Props = {
  user: SettingsMeUser | null;
  onUserUpdated: (user: SettingsMeUser) => void;
};

export function SettingsConsentsSection({ user, onUserUpdated }: Props) {
  const [consentPersonal, setConsentPersonal] = useState(true);
  const [consentSms, setConsentSms] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentInfo, setConsentInfo] = useState<string | null>(null);
  const [consentErr, setConsentErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setConsentPersonal(!!user.consentPersonalDataAcceptedAt);
    setConsentSms(!!user.consentSmsMarketingAcceptedAt);
  }, [user]);

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
      const j = (await res.json()) as {
        consentPersonalDataAcceptedAt?: string | null;
        consentSmsMarketingAcceptedAt?: string | null;
      };
      if (user) {
        onUserUpdated({
          ...user,
          consentPersonalDataAcceptedAt:
            j.consentPersonalDataAcceptedAt ?? (consentPersonal ? new Date().toISOString() : null),
          consentSmsMarketingAcceptedAt:
            j.consentSmsMarketingAcceptedAt ?? (consentSms ? new Date().toISOString() : null),
        });
      }
      setConsentInfo('Сохранено');
    } catch {
      setConsentErr('Сеть или сервер недоступны');
    } finally {
      setConsentBusy(false);
    }
  };

  return (
    <form className={styles.settingsSection} onSubmit={(e) => void handleSaveConsents(e)} style={{ marginTop: 8 }}>
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
            <span className={styles.settingsSwitchDesc}>
              Необходимо для ведения аккаунта и исполнения договора (оферты)
            </span>
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
  );
}

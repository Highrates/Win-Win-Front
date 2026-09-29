'use client';

import { useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import type { ProfileDto } from '../profileTypes';
import styles from '../profileSettings.module.css';

type Props = {
  profile: ProfileDto;
  onProfileUpdated: (patch: Partial<ProfileDto>) => void;
  onAfterSave?: () => void;
};

export function SettingsVitrineSection({ profile, onProfileUpdated, onAfterSave }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!profile.winWinPartnerApproved) return null;

  const onVisibleChange = async (visible: boolean) => {
    setErr(null);
    const prev = profile.designerSiteVisible;
    onProfileUpdated({ designerSiteVisible: visible });
    setBusy(true);
    try {
      const res = await fetch('/api/user/designer-site-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ visible }),
      });
      if (!res.ok) {
        onProfileUpdated({ designerSiteVisible: prev });
        setErr(await readApiErrorMessage(res));
        return;
      }
      const p = (await res.json()) as {
        designerSlug?: string | null;
        designerSiteVisible?: boolean;
      };
      onProfileUpdated({
        designerSlug: p.designerSlug ?? profile.designerSlug ?? null,
        designerSiteVisible:
          typeof p.designerSiteVisible === 'boolean' ? p.designerSiteVisible : visible,
      });
      onAfterSave?.();
    } catch {
      onProfileUpdated({ designerSiteVisible: prev });
      setErr('Не удалось сохранить. Попробуйте позже.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`${styles.settingsSection} ${styles.page_settingsSection}`}
      aria-label="Публикация профиля на сайте"
    >
      <h2 className={styles.settingsBlockTitle}>Публикация профиля на сайте</h2>
      <p className={styles.settingsHelp}>
        Включите, если хотите, чтобы ваш профиль отображался на сайте в разделе «Дизайнеры».
        {profile.designerSlug ? (
          <>
            {' '}
            Публичный адрес: <strong>/designers/{profile.designerSlug}</strong>.
          </>
        ) : null}
      </p>
      {err ? (
        <p className={styles.settingsInlineError} role="alert">
          {err}
        </p>
      ) : null}
      <label className={`${styles.settingsSwitchRow} ${styles.page_settingsSwitchRow}`}>
        <AccountCheckbox
          className={`${styles.settingsSwitchCheckbox} ${styles.page_settingsSwitchCheckbox}`}
          checked={Boolean(profile.designerSiteVisible)}
          disabled={busy}
          onChange={(e) => {
            void onVisibleChange(e.target.checked);
          }}
          aria-label="Показывать страницу дизайнера на сайте"
        />
        <span className={styles.settingsSwitchText}>
          <span className={styles.settingsSwitchLabel}>Опубликовать</span>
        </span>
      </label>
    </section>
  );
}

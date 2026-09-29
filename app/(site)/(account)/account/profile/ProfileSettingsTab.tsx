'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileDto } from '@/app/(site)/(account)/account/profile/profileTypes';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { resetUserSessionClientCache } from '@/lib/userSessionClient';
import loadStyles from './profileLoading.module.css';
import styles from './profileSettings.module.css';
import { SettingsConsentsSection } from './settings/SettingsConsentsSection';
import { SettingsContactOtpSection } from './settings/SettingsContactOtpSection';
import { SettingsPasswordSection } from './settings/SettingsPasswordSection';
import { SettingsSessionSection } from './settings/SettingsSessionSection';
import { SettingsVitrineSection } from './settings/SettingsVitrineSection';
import type { SettingsMeUser } from './settings/settingsTypes';

type Props = {
  /** Уже загруженный профиль с страницы (без повторного GET /api/user/profile). */
  profile: ProfileDto | null;
  onProfilePatch: (patch: Partial<ProfileDto>) => void;
  onSessionChanged?: () => void;
};

export function ProfileSettingsTab({ profile, onProfilePatch, onSessionChanged }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<SettingsMeUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const loadSession = useCallback(async () => {
    setLoadingUser(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/session', { cache: 'no-store', credentials: 'same-origin' });
      const data = (await res.json()) as { authenticated?: boolean; user?: SettingsMeUser; error?: string };
      if (!res.ok || !data.authenticated || !data.user) {
        setLoadError('Не удалось загрузить данные аккаунта');
        setUser(null);
        return;
      }
      setUser(data.user);
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

  const afterAuthSuccess = useCallback(
    (nextUser: SettingsMeUser | null) => {
      resetUserSessionClientCache();
      if (nextUser) setUser(nextUser);
      else void loadSession();
      onSessionChanged?.();
      router.refresh();
    },
    [loadSession, onSessionChanged, router],
  );

  if (loadingUser) {
    const sh = loadStyles.skeletonShimmer;
    return (
      <div className={styles.settingsRoot} aria-busy aria-label="Загрузка настроек">
        <div className={styles.settingsLoadSections}>
          <div className={styles.settingsLoadSection}>
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '42%', height: 16 }} />
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '100%', height: 12 }} />
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '94%', height: 12 }} />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '28%', height: 16 }} />
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '72%', height: 12 }} />
            <div
              className={`${loadStyles.skeletonLine} ${sh}`}
              style={{ width: '100%', maxWidth: 400, height: 40, borderRadius: 10 }}
            />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '32%', height: 16 }} />
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '76%', height: 12 }} />
            <div
              className={`${loadStyles.skeletonLine} ${sh}`}
              style={{ width: '100%', maxWidth: 400, height: 40, borderRadius: 10 }}
            />
          </div>
          <div className={styles.settingsLoadSection}>
            <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '24%', height: 16 }} />
            <div className={`${loadStyles.skeletonBlock} ${sh}`} style={{ height: 140 }} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.settingsRoot}>
        <AccountErrorState message={loadError} onRetry={() => void loadSession()} />
      </div>
    );
  }

  return (
    <div className={styles.settingsRoot} aria-label="Настройки аккаунта">
      {profile ? (
        <SettingsVitrineSection
          profile={profile}
          onProfileUpdated={onProfilePatch}
          onAfterSave={() => {
            onSessionChanged?.();
            router.refresh();
          }}
        />
      ) : null}

      <SettingsContactOtpSection
        channel="email"
        user={user}
        onUserUpdated={setUser}
        onVerified={afterAuthSuccess}
      />
      <SettingsContactOtpSection
        channel="phone"
        user={user}
        onUserUpdated={setUser}
        onVerified={afterAuthSuccess}
        style={{ marginTop: 24 }}
      />
      <SettingsPasswordSection />
      <SettingsConsentsSection user={user} onUserUpdated={setUser} />
      <SettingsSessionSection />
    </div>
  );
}

'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { InviteDesignerModal } from '@/components/InviteDesignerModal/InviteDesignerModal';
import { PartnerApplicationModal } from '@/components/PartnerApplicationModal/PartnerApplicationModal';
import { useAccountProfile } from '@/hooks/useAccountProfile';
import { useActiveDesignerInvites, dispatchDesignerInvitesChanged } from '@/hooks/useActiveDesignerInvites';
import { ProfileAboutModal } from './ProfileAboutModal';
import { ProfileEditModal } from './ProfileEditModal';
import { ProfileIncomeTab } from './ProfileIncomeTab';
import { ProfileInfoTab } from './ProfileInfoTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import type { ProfileDto } from './profileTypes';
import { useProfileDeepLinks, type ProfileTabKey } from './useProfileDeepLinks';
import loadStyles from './profileLoading.module.css';
import styles from './page.module.css';

function ProfilePageLoading() {
  const sh = loadStyles.skeletonShimmer;
  return (
    <div className={loadStyles.profileLoadRoot} aria-busy="true" aria-label="Загрузка профиля">
      <div className={loadStyles.profileLoadHeader}>
        <div className={`${loadStyles.skeletonAvatar} ${sh}`} />
        <div className={loadStyles.profileLoadTextCol}>
          <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '36%' }} />
          <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '58%', height: 28, marginTop: 6 }} />
          <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: '48%', marginTop: 8 }} />
        </div>
        <div className={`${loadStyles.skeletonIcon} ${sh}`} />
      </div>
      <div className={loadStyles.profileLoadImages}>
        <div className={`${loadStyles.skeletonRect} ${sh}`} />
        <div className={`${loadStyles.skeletonRect} ${sh}`} />
      </div>
      <div className={loadStyles.profileLoadAbout}>
        <div className={`${loadStyles.skeletonLine} ${sh}`} style={{ width: 200, height: 22, marginTop: 8 }} />
        <div className={`${loadStyles.skeletonBlock} ${sh}`} />
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const { profile, setProfile: setProfileState, loadProfile, loading, loadError, patchProfile } =
    useAccountProfile();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [partnerAppModalOpen, setPartnerAppModalOpen] = useState(false);
  const [partnerAppPrefillRef, setPartnerAppPrefillRef] = useState<string | undefined>(undefined);
  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const [selectedTabKey, setSelectedTabKey] = useState<ProfileTabKey>('info');

  const winWinPartnerApproved = Boolean(profile?.winWinPartnerApproved);
  const designerBonusPercent = profile?.designerOwnCatalogBonusPercent ?? 0;
  const { items: activeInvites, reload: reloadActiveInvites } = useActiveDesignerInvites(
    winWinPartnerApproved && !loading,
  );
  const showIncomeTab = winWinPartnerApproved || designerBonusPercent > 0;
  const availableTabKeys = useMemo<readonly ProfileTabKey[]>(
    () => (showIncomeTab ? (['info', 'income', 'settings'] as const) : (['info', 'settings'] as const)),
    [showIncomeTab],
  );
  const availableTabLabels = useMemo(
    () =>
      availableTabKeys.map((k) => {
        if (k === 'info') return 'Инфо';
        if (k === 'income') return 'Доход';
        return 'Настройки';
      }),
    [availableTabKeys],
  );

  const selectTab = useCallback((key: ProfileTabKey) => {
    setSelectedTabKey(key);
  }, []);

  const applyProfileDto = useCallback(
    (p: ProfileDto) => {
      setProfileState(p);
    },
    [setProfileState],
  );

  const openProfileEdit = useCallback(() => setProfileModalOpen(true), []);
  const openInviteDesigner = useCallback(() => setInviteDesignerModalOpen(true), []);
  const openPartnerApply = useCallback((prefill?: string) => {
    setPartnerAppPrefillRef(prefill);
    setPartnerAppModalOpen(true);
  }, []);

  const { referralWarningBanner, searchParams, pathname, router } = useProfileDeepLinks({
    loading,
    profile,
    availableTabKeys,
    selectTab,
    openProfileEdit,
    openInviteDesigner,
    openPartnerApply,
  });

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const selectedIndex = Math.max(0, availableTabKeys.indexOf(selectedTabKey));
  const activeTabKey: ProfileTabKey = availableTabKeys[selectedIndex] ?? 'info';

  const writeTabToUrl = useCallback(
    (index: number) => {
      const key = availableTabKeys[index] ?? 'info';
      setSelectedTabKey(key);
      const next = new URLSearchParams(searchParams.toString());
      if (key === 'info') next.delete('tab');
      else next.set('tab', key);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [availableTabKeys, pathname, router, searchParams],
  );

  const aboutHtml = profile?.aboutHtml ?? '';
  const profileEmail = (profile?.email && String(profile.email).trim()) || '';
  const referralInviteExempt = Boolean(profile?.referralInviteCodeExempt);
  const myWinWinReferral = profile?.winWinReferralCode?.trim() || null;

  return (
    <section className={styles.page} aria-label="Профиль">
      {loadError ? (
        <AccountErrorState message={loadError} onRetry={() => void loadProfile()} />
      ) : null}
      {referralWarningBanner ? (
        <p className={styles.partnerReferralExemptNote} role="status">
          {referralWarningBanner}
        </p>
      ) : null}

      <AccountProjectTabs
        projects={availableTabLabels}
        selectedIndex={selectedIndex}
        onSelect={writeTabToUrl}
        ariaLabel="Разделы профиля"
      />

      {loading || !profile ? (
        <ProfilePageLoading />
      ) : activeTabKey === 'info' ? (
        <ProfileInfoTab
          profile={profile}
          activeInvites={activeInvites}
          onOpenProfileEdit={openProfileEdit}
          onOpenAboutEdit={() => setAboutModalOpen(true)}
          onOpenPartnerApply={() => openPartnerApply(undefined)}
          onOpenSettings={() => writeTabToUrl(availableTabKeys.indexOf('settings'))}
        />
      ) : activeTabKey === 'income' ? (
        <section aria-label="Доход">
          <ProfileIncomeTab />
        </section>
      ) : (
        <ProfileSettingsTab
          profile={profile}
          onProfilePatch={(patch) => {
            setProfileState((prev) => (prev ? { ...prev, ...patch } : prev));
          }}
          onSessionChanged={() => {
            void loadProfile();
          }}
        />
      )}

      <ProfileEditModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        aboutHtmlForSave={aboutHtml}
        onSuccess={applyProfileDto}
        patchProfile={patchProfile}
      />

      <ProfileAboutModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        initialAboutHtml={aboutHtml}
        onSuccess={applyProfileDto}
        patchProfile={patchProfile}
      />

      <PartnerApplicationModal
        open={partnerAppModalOpen}
        onClose={() => setPartnerAppModalOpen(false)}
        onSuccess={applyProfileDto}
        referralInviteExempt={referralInviteExempt}
        storedReferralCode={profile?.partnerApplicationReferralCode?.trim() || null}
        profileEmail={profileEmail}
        prefillReferralCode={partnerAppPrefillRef}
        onOpenSettings={() => writeTabToUrl(availableTabKeys.indexOf('settings'))}
      />

      <InviteDesignerModal
        open={inviteDesignerModalOpen}
        onClose={() => setInviteDesignerModalOpen(false)}
        referralCode={myWinWinReferral}
        onSent={() => {
          dispatchDesignerInvitesChanged();
          void reloadActiveInvites();
        }}
      />
    </section>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}

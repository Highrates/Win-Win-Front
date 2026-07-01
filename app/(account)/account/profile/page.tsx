'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { InviteDesignerModal } from '@/components/InviteDesignerModal/InviteDesignerModal';
import { ActiveDesignerInvites } from '@/components/ActiveDesignerInvites/ActiveDesignerInvites';
import { PartnerApplicationModal } from '@/components/PartnerApplicationModal/PartnerApplicationModal';
import btnStyles from '@/components/Button/Button.module.css';
import { useAccountProfile } from '@/hooks/useAccountProfile';
import { useActiveDesignerInvites } from '@/hooks/useActiveDesignerInvites';
import { ProfileAboutModal } from './ProfileAboutModal';
import { ProfileEditModal } from './ProfileEditModal';
import { ProfileIncomeTab } from './ProfileIncomeTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import { displayName, parseStringArray } from './profileFormUtils';
import type { ProfileDto } from './profileTypes';
import styles from './page.module.css';

function ProfilePageLoading() {
  const sh = styles.skeletonShimmer;
  return (
    <div className={styles.profileLoadRoot} aria-busy="true" aria-label="Загрузка профиля">
      <div className={styles.profileLoadHeader}>
        <div className={`${styles.skeletonAvatar} ${sh}`} />
        <div className={styles.profileLoadTextCol}>
          <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '36%' }} />
          <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '58%', height: 28, marginTop: 6 }} />
          <div className={`${styles.skeletonLine} ${sh}`} style={{ width: '48%', marginTop: 8 }} />
        </div>
        <div className={`${styles.skeletonIcon} ${sh}`} />
      </div>
      <div className={styles.profileLoadImages}>
        <div className={`${styles.skeletonRect} ${sh}`} />
        <div className={`${styles.skeletonRect} ${sh}`} />
      </div>
      <div className={styles.profileLoadAbout}>
        <div className={`${styles.skeletonLine} ${sh}`} style={{ width: 200, height: 22, marginTop: 8 }} />
        <div className={`${styles.skeletonBlock} ${sh}`} />
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { profile, setProfile: setProfileState, loadProfile, loading, loadError, patchProfile } =
    useAccountProfile();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [partnerAppModalOpen, setPartnerAppModalOpen] = useState(false);
  const [partnerAppPrefillRef, setPartnerAppPrefillRef] = useState<string | undefined>(undefined);
  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const [referralWarningBanner, setReferralWarningBanner] = useState<string | null>(null);

  type ProfileTabKey = 'info' | 'income' | 'settings';
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
  const selectedTabKey: ProfileTabKey = availableTabKeys[selectedIndex] ?? 'info';
  const selectTab = useCallback(
    (key: ProfileTabKey) => {
      const idx = availableTabKeys.indexOf(key);
      setSelectedIndex(idx >= 0 ? idx : 0);
    },
    [availableTabKeys],
  );

  const applyProfileDto = useCallback(
    (p: ProfileDto) => {
      setProfileState(p);
    },
    [setProfileState],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const warn = searchParams.get('referralWarning')?.trim();
    if (!warn) return;
    setReferralWarningBanner(warn);
    const next = new URLSearchParams(searchParams.toString());
    next.delete('referralWarning');
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const key: ProfileTabKey = tab === 'income' ? 'income' : tab === 'settings' ? 'settings' : 'info';
    selectTab(key);
  }, [searchParams, selectTab]);

  useEffect(() => {
    const welcome = searchParams.get('welcome') === '1';
    if (!welcome) return;
    selectTab('info');
    void (async () => {
      try {
        await fetch('/api/user/profile/onboarding/ack', { method: 'PATCH', credentials: 'same-origin' });
      } catch {
        /* ignore */
      } finally {
        router.replace(pathname, { scroll: false });
      }
    })();
  }, [pathname, router, searchParams, selectTab]);

  useEffect(() => {
    if (searchParams.get('profileEdit') !== '1') return;
    setProfileModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get('inviteDesigner') !== '1') return;
    if (loading) return;
    if (!profile?.winWinPartnerApproved) {
      router.replace(pathname, { scroll: false });
      return;
    }
    setInviteDesignerModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [loading, profile?.winWinPartnerApproved, pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get('partnerApply') !== '1') return;
    if (loading) return;
    if (!profile) return;
    const prefill =
      searchParams.get('prefillRef')?.trim() ||
      profile.partnerApplicationReferralCode?.trim() ||
      '';
    const pending =
      Boolean(profile.partnerApplicationSubmittedAt) &&
      !profile.winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt;
    if (pending || profile.winWinPartnerApproved) {
      router.replace(pathname, { scroll: false });
      return;
    }
    selectTab('info');
    setPartnerAppPrefillRef(prefill || undefined);
    setPartnerAppModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [loading, profile, pathname, router, searchParams, selectTab]);

  const avatarSrc = profile?.avatarUrl?.trim() || '/images/placeholder.svg';
  const cityLine = profile?.city?.trim() || 'Город: Не указан';
  const services = parseStringArray(profile?.services);
  const servicesLine = services.length > 0 ? services.join(', ') : 'Услуги: Не указаны';
  const aboutHtml = profile?.aboutHtml ?? '';
  const hasAbout = !!aboutHtml.trim();
  const coverUrlsForPreview = parseStringArray(profile?.coverImageUrls);
  const showPreviewImages = coverUrlsForPreview.length > 0;
  const isSinglePreviewImageWide = coverUrlsForPreview.length === 1;

  const partnerApplicationPending = Boolean(
    profile?.partnerApplicationSubmittedAt &&
      !winWinPartnerApproved &&
      !profile?.partnerApplicationRejectedAt,
  );
  const partnerApplicationRejected = Boolean(
    profile?.partnerApplicationSubmittedAt &&
      profile?.partnerApplicationRejectedAt &&
      !winWinPartnerApproved,
  );
  const profileEmail = (profile?.email && String(profile.email).trim()) || '';
  const referralInviteExempt = Boolean(profile?.referralInviteCodeExempt);
  const myWinWinReferral = profile?.winWinReferralCode?.trim() || null;

  return (
    <section className={styles.page} aria-label="Профиль">
      {loadError ? (
        <p className={flowStyles.formError} role="alert">
          {loadError}
        </p>
      ) : null}
      {referralWarningBanner ? (
        <p className={styles.partnerReferralExemptNote} role="status">
          {referralWarningBanner}
        </p>
      ) : null}

      <AccountProjectTabs
        projects={availableTabLabels}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        ariaLabel="Разделы профиля"
      />

      {loading ? (
        <ProfilePageLoading />
      ) : selectedTabKey === 'info' ? (
        <>
          <div className={styles.previewPageTitlesOuter}>
            <div className={styles.previewPageTitlesRow}>
              <img src={avatarSrc} alt="" className={styles.profileAvatar} width={82} height={82} />
              <div className={styles.profileTitlesCol}>
                <span className={styles.profileCity}>{cityLine}</span>
                <div className={styles.profileNameRow}>
                  <h1 className={styles.profileName}>
                    {displayName(profile?.firstName ?? null, profile?.lastName ?? null)}
                  </h1>
                  <button
                    type="button"
                    className={styles.editButton}
                    aria-label="Редактировать профиль"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
                  </button>
                </div>
                <span className={styles.profileServices}>{servicesLine}</span>
              </div>
              <div className={styles.previewPageTitlesActions}>
                {winWinPartnerApproved ? (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${styles.profilePartnerCta}`}
                    onClick={() => setInviteDesignerModalOpen(true)}
                  >
                    Пригласить дизайнера
                  </button>
                ) : partnerApplicationPending ? (
                  <span className={styles.profileApplicationPendingLabel}>Заявка на рассмотрении</span>
                ) : partnerApplicationRejected ? (
                  <span className={styles.profileApplicationRejectedLabel}>Заявка отклонена</span>
                ) : (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnPrimary} ${styles.profilePartnerCta}`}
                    onClick={() => {
                      setPartnerAppPrefillRef(undefined);
                      setPartnerAppModalOpen(true);
                    }}
                  >
                    Стать партнером Win-Win
                  </button>
                )}
              </div>
            </div>

            <div className={styles.interactWrapper}>
              <Button
                type="button"
                variant="secondary"
                iconLeft="/icons/message.svg"
                className={styles.requestsBtn}
                aria-label="Запросы"
              >
                Запросы
              </Button>
              <div className={styles.interactItem}>
                <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.interactIcon} />
                <span>{Math.max(0, profile?.designerCasesCount ?? 0)}</span>
              </div>
              <div className={styles.interactItem}>
                <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
                <span>{Math.max(0, profile?.designerLikesUserCount ?? 0)}</span>
              </div>
            </div>
          </div>

          {winWinPartnerApproved ? <ActiveDesignerInvites items={activeInvites} /> : null}

          {showPreviewImages ? (
            <div className={styles.previewImages}>
              {coverUrlsForPreview.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className={`${styles.previewImageSlot} ${
                    isSinglePreviewImageWide && i === 0 ? styles.previewImageSlotDouble : ''
                  }`}
                >
                  <img src={url} alt="" className={styles.previewImage} />
                </div>
              ))}
            </div>
          ) : null}

          <section
            className={`${styles.aboutSection} ${!hasAbout ? styles.aboutSectionHeaderOnly : ''}`}
            aria-label="Подробнее о вас"
          >
            <div className={styles.aboutHeaderRow}>
              <h2 className={styles.aboutTitle}>Подробнее о вас</h2>
              <button
                type="button"
                className={styles.aboutEditButton}
                aria-label="Редактировать раздел подробнее о вас"
                onClick={() => setAboutModalOpen(true)}
              >
                <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
              </button>
            </div>

            {hasAbout ? (
              <div
                className={`rich-content ${styles.aboutRichContent}`}
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            ) : null}
          </section>
        </>
      ) : selectedTabKey === 'income' ? (
        <section aria-label="Доход">
          <ProfileIncomeTab />
        </section>
      ) : (
        <ProfileSettingsTab
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
        onOpenSettings={() => selectTab('settings')}
      />

      <InviteDesignerModal
        open={inviteDesignerModalOpen}
        onClose={() => setInviteDesignerModalOpen(false)}
        referralCode={myWinWinReferral}
        onSent={() => void reloadActiveInvites()}
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

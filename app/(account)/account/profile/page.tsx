'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { MultiSelectField } from '@/components/MultiSelectField';
import { CoverGridField } from '@/components/CoverGridField';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { ProfileIncomeTab } from './ProfileIncomeTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import btnStyles from '@/components/Button/Button.module.css';
import styles from './page.module.css';

import { useAccountProfile } from '@/hooks/useAccountProfile';
import { useInviteDesigner } from '@/hooks/useInviteDesigner';
import { usePartnerApplication } from '@/hooks/usePartnerApplication';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import type { ProfileDto } from './profileTypes';

const PROFILE_TAB_INFO = 0;
const PROFILE_TAB_INCOME = 1;
const PROFILE_TAB_SETTINGS = 2;

type CoverGrid = '4:3' | '16:9';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.75 9.25V3.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.25 12.75V18.25H12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66678 4.66665L9.55566 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4441 12.4444L17.333 17.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.25 18.25V12.75H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 3.75V9.25H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.333 17.3333L12.4444 12.4444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66699 4.66665L9.55588 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function displayName(firstName: string | null, lastName: string | null): string {
  const t = [firstName, lastName].filter((x) => x && x.trim()).join(' ').trim();
  return t || 'Имя пользователя';
}

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

  const {
    profile,
    setProfile: setProfileState,
    loadProfile,
    loading,
    loadError,
    patchProfile,
    saving,
    setSaving,
    saveError,
    setSaveError,
  } = useAccountProfile();
  const { postMultipart } = useProfileUploads();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutModalFullscreen, setAboutModalFullscreen] = useState(false);

  const [partnerAppModalOpen, setPartnerAppModalOpen] = useState(false);
  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('/images/placeholder.svg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [city, setCity] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [aboutRichValue, setAboutRichValue] = useState('');
  const [aboutRichDraft, setAboutRichDraft] = useState('');

  const [coverGrid, setCoverGrid] = useState<CoverGrid>('4:3');
  const [cover43a, setCover43a] = useState<File | null>(null);
  const [cover43b, setCover43b] = useState<File | null>(null);
  const [cover169, setCover169] = useState<File | null>(null);
  const [cover43aPreview, setCover43aPreview] = useState<string | null>(null);
  const [cover43bPreview, setCover43bPreview] = useState<string | null>(null);
  const [cover169Preview, setCover169Preview] = useState<string | null>(null);
  const [remoteCoverA, setRemoteCoverA] = useState<string | null>(null);
  const [remoteCoverB, setRemoteCoverB] = useState<string | null>(null);
  const [remoteCover169, setRemoteCover169] = useState<string | null>(null);

  const [aboutSaveError, setAboutSaveError] = useState<string | null>(null);
  const [aboutSaving, setAboutSaving] = useState(false);
  const DEFAULT_SERVICE_OPTIONS = [
    'Дизайн интерьера',
    'Комплектация',
    'Авторский надзор',
    'Планировка',
  ] as const;
  const [serviceOptions, setServiceOptions] = useState<string[]>([...DEFAULT_SERVICE_OPTIONS]);
  const CITY_OPTIONS = ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи'] as const;

  const avatarPreviewRef = useRef(avatarPreview);
  const coverPreviewsRef = useRef({ cover43aPreview, cover43bPreview, cover169Preview });
  avatarPreviewRef.current = avatarPreview;
  coverPreviewsRef.current = { cover43aPreview, cover43bPreview, cover169Preview };

  const closeProfileModal = useCallback(() => {
    setProfileModalOpen(false);
    setCityOpen(false);
    setServicesOpen(false);
    setSaveError(null);
  }, []);

  const closeAboutModal = useCallback(() => {
    setAboutModalOpen(false);
    setAboutModalFullscreen(false);
    setAboutSaveError(null);
  }, []);

  type ProfileTabKey = 'info' | 'income' | 'settings';
  const winWinPartnerApproved = Boolean(profile?.winWinPartnerApproved);
  const availableTabKeys = useMemo<readonly ProfileTabKey[]>(
    () => (winWinPartnerApproved ? (['info', 'income', 'settings'] as const) : (['info', 'settings'] as const)),
    [winWinPartnerApproved],
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

  const syncFormsFromDto = useCallback((p: ProfileDto) => {
    setFirstName(p.firstName ?? '');
    setLastName(p.lastName ?? '');
    setCity(p.city ?? '');
    setServices(parseStringArray(p.services));
    const about = p.aboutHtml ?? '';
    setAboutRichValue(about);
    setAboutRichDraft(about);

    const av = p.avatarUrl?.trim() ? p.avatarUrl.trim() : '/images/placeholder.svg';
    setAvatarPreview(av);
    setAvatarFile(null);

    const layout = (p.coverLayout === '16:9' ? '16:9' : '4:3') as CoverGrid;
    setCoverGrid(layout);
    const urls = parseStringArray(p.coverImageUrls);
    setCover43a(null);
    setCover43b(null);
    setCover169(null);
    if (layout === '16:9') {
      const u0 = urls[0] ?? null;
      setRemoteCover169(u0);
      setRemoteCoverA(null);
      setRemoteCoverB(null);
      setCover169Preview(u0);
      setCover43aPreview(null);
      setCover43bPreview(null);
    } else {
      const a = urls[0] ?? null;
      const b = urls[1] ?? null;
      setRemoteCoverA(a);
      setRemoteCoverB(b);
      setRemoteCover169(null);
      setCover43aPreview(a);
      setCover43bPreview(b);
      setCover169Preview(null);
    }
  }, []);

  const applyProfileDto = useCallback(
    (p: ProfileDto) => {
      setProfileState(p);
      syncFormsFromDto(p);
    },
    [setProfileState, syncFormsFromDto],
  );

  const partnerApp = usePartnerApplication(applyProfileDto);
  const inviteDesigner = useInviteDesigner();

  const copyDesignerInviteLink = useCallback(async () => {
    if (!inviteDesigner.inviteLink) return;
    try {
      await copyTextToClipboard(inviteDesigner.inviteLink);
      inviteDesigner.setCopied(true);
      window.setTimeout(() => inviteDesigner.setCopied(false), 3000);
    } catch {
      inviteDesigner.setCopied(false);
    }
  }, [inviteDesigner.inviteLink, inviteDesigner]);

  const closePartnerAppModal = useCallback(() => {
    setPartnerAppModalOpen(false);
    partnerApp.reset();
  }, [partnerApp]);

  const closeInviteDesignerModal = useCallback(() => {
    setInviteDesignerModalOpen(false);
    inviteDesigner.reset();
  }, [inviteDesigner]);

  useModalBodyLock(profileModalOpen, closeProfileModal);
  useModalBodyLock(aboutModalOpen, closeAboutModal);
  useModalBodyLock(partnerAppModalOpen, closePartnerAppModal);
  useModalBodyLock(inviteDesignerModalOpen, closeInviteDesignerModal);

  useEffect(() => {
    void (async () => {
      const data = await loadProfile();
      if (data) syncFormsFromDto(data);
    })();
  }, [loadProfile, syncFormsFromDto]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/public/site-settings', { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as { designerServiceOptions?: unknown };
        if (!Array.isArray(j.designerServiceOptions) || j.designerServiceOptions.length === 0) {
          return;
        }
        const next = j.designerServiceOptions.filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0,
        );
        if (next.length) {
          setServiceOptions(next);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!profileModalOpen || !profile) return;
    applyProfileDto(profile);
  }, [profileModalOpen, profile, applyProfileDto]);

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
    const shouldOpen = searchParams.get('profileEdit') === '1';
    if (!shouldOpen) return;
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
    inviteDesigner.reset();
    setInviteDesignerModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [loading, profile?.winWinPartnerApproved, pathname, router, searchParams, inviteDesigner]);

  useEffect(() => {
    if (searchParams.get('partnerApply') !== '1') return;
    if (loading) return;
    if (!profile) return;
    const prefill = searchParams.get('prefillRef')?.trim();
    partnerApp.reset();
    if (prefill) partnerApp.setReferralCode(prefill);
    const pending =
      Boolean(profile.partnerApplicationSubmittedAt) &&
      !profile.winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt;
    if (pending || profile.winWinPartnerApproved) {
      router.replace(pathname, { scroll: false });
      return;
    }
    selectTab('info');
    setPartnerAppModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [loading, profile, pathname, router, searchParams, selectTab, partnerApp]);

  useEffect(() => {
    return () => {
      const u = avatarPreviewRef.current;
      if (u.startsWith('blob:')) URL.revokeObjectURL(u);
      const c = coverPreviewsRef.current;
      for (const k of [c.cover43aPreview, c.cover43bPreview, c.cover169Preview] as (string | null)[]) {
        if (k && k.startsWith('blob:')) URL.revokeObjectURL(k);
      }
    };
  }, []);

  const cityLine = city.trim() ? city.trim() : 'Город: Не указан';
  const servicesLine =
    services.length > 0 ? services.join(', ') : 'Услуги: Не указаны';
  const coverUrlsForPreview = (() => {
    const u = parseStringArray(profile?.coverImageUrls);
    return u;
  })();
  const showPreviewImages = coverUrlsForPreview.length > 0;
  const coverLayoutResolved = (profile?.coverLayout === '16:9' ? '16:9' : '4:3') as '4:3' | '16:9';
  /** Одна обложка в превью (4:3 или 16:9) — растягиваем по ширине (до 800px). */
  const isSinglePreviewImageWide = coverUrlsForPreview.length === 1;
  const hasAbout = !!aboutRichValue.trim();
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

  const submitPartnerApplication = useCallback(() => {
    void partnerApp.submit({
      coverLetter: partnerApp.about,
      referralInviteExempt,
      referralCode: partnerApp.referralCode,
      file: partnerApp.file,
    });
  }, [partnerApp, referralInviteExempt]);

  const submitInviteDesigner = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void inviteDesigner.submit();
    },
    [inviteDesigner],
  );

  async function onSaveProfile() {
    setSaveError(null);
    setSaving(true);
    try {
      let nextAvatarUrl: string | null = profile?.avatarUrl?.trim() || null;
      if (avatarFile) {
        const up = await postMultipart('/api/user/profile/avatar', avatarFile, 'avatar');
        nextAvatarUrl = up.publicUrl;
      } else if (avatarPreview === '/images/placeholder.svg') {
        nextAvatarUrl = null;
      }

      const uploaded: string[] = [];
      if (coverGrid === '4:3') {
        if (cover43a) {
          const up = await postMultipart('/api/user/profile/cover', cover43a, 'cover');
          uploaded.push(up.publicUrl);
        } else if (remoteCoverA) {
          uploaded.push(remoteCoverA);
        }
        if (cover43b) {
          const up = await postMultipart('/api/user/profile/cover', cover43b, 'cover');
          uploaded.push(up.publicUrl);
        } else if (remoteCoverB) {
          uploaded.push(remoteCoverB);
        }
      } else {
        if (cover169) {
          const up = await postMultipart('/api/user/profile/cover', cover169, 'cover');
          uploaded.push(up.publicUrl);
        } else if (remoteCover169) {
          uploaded.push(remoteCover169);
        }
      }
      const coverImageUrls = uploaded.length ? uploaded : null;

      const next = await patchProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        city: city.trim() || null,
        services: services.length ? services : null,
        aboutHtml: aboutRichValue.trim() ? aboutRichValue : null,
        coverLayout: coverGrid,
        coverImageUrls,
        avatarUrl: nextAvatarUrl,
      });
      applyProfileDto(next);
      setAvatarFile(null);
      setCover43a(null);
      setCover43b(null);
      setCover169(null);
      closeProfileModal();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page} aria-label="Профиль">
      {loadError ? (
        <p className={flowStyles.formError} role="alert">
          {loadError}
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
              <img
                src={avatarPreview}
                alt=""
                className={styles.profileAvatar}
                width={82}
                height={82}
              />
              <div className={styles.profileTitlesCol}>
                <span className={styles.profileCity}>{cityLine}</span>
                <div className={styles.profileNameRow}>
                  <h1 className={styles.profileName}>{displayName(profile?.firstName ?? null, profile?.lastName ?? null)}</h1>
                  <button
                    type="button"
                    className={styles.editButton}
                    aria-label="Редактировать профиль"
                    onClick={() => {
                      setSaveError(null);
                      setProfileModalOpen(true);
                    }}
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
                    onClick={() => {
                      inviteDesigner.reset();
                      setInviteDesignerModalOpen(true);
                    }}
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
                      partnerApp.reset();
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
                <span>0</span>
              </div>
              <div className={styles.interactItem}>
                <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
                <span>0</span>
              </div>
            </div>
          </div>

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
                onClick={() => {
                  setAboutRichDraft(aboutRichValue);
                  setAboutSaveError(null);
                  setAboutModalOpen(true);
                  setAboutModalFullscreen(false);
                }}
              >
                <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
              </button>
            </div>

            {hasAbout ? (
              <div className={`rich-content ${styles.aboutRichContent}`} dangerouslySetInnerHTML={{ __html: aboutRichValue }} />
            ) : null}
          </section>
        </>
      ) : selectedTabKey === 'income' ? (
        <section aria-label="Доход">
          <ProfileIncomeTab />
        </section>
      ) : selectedTabKey === 'settings' ? (
        <ProfileSettingsTab
          onSessionChanged={() => {
            void loadProfile();
          }}
        />
      ) : null}

      {profileModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть редактирование профиля"
            onClick={closeProfileModal}
          />
          <section
            className={styles.aboutModalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование профиля"
          >
            <header className={styles.aboutModalHeader}>
              <button type="button" className={styles.aboutModalIconBtn} onClick={closeProfileModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              <h3 className={styles.aboutModalTitle}>Редактирование профиля</h3>

              <div className={styles.avatarUploader}>
                <span className={styles.avatarUploaderLabel}>Фото</span>
                <label className={styles.avatarUploaderField}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.avatarUploaderInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAvatarFile(file);
                      setAvatarPreview((prev) => {
                        if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                        return URL.createObjectURL(file);
                      });
                      e.currentTarget.value = '';
                    }}
                  />
                  <img src={avatarPreview} alt="" width={132} height={132} className={styles.avatarPreview} />
                  {avatarPreview !== '/images/placeholder.svg' ? (
                    <button
                      type="button"
                      className={styles.avatarRemove}
                      aria-label="Удалить фото"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarFile(null);
                        setAvatarPreview((prev) => {
                          if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                          return '/images/placeholder.svg';
                        });
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </label>
              </div>

              <div className={styles.nameRow}>
                <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Город</span>
                <button
                  type="button"
                  className={`${textFieldStyles.input} ${styles.selectInput}`}
                  onClick={() => setCityOpen((v) => !v)}
                  aria-expanded={cityOpen}
                >
                  <span className={city ? styles.selectValue : styles.selectPlaceholder}>
                    {city || 'Выберите город'}
                  </span>
                  <img
                    src="/icons/arrow.svg"
                    alt=""
                    width={22}
                    height={22}
                    aria-hidden
                    className={styles.chevron}
                    style={{ transform: cityOpen ? 'rotate(-90deg)' : 'rotate(90deg)' }}
                  />
                </button>
                {cityOpen ? (
                  <div className={styles.options}>
                    {CITY_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={styles.option}
                        onClick={() => {
                          setCity(item);
                          setCityOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <MultiSelectField
                label="Услуги"
                placeholder="Выберите услуги"
                options={serviceOptions}
                selected={services}
                open={servicesOpen}
                onToggleOpen={() => setServicesOpen((v) => !v)}
                onToggleOption={(service) =>
                  setServices((prev) => (prev.includes(service) ? prev.filter((x) => x !== service) : [...prev, service]))
                }
                onRemoveOption={(service) => setServices((prev) => prev.filter((x) => x !== service))}
              />

              <p className={styles.fieldLabel} style={{ marginTop: 8 }}>
                Создайте обложку страницы
              </p>
              <CoverGridField
                showGridLayoutLabel={false}
                coverGrid={coverGrid}
                onCoverGridChange={(g) => {
                  setCoverGrid(g);
                  if (g === '16:9') {
                    setCover43a(null);
                    setCover43b(null);
                    setRemoteCoverA(null);
                    setRemoteCoverB(null);
                    setCover43aPreview(null);
                    setCover43bPreview(null);
                    setCover169Preview(remoteCover169);
                  } else {
                    setCover169(null);
                    setRemoteCover169(null);
                    setCover169Preview(null);
                    setCover43aPreview(remoteCoverA);
                    setCover43bPreview(remoteCoverB);
                  }
                }}
                cover43a={cover43a}
                cover43b={cover43b}
                cover169={cover169}
                cover43aPreview={cover43aPreview}
                cover43bPreview={cover43bPreview}
                cover169Preview={cover169Preview}
                onFileChange={{
                  onChange43a: (f) => {
                    setCover43a(f);
                    setCover43aPreview((prev) => {
                      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                      return f ? URL.createObjectURL(f) : remoteCoverA;
                    });
                  },
                  onChange43b: (f) => {
                    setCover43b(f);
                    setCover43bPreview((prev) => {
                      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                      return f ? URL.createObjectURL(f) : remoteCoverB;
                    });
                  },
                  onChange169: (f) => {
                    setCover169(f);
                    setCover169Preview((prev) => {
                      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                      return f ? URL.createObjectURL(f) : remoteCover169;
                    });
                  },
                }}
                onFileRemove={{
                  onRemove43a: () => {
                    setCover43a(null);
                    setRemoteCoverA(null);
                    setCover43aPreview(null);
                  },
                  onRemove43b: () => {
                    setCover43b(null);
                    setRemoteCoverB(null);
                    setCover43bPreview(null);
                  },
                  onRemove169: () => {
                    setCover169(null);
                    setRemoteCover169(null);
                    setCover169Preview(null);
                  },
                }}
              />

              {saveError ? (
                <p className={flowStyles.formError} role="alert">
                  {saveError}
                </p>
              ) : null}

              <div className={styles.aboutModalActions}>
                <Button variant="primary" onClick={onSaveProfile} disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {aboutModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть редактирование"
            onClick={closeAboutModal}
          />
          <section
            className={`${styles.aboutModalPanel} ${aboutModalFullscreen ? styles.aboutModalPanelFullscreen : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование блока подробнее о вас"
          >
            <header className={styles.aboutModalHeader}>
              <button
                type="button"
                className={`${styles.aboutModalIconBtn} ${styles.aboutModalFullscreenBtn}`}
                onClick={() => setAboutModalFullscreen((v) => !v)}
                aria-label={aboutModalFullscreen ? 'Выйти из полноэкранного режима' : 'Открыть во весь экран'}
              >
                {aboutModalFullscreen ? <CollapseIcon /> : <ExpIcon />}
              </button>
              <button type="button" className={styles.aboutModalIconBtn} onClick={closeAboutModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              <h3 className={styles.aboutModalTitle}>Подробнее о вас</h3>
              <RichBlock
                value={aboutRichDraft}
                onChange={setAboutRichDraft}
                placeholder="Расскажите о себе: опыт, специализация, подход к проектам..."
                uploadMedia={async (file, _type) => {
                  const up = await postMultipart('/api/user/profile/rich-media', file, 'rich');
                  return up.publicUrl;
                }}
              />
              {aboutSaveError ? (
                <p className={flowStyles.formError} role="alert" style={{ marginTop: 8 }}>
                  {aboutSaveError}
                </p>
              ) : null}
              <div className={styles.aboutModalActions}>
                <Button
                  variant="primary"
                  disabled={aboutSaving}
                  onClick={async () => {
                    setAboutSaveError(null);
                    setAboutSaving(true);
                    try {
                      const next = await patchProfile({
                        aboutHtml: aboutRichDraft.trim() ? aboutRichDraft : null,
                      });
                      setAboutRichValue(aboutRichDraft);
                      applyProfileDto(next);
                      closeAboutModal();
                    } catch (e) {
                      setAboutSaveError(
                        e instanceof Error ? e.message : 'Нет сети или сервер недоступен. Повторите попытку.',
                      );
                    } finally {
                      setAboutSaving(false);
                    }
                  }}
                >
                  {aboutSaving ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {partnerAppModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть"
            onClick={closePartnerAppModal}
          />
          <section
            className={styles.aboutModalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Заявка на партнёра Win-Win"
          >
            <header className={styles.aboutModalHeader}>
              <button
                type="button"
                className={styles.aboutModalIconBtn}
                onClick={closePartnerAppModal}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              {partnerApp.phase === 'form' ? (
                <>
                  <h3 className={styles.aboutModalTitle}>Стать партнёром Win-Win</h3>
                  <div className={styles.partnerFormField}>
                    <label className={styles.fieldLabel} htmlFor="partner-app-about">
                      Расскажите о себе
                    </label>
                    <textarea
                      id="partner-app-about"
                      className={styles.partnerFormTextarea}
                      rows={6}
                      value={partnerApp.about}
                      onChange={(e) => partnerApp.setAbout(e.target.value)}
                      placeholder="Образование, проекты..."
                    />
                  </div>
                  {referralInviteExempt ? (
                    <p className={styles.partnerReferralExemptNote}>
                      Реферальный номер приглашающего для вашего аккаунта не требуется — вы в числе первых партнёров на платформе.
                    </p>
                  ) : (
                    <div className={styles.partnerFormField}>
                      <TextField
                        label="Реферальный номер приглашающего"
                        id="partner-app-referral"
                        value={partnerApp.referralCode}
                        onChange={(e) => partnerApp.setReferralCode(e.target.value)}
                        placeholder="Введите номер"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  <div className={styles.partnerFormField}>
                    <span className={styles.fieldLabel}>Прикрепите CV (PDF)</span>
                    <label className={styles.partnerFilePick}>
                      <input
                        type="file"
                        className={styles.partnerFileInput}
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          partnerApp.setFile(f);
                          e.currentTarget.value = '';
                        }}
                      />
                      <span className={styles.partnerFilePickText}>
                        {partnerApp.file ? partnerApp.file.name : 'Выбрать файл'}
                      </span>
                    </label>
                  </div>
                  {partnerApp.error ? (
                    <p className={flowStyles.formError} role="alert">
                      {partnerApp.error}
                    </p>
                  ) : null}
                  <div className={styles.aboutModalActions}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={submitPartnerApplication}
                      disabled={partnerApp.submitting}
                    >
                      {partnerApp.submitting ? 'Отправка…' : 'Подать заявку'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className={styles.aboutModalTitle}>Заявка отправлена</h3>
                  <p className={styles.partnerSuccessText}>
                    {profileEmail ? (
                      <>
                        Ваша заявка успешно отправлена! О статусе заявки пришлём уведомление на почту:{' '}
                        <strong>{profileEmail}</strong>.
                      </>
                    ) : (
                      <>
                        Ваша заявка успешно отправлена! Укажите email в разделе «Настройки» профиля, чтобы
                        получать уведомления о статусе заявки.
                      </>
                    )}
                  </p>
                  <div className={styles.aboutModalActions}>
                    {profileEmail ? null : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          selectTab('settings');
                          closePartnerAppModal();
                        }}
                      >
                        Открыть настройки
                      </Button>
                    )}
                    <Button type="button" variant="primary" onClick={closePartnerAppModal}>
                      Понятно
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      ) : null}

      {inviteDesignerModalOpen ? (
        <>
          <button
            type="button"
            className={styles.aboutModalBackdrop}
            aria-label="Закрыть"
            onClick={closeInviteDesignerModal}
          />
          <section
            className={styles.aboutModalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Пригласить дизайнера"
          >
            <header className={styles.aboutModalHeader}>
              <button
                type="button"
                className={styles.aboutModalIconBtn}
                onClick={closeInviteDesignerModal}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </header>
            <div className={styles.aboutModalInner}>
              {inviteDesigner.done ? (
                <>
                  <h3 className={styles.aboutModalTitle}>Письмо с приглашением отправлено</h3>
                  <p className={styles.partnerSuccessText}>
                    Ссылку с приглашением можно скопировать и отправить напрямую! Срок действия — 14 дней, одно
                    использование.
                  </p>
                  <div className={styles.aboutModalActions}>
                    {inviteDesigner.inviteLink ? (
                      <button
                        type="button"
                        className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.inviteLinkCopyBtn} ${inviteDesigner.copied ? styles.inviteLinkCopyBtnDone : ''}`}
                        onClick={() => {
                          void copyDesignerInviteLink();
                        }}
                      >
                        {inviteDesigner.copied ? 'Скопировано!' : 'Скопировать ссылку с приглашением'}
                      </button>
                    ) : null}
                    <Button type="button" variant="primary" onClick={closeInviteDesignerModal}>
                      Понятно
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className={styles.aboutModalTitle}>Пригласить дизайнера</h3>
                  <form onSubmit={submitInviteDesigner} noValidate>
                    <div className={styles.partnerFormField}>
                      <TextField
                        label="Email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={inviteDesigner.email}
                        onChange={(e) => {
                          inviteDesigner.setEmail(e.target.value);
                          inviteDesigner.setError(null);
                        }}
                        error={inviteDesigner.error || undefined}
                      />
                    </div>
                    <div className={styles.partnerFormField}>
                      <TextField
                        label="Реферальный номер"
                        type="text"
                        name="referralCode"
                        autoComplete="off"
                        value={myWinWinReferral ?? ''}
                        disabled
                      />
                    </div>
                    <div className={styles.aboutModalActions}>
                      <Button type="submit" variant="primary" disabled={inviteDesigner.sending}>
                        {inviteDesigner.sending ? 'Отправка…' : 'Отправить приглашение'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
        </>
      ) : null}
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

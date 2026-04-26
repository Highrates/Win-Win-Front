'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { ProfileIncomeTab } from './ProfileIncomeTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import btnStyles from '@/components/Button/Button.module.css';
import styles from './page.module.css';

const PROFILE_TAB_INFO = 0;
const PROFILE_TAB_INCOME = 1;
const PROFILE_TAB_SETTINGS = 2;

type CoverGrid = '4:3' | '16:9';

type ProfileDto = {
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  services: unknown;
  aboutHtml: string | null;
  coverLayout: string | null;
  coverImageUrls: unknown;
  avatarUrl: string | null;
  profileOnboardingPending: boolean;
  winWinPartnerApproved?: boolean;
  winWinReferralCode?: string | null;
  partnerApplicationSubmittedAt?: string | null;
  partnerApplicationRejectedAt?: string | null;
  email?: string | null;
  /** true — реферальный номер в заявке не требуется (первые на платформе, см. WINWIN_REFERRAL_EXEMPT_EMAILS) */
  referralInviteCodeExempt?: boolean;
};

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutModalFullscreen, setAboutModalFullscreen] = useState(false);

  const [profile, setProfile] = useState<ProfileDto | null>(null);
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

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aboutSaveError, setAboutSaveError] = useState<string | null>(null);
  const [aboutSaving, setAboutSaving] = useState(false);

  const [partnerAppModalOpen, setPartnerAppModalOpen] = useState(false);
  const [partnerAppPhase, setPartnerAppPhase] = useState<'form' | 'success'>('form');
  const [partnerAppAbout, setPartnerAppAbout] = useState('');
  const [partnerAppReferralCode, setPartnerAppReferralCode] = useState('');
  const [partnerAppFile, setPartnerAppFile] = useState<File | null>(null);
  const [partnerAppError, setPartnerAppError] = useState<string | null>(null);
  const [partnerAppSubmitting, setPartnerAppSubmitting] = useState(false);

  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const [inviteDesignerEmail, setInviteDesignerEmail] = useState('');
  const [inviteDesignerSending, setInviteDesignerSending] = useState(false);
  const [inviteDesignerError, setInviteDesignerError] = useState<string | null>(null);
  const [inviteDesignerDone, setInviteDesignerDone] = useState(false);
  const [inviteDesignerInviteLink, setInviteDesignerInviteLink] = useState<string | null>(null);
  const [inviteDesignerCopied, setInviteDesignerCopied] = useState(false);

  const PROFILE_TABS = ['Инфо', 'Доход', 'Настройки'] as const;
  const CITY_OPTIONS = ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи'] as const;
  const DEFAULT_SERVICE_OPTIONS = [
    'Дизайн интерьера',
    'Комплектация',
    'Авторский надзор',
    'Планировка',
  ] as const;
  const [serviceOptions, setServiceOptions] = useState<string[]>([...DEFAULT_SERVICE_OPTIONS]);

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

  const closePartnerAppModal = useCallback(() => {
    setPartnerAppModalOpen(false);
    setPartnerAppPhase('form');
    setPartnerAppAbout('');
    setPartnerAppReferralCode('');
    setPartnerAppFile(null);
    setPartnerAppError(null);
  }, []);

  const closeInviteDesignerModal = useCallback(() => {
    setInviteDesignerModalOpen(false);
    setInviteDesignerEmail('');
    setInviteDesignerError(null);
    setInviteDesignerDone(false);
    setInviteDesignerInviteLink(null);
    setInviteDesignerCopied(false);
  }, []);

  useModalBodyLock(profileModalOpen, closeProfileModal);
  useModalBodyLock(aboutModalOpen, closeAboutModal);
  useModalBodyLock(partnerAppModalOpen, closePartnerAppModal);
  useModalBodyLock(inviteDesignerModalOpen, closeInviteDesignerModal);

  const copyDesignerInviteLink = useCallback(async () => {
    if (!inviteDesignerInviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteDesignerInviteLink);
      setInviteDesignerCopied(true);
      window.setTimeout(() => setInviteDesignerCopied(false), 2500);
    } catch {
      setInviteDesignerCopied(false);
    }
  }, [inviteDesignerInviteLink]);

  const applyProfileDto = useCallback((p: ProfileDto) => {
    setProfile(p);
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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/profile', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) {
        setLoadError('Не удалось загрузить профиль');
        return;
      }
      const data = (await res.json()) as ProfileDto;
      applyProfileDto(data);
    } catch {
      setLoadError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [applyProfileDto]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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
    if (tab === 'income') setSelectedIndex(PROFILE_TAB_INCOME);
    if (tab === 'settings') setSelectedIndex(PROFILE_TAB_SETTINGS);
    if (tab === 'info' || !tab) setSelectedIndex(PROFILE_TAB_INFO);
  }, [searchParams]);

  useEffect(() => {
    const welcome = searchParams.get('welcome') === '1';
    if (!welcome) return;
    setSelectedIndex(PROFILE_TAB_INFO);
    void (async () => {
      try {
        await fetch('/api/user/profile/onboarding/ack', { method: 'PATCH', credentials: 'same-origin' });
      } catch {
        /* ignore */
      } finally {
        router.replace(pathname, { scroll: false });
      }
    })();
  }, [pathname, router, searchParams]);

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
    setInviteDesignerError(null);
    setInviteDesignerDone(false);
    setInviteDesignerEmail('');
    setInviteDesignerModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [loading, profile, pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get('partnerApply') !== '1') return;
    if (loading) return;
    if (!profile) return;
    const prefill = searchParams.get('prefillRef')?.trim();
    if (prefill) setPartnerAppReferralCode(prefill);
    const pending =
      Boolean(profile.partnerApplicationSubmittedAt) &&
      !profile.winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt;
    if (pending || profile.winWinPartnerApproved) {
      router.replace(pathname, { scroll: false });
      return;
    }
    setSelectedIndex(PROFILE_TAB_INFO);
    setPartnerAppModalOpen(true);
    setPartnerAppPhase('form');
    setPartnerAppError(null);
    router.replace(pathname, { scroll: false });
  }, [loading, profile, pathname, router, searchParams]);

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
  const winWinPartnerApproved = Boolean(profile?.winWinPartnerApproved);
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

  async function submitPartnerApplication() {
    setPartnerAppError(null);
    const text = partnerAppAbout.trim();
    if (text.length < 20) {
      setPartnerAppError('Расскажите о себе: не меньше 20 символов');
      return;
    }
    if (!referralInviteExempt) {
      const ref = partnerAppReferralCode.trim();
      if (ref.length < 3) {
        setPartnerAppError('Укажите реферальный номер приглашающего');
        return;
      }
    }
    if (!partnerAppFile) {
      setPartnerAppError('Прикрепите CV в формате PDF');
      return;
    }
    const isPdf =
      partnerAppFile.type === 'application/pdf' || partnerAppFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setPartnerAppError('Нужен файл в формате PDF (.pdf)');
      return;
    }
    setPartnerAppSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('coverLetter', text);
      if (!referralInviteExempt) {
        fd.set('referralCode', partnerAppReferralCode.trim());
      }
      fd.set('file', partnerAppFile);
      const res = await fetch('/api/user/partner-application', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setPartnerAppError(await readApiErrorMessage(res));
        return;
      }
      const next = (await res.json()) as ProfileDto;
      applyProfileDto(next);
      setPartnerAppPhase('success');
    } catch {
      setPartnerAppError('Не удалось отправить заявку. Повторите попытку.');
    } finally {
      setPartnerAppSubmitting(false);
    }
  }

  async function submitInviteDesigner(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteDesignerError(null);
    const em = inviteDesignerEmail.trim().toLowerCase();
    if (!em.includes('@')) {
      setInviteDesignerError('Введите корректный email');
      return;
    }
    setInviteDesignerSending(true);
    try {
      const res = await fetch('/api/user/designer-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setInviteDesignerError(await readApiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { inviteLink?: string };
      setInviteDesignerInviteLink(
        typeof data.inviteLink === 'string' && data.inviteLink.length > 0 ? data.inviteLink : null,
      );
      setInviteDesignerDone(true);
    } catch {
      setInviteDesignerError('Не удалось отправить. Повторите позже.');
    } finally {
      setInviteDesignerSending(false);
    }
  }

  function publicUrlFromUploadResponse(j: unknown): string {
    if (!j || typeof j !== 'object') {
      throw new Error('Нет URL в ответе API');
    }
    const o = j as Record<string, unknown>;
    if (typeof o.publicUrl === 'string' && o.publicUrl.trim()) {
      return o.publicUrl.trim();
    }
    if (typeof o.url === 'string' && o.url.trim()) {
      return o.url.trim();
    }
    if (typeof o.avatarUrl === 'string' && o.avatarUrl.trim()) {
      return o.avatarUrl.trim();
    }
    if (o.profile && typeof o.profile === 'object' && o.profile !== null) {
      const p = o.profile as Record<string, unknown>;
      if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim()) {
        return p.avatarUrl.trim();
      }
    }
    throw new Error('Нет URL в ответе API');
  }

  async function readProfileUploadError(res: Response, kind: 'avatar' | 'cover' | 'rich'): Promise<string> {
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(j.message)) return j.message.join(', ');
      if (typeof j.message === 'string' && j.message.trim()) return j.message;
    } catch {
      /* empty */
    }
    if (res.status === 413) {
      if (kind === 'avatar') return 'Аватар не больше 2 МБ';
      if (kind === 'cover') return 'Файл обложки не больше 5 МБ';
      return 'Файл больше 100 МБ';
    }
    return 'Не удалось загрузить файл';
  }

  async function postMultipart(
    url: string,
    file: File,
    kind: 'avatar' | 'cover' | 'rich' = 'cover',
  ): Promise<{ publicUrl: string }> {
    const fd = new FormData();
    fd.set('file', file);
    const res = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(await readProfileUploadError(res, kind));
    }
    const j: unknown = await res.json();
    return { publicUrl: publicUrlFromUploadResponse(j) };
  }

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

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          city: city.trim() || null,
          services: services.length ? services : null,
          aboutHtml: aboutRichValue.trim() ? aboutRichValue : null,
          coverLayout: coverGrid,
          coverImageUrls,
          avatarUrl: nextAvatarUrl,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        setSaveError(t || 'Не удалось сохранить');
        return;
      }
      const next = (await res.json()) as ProfileDto;
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
        projects={PROFILE_TABS}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        ariaLabel="Разделы профиля"
      />

      {loading ? (
        <ProfilePageLoading />
      ) : selectedIndex === PROFILE_TAB_INFO ? (
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
                      setInviteDesignerError(null);
                      setInviteDesignerDone(false);
                      setInviteDesignerEmail('');
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
                      setPartnerAppPhase('form');
                      setPartnerAppError(null);
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
      ) : selectedIndex === PROFILE_TAB_INCOME ? (
        <section aria-label="Доход">
          <ProfileIncomeTab />
        </section>
      ) : selectedIndex === PROFILE_TAB_SETTINGS ? (
        <ProfileSettingsTab onSessionChanged={() => { void loadProfile(); }} />
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
                      const res = await fetch('/api/user/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ aboutHtml: aboutRichDraft.trim() ? aboutRichDraft : null }),
                      });
                      if (!res.ok) {
                        setAboutSaveError(await readApiErrorMessage(res));
                        return;
                      }
                      const next = (await res.json()) as ProfileDto;
                      setAboutRichValue(aboutRichDraft);
                      applyProfileDto(next);
                      closeAboutModal();
                    } catch {
                      setAboutSaveError('Нет сети или сервер недоступен. Повторите попытку.');
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
              {partnerAppPhase === 'form' ? (
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
                      value={partnerAppAbout}
                      onChange={(e) => setPartnerAppAbout(e.target.value)}
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
                        value={partnerAppReferralCode}
                        onChange={(e) => setPartnerAppReferralCode(e.target.value)}
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
                          setPartnerAppFile(f);
                          e.currentTarget.value = '';
                        }}
                      />
                      <span className={styles.partnerFilePickText}>
                        {partnerAppFile ? partnerAppFile.name : 'Выбрать файл'}
                      </span>
                    </label>
                  </div>
                  {partnerAppError ? (
                    <p className={flowStyles.formError} role="alert">
                      {partnerAppError}
                    </p>
                  ) : null}
                  <div className={styles.aboutModalActions}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={submitPartnerApplication}
                      disabled={partnerAppSubmitting}
                    >
                      {partnerAppSubmitting ? 'Отправка…' : 'Подать заявку'}
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
                          setSelectedIndex(PROFILE_TAB_SETTINGS);
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
              {inviteDesignerDone ? (
                <>
                  <h3 className={styles.aboutModalTitle}>Письмо с приглашением отправлено</h3>
                  <p className={styles.partnerSuccessText}>
                    Ссылку с приглашением можно скопировать и переслать, например, в мессенджер. Срок действия — 14
                    дней, одно использование.
                  </p>
                  <div className={styles.aboutModalActions}>
                    {inviteDesignerInviteLink ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          void copyDesignerInviteLink();
                        }}
                      >
                        {inviteDesignerCopied ? 'Скопировано' : 'Скопировать ссылку с приглашением'}
                      </Button>
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
                        value={inviteDesignerEmail}
                        onChange={(e) => {
                          setInviteDesignerEmail(e.target.value);
                          setInviteDesignerError(null);
                        }}
                        error={inviteDesignerError || undefined}
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
                      <Button type="submit" variant="primary" disabled={inviteDesignerSending}>
                        {inviteDesignerSending ? 'Отправка…' : 'Отправить приглашение'}
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ProfileDto } from './profileTypes';

export type ProfileTabKey = 'info' | 'income' | 'settings';

type Args = {
  loading: boolean;
  profile: ProfileDto | null;
  availableTabKeys: readonly ProfileTabKey[];
  selectTab: (key: ProfileTabKey) => void;
  openProfileEdit: () => void;
  openInviteDesigner: () => void;
  openPartnerApply: (prefillRef?: string) => void;
};

/**
 * Query-параметры страницы профиля: tab / welcome / profileEdit / inviteDesigner /
 * partnerApply / partnerSuggest / referralWarning.
 */
export function useProfileDeepLinks({
  loading,
  profile,
  availableTabKeys,
  selectTab,
  openProfileEdit,
  openInviteDesigner,
  openPartnerApply,
}: Args) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [referralWarningBanner, setReferralWarningBanner] = useState<string | null>(null);
  const [partnerSuggest, setPartnerSuggest] = useState<{ prefillRef?: string } | null>(null);
  const handledKeys = useRef(new Set<string>());

  /** Читаем актуальный query из location — иначе async strip (welcome) поднимает устаревший снимок. */
  const stripParams = useCallback(
    (...keys: string[]) => {
      const raw =
        typeof window !== 'undefined' ? window.location.search : `?${searchParams.toString()}`;
      const next = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
      for (const k of keys) next.delete(k);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const warn = searchParams.get('referralWarning')?.trim();
    if (!warn) return;
    setReferralWarningBanner(warn);
    stripParams('referralWarning');
  }, [searchParams, stripParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const key: ProfileTabKey =
      tab === 'income' || tab === 'settings' || tab === 'info' ? tab : 'info';
    if (availableTabKeys.includes(key)) selectTab(key);
    else selectTab('info');
  }, [searchParams, selectTab, availableTabKeys]);

  useEffect(() => {
    if (searchParams.get('welcome') !== '1') return;
    if (handledKeys.current.has('welcome')) return;
    handledKeys.current.add('welcome');
    selectTab('info');
    void (async () => {
      try {
        await fetch('/api/user/profile/onboarding/ack', { method: 'PATCH', credentials: 'same-origin' });
      } catch {
        /* ignore */
      } finally {
        stripParams('welcome');
      }
    })();
  }, [searchParams, selectTab, stripParams]);

  useEffect(() => {
    if (searchParams.get('profileEdit') !== '1') return;
    openProfileEdit();
    stripParams('profileEdit');
  }, [searchParams, openProfileEdit, stripParams]);

  useEffect(() => {
    if (searchParams.get('inviteDesigner') !== '1') return;
    if (loading) return;
    if (!profile?.winWinPartnerApproved) {
      stripParams('inviteDesigner');
      return;
    }
    openInviteDesigner();
    stripParams('inviteDesigner');
  }, [loading, profile?.winWinPartnerApproved, searchParams, openInviteDesigner, stripParams]);

  useEffect(() => {
    if (searchParams.get('partnerApply') !== '1') return;
    if (loading || !profile) return;
    const prefill =
      searchParams.get('prefillRef')?.trim() ||
      profile.partnerApplicationReferralCode?.trim() ||
      '';
    const pending =
      Boolean(profile.partnerApplicationSubmittedAt) &&
      !profile.winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt;
    if (pending || profile.winWinPartnerApproved) {
      stripParams('partnerApply', 'prefillRef');
      return;
    }
    selectTab('info');
    openPartnerApply(prefill || undefined);
    stripParams('partnerApply', 'prefillRef');
  }, [loading, profile, searchParams, selectTab, openPartnerApply, stripParams]);

  /** Мягкое предложение после регистрации по общей ?ref= — без автооткрытия модалки. */
  useEffect(() => {
    if (searchParams.get('partnerSuggest') !== '1') return;
    if (loading || !profile) return;
    const prefill =
      searchParams.get('prefillRef')?.trim() ||
      profile.partnerApplicationReferralCode?.trim() ||
      '';
    const pending =
      Boolean(profile.partnerApplicationSubmittedAt) &&
      !profile.winWinPartnerApproved &&
      !profile.partnerApplicationRejectedAt;
    if (pending || profile.winWinPartnerApproved) {
      stripParams('partnerSuggest', 'prefillRef');
      return;
    }
    selectTab('info');
    setPartnerSuggest({ prefillRef: prefill || undefined });
    stripParams('partnerSuggest', 'prefillRef');
  }, [loading, profile, searchParams, selectTab, stripParams]);

  const dismissPartnerSuggest = useCallback(() => setPartnerSuggest(null), []);

  return {
    referralWarningBanner,
    partnerSuggest,
    dismissPartnerSuggest,
    searchParams,
    pathname,
    router,
  };
}

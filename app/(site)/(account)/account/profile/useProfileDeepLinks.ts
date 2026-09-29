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
 * Query-параметры страницы профиля: tab / welcome / profileEdit / inviteDesigner / partnerApply / referralWarning.
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
  const handledKeys = useRef(new Set<string>());

  const stripParams = useCallback(
    (...keys: string[]) => {
      const next = new URLSearchParams(searchParams.toString());
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

  return { referralWarningBanner, searchParams, pathname, router };
}

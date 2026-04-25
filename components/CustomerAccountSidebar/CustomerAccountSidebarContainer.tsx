'use client';

import { useEffect, useState } from 'react';
import { CustomerAccountSidebar } from './CustomerAccountSidebar';

type ProfileMe = {
  firstName?: string | null;
  lastName?: string | null;
  winWinPartnerApproved?: boolean;
  partnerApplicationSubmittedAt?: string | null;
  partnerApplicationRejectedAt?: string | null;
};

function displayName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const t = [firstName, lastName].filter((x) => x && String(x).trim()).join(' ').trim();
  return t || 'Имя пользователя';
}

export function CustomerAccountSidebarContainer() {
  const [userName, setUserName] = useState('Имя пользователя');
  const [isWinWinPartner, setIsWinWinPartner] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ProfileMe;
        if (cancelled) return;
        setUserName(displayName(data.firstName, data.lastName));
        setIsWinWinPartner(Boolean(data.winWinPartnerApproved));
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CustomerAccountSidebar
      userName={userName}
      isWinWinPartner={isWinWinPartner}
      profileLoaded={profileLoaded}
    />
  );
}

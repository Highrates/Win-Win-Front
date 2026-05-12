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
  const [orderChatNotify, setOrderChatNotify] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/user/order-chat/me/unread-count', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { count?: number };
        if (!cancelled) setOrderChatNotify((j.count ?? 0) > 0);
      } catch {
        if (!cancelled) setOrderChatNotify(false);
      }
    };
    void poll();
    const id = window.setInterval(poll, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <CustomerAccountSidebar
      userName={userName}
      isWinWinPartner={isWinWinPartner}
      profileLoaded={profileLoaded}
      menuItemsWithNotification={orderChatNotify ? ['/account/orders'] : []}
    />
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { CustomerAccountSidebar } from './CustomerAccountSidebar';
import { ACCOUNT_WORK_NOTIFICATIONS_EVENT, dispatchAccountWorkFeedRefreshEvent } from '@/lib/account/orders';

type ProfileMe = {
  firstName?: string | null;
  lastName?: string | null;
  winWinPartnerApproved?: boolean;
  userGroupLabel?: string | null;
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
  const [userGroupLabel, setUserGroupLabel] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [orderChatNotify, setOrderChatNotify] = useState(false);
  const [workTabNotify, setWorkTabNotify] = useState(false);
  const prevWorkUnreadRef = useRef(0);

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
        setUserGroupLabel(data.userGroupLabel?.trim() ? data.userGroupLabel.trim() : null);
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
        const [allRes, workRes] = await Promise.all([
          fetch('/api/user/order-chat/me/unread-count', {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
          fetch('/api/user/order-chat/me/unread-count?scope=work', {
            credentials: 'same-origin',
            cache: 'no-store',
          }),
        ]);
        if (cancelled) return;
        if (allRes.ok) {
          const j = (await allRes.json()) as { count?: number };
          if (!cancelled) setOrderChatNotify((j.count ?? 0) > 0);
        } else if (!cancelled) setOrderChatNotify(false);
        if (workRes.ok) {
          const j = (await workRes.json()) as { count?: number };
          const next = j.count ?? 0;
          if (!cancelled) {
            if (next > prevWorkUnreadRef.current) {
              dispatchAccountWorkFeedRefreshEvent();
            }
            prevWorkUnreadRef.current = next;
            setWorkTabNotify(next > 0);
          }
        } else if (!cancelled) setWorkTabNotify(false);
      } catch {
        if (!cancelled) {
          setOrderChatNotify(false);
          setWorkTabNotify(false);
        }
      }
    };
    void poll();
    const id = window.setInterval(poll, 45_000);
    const onWorkNotifications = () => void poll();
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    };
  }, []);

  const menuHrefOverrides = workTabNotify ? { '/account/orders': '/account/orders?tab=work' } : {};

  return (
    <CustomerAccountSidebar
      userName={userName}
      isWinWinPartner={isWinWinPartner}
      userGroupLabel={userGroupLabel}
      profileLoaded={profileLoaded}
      menuItemsWithNotification={orderChatNotify ? ['/account/orders'] : []}
      menuHrefOverrides={menuHrefOverrides}
    />
  );
}

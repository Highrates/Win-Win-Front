'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';

const ADMIN_SIDEBAR_BADGE_POLL_MS = 30_000;

export type AdminSidebarBadgesValue = {
  pendingPartnerApps: number | null;
  pendingOrdersApproval: number | null;
  ordersChatUnread: number | null;
};

const AdminSidebarBadgesContext = createContext<AdminSidebarBadgesValue | null>(null);

export function AdminSidebarBadgesProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [pendingPartnerApps, setPendingPartnerApps] = useState<number | null>(null);
  const [pendingOrdersApproval, setPendingOrdersApproval] = useState<number | null>(null);
  const [ordersChatUnread, setOrdersChatUnread] = useState<number | null>(null);

  const loadPendingPartnerApps = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>(
        'users/admin/partner-applications/pending-count',
      );
      setPendingPartnerApps(typeof j.total === 'number' ? j.total : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadPendingOrdersApproval = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('orders/admin/pending-approval-count');
      setPendingOrdersApproval(typeof j.total === 'number' ? j.total : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadOrdersChatUnread = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('orders/admin/chat-unread-summary');
      setOrdersChatUnread(typeof j.total === 'number' ? j.total : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(() => {
    void loadPendingPartnerApps();
    void loadPendingOrdersApproval();
    void loadOrdersChatUnread();
  }, [loadPendingPartnerApps, loadPendingOrdersApproval, loadOrdersChatUnread]);

  useEffect(() => {
    if (!enabled) return;

    refreshAll();

    const pollId = window.setInterval(refreshAll, ADMIN_SIDEBAR_BADGE_POLL_MS);
    return () => window.clearInterval(pollId);
  }, [enabled, refreshAll]);

  useEffect(() => {
    if (!enabled) return;

    const onRefreshPartner = () => {
      void loadPendingPartnerApps();
    };
    const onRefreshOrders = () => {
      void loadPendingOrdersApproval();
    };
    const onRefreshOrdersChatUnread = () => {
      void loadOrdersChatUnread();
    };
    document.addEventListener('admin-partner-pending-refresh', onRefreshPartner);
    document.addEventListener('admin-orders-pending-refresh', onRefreshOrders);
    document.addEventListener('admin-orders-chat-unread-refresh', onRefreshOrdersChatUnread);
    return () => {
      document.removeEventListener('admin-partner-pending-refresh', onRefreshPartner);
      document.removeEventListener('admin-orders-pending-refresh', onRefreshOrders);
      document.removeEventListener('admin-orders-chat-unread-refresh', onRefreshOrdersChatUnread);
    };
  }, [enabled, loadPendingPartnerApps, loadPendingOrdersApproval, loadOrdersChatUnread]);

  const value = useMemo(
    () => ({ pendingPartnerApps, pendingOrdersApproval, ordersChatUnread }),
    [pendingPartnerApps, pendingOrdersApproval, ordersChatUnread],
  );

  return (
    <AdminSidebarBadgesContext.Provider value={value}>{children}</AdminSidebarBadgesContext.Provider>
  );
}

export function useAdminSidebarBadges(): AdminSidebarBadgesValue {
  const v = useContext(AdminSidebarBadgesContext);
  if (!v) {
    throw new Error('useAdminSidebarBadges: оберните в AdminSidebarBadgesProvider.');
  }
  return v;
}

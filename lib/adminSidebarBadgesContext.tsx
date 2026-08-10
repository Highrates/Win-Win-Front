'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT, ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT } from '@/lib/productQa/constants';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminPermissionsOptional } from '@/lib/adminPermissions/AdminPermissionsProvider';

const ADMIN_SIDEBAR_BADGE_POLL_MS = 30_000;

function warnBadgeLoadFailure(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'development') return;
  const msg = error instanceof Error ? error.message : String(error);
  console.warn(`[AdminSidebarBadges] ${label}: ${msg}`);
}

export type AdminSidebarBadgesValue = {
  pendingPartnerApps: number | null;
  pendingOrdersApproval: number | null;
  pendingSourcingReview: number | null;
  ordersChatUnread: number | null;
  productQaUnread: number | null;
  productQaPending: number | null;
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
  const [pendingSourcingReview, setPendingSourcingReview] = useState<number | null>(null);
  const [ordersChatUnread, setOrdersChatUnread] = useState<number | null>(null);
  const [productQaUnread, setProductQaUnread] = useState<number | null>(null);
  const [productQaPending, setProductQaPending] = useState<number | null>(null);

  const loadPendingPartnerApps = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>(
        'users/admin/partner-applications/pending-count',
      );
      setPendingPartnerApps(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('partner applications', e);
    }
  }, []);

  const loadPendingOrdersApproval = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('orders/admin/pending-approval-count');
      setPendingOrdersApproval(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('orders pending approval', e);
    }
  }, []);

  const loadPendingSourcingReview = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('sourcing-requests/admin/pending-review-count');
      setPendingSourcingReview(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('sourcing pending review', e);
    }
  }, []);

  const loadOrdersChatUnread = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('orders/admin/chat-unread-summary');
      setOrdersChatUnread(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('orders chat unread', e);
    }
  }, []);

  const loadProductQaUnread = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('catalog/admin/qa/unread-summary');
      setProductQaUnread(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('product qa unread', e);
    }
  }, []);

  const loadProductQaPending = useCallback(async () => {
    try {
      const j = await adminBackendJson<{ total?: number }>('catalog/admin/qa/pending-summary');
      setProductQaPending(typeof j.total === 'number' ? j.total : 0);
    } catch (e) {
      warnBadgeLoadFailure('product qa pending', e);
    }
  }, []);

  const permissions = useAdminPermissionsOptional();

  const refreshAll = useCallback(() => {
    if (permissions && !permissions.loading) {
      if (permissions.canAccessSection('applications')) void loadPendingPartnerApps();
      else setPendingPartnerApps(null);
      if (permissions.canAccessSection('orders')) {
        void loadPendingOrdersApproval();
        void loadPendingSourcingReview();
        void loadOrdersChatUnread();
      } else {
        setPendingOrdersApproval(null);
        setPendingSourcingReview(null);
        setOrdersChatUnread(null);
      }
      if (permissions.canAccessSection('catalog')) {
        void loadProductQaUnread();
        void loadProductQaPending();
      } else {
        setProductQaUnread(null);
        setProductQaPending(null);
      }
      return;
    }
  }, [
    permissions,
    loadPendingPartnerApps,
    loadPendingOrdersApproval,
    loadPendingSourcingReview,
    loadOrdersChatUnread,
    loadProductQaUnread,
    loadProductQaPending,
  ]);

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
    const onRefreshSourcingPending = () => {
      void loadPendingSourcingReview();
    };
    const onRefreshOrdersChatUnread = () => {
      void loadOrdersChatUnread();
    };
    const onRefreshProductQaUnread = () => {
      void loadProductQaUnread();
    };
    const onRefreshProductQaPending = () => {
      void loadProductQaPending();
    };
    document.addEventListener('admin-partner-pending-refresh', onRefreshPartner);
    document.addEventListener('admin-orders-pending-refresh', onRefreshOrders);
    document.addEventListener('admin-sourcing-pending-refresh', onRefreshSourcingPending);
    document.addEventListener('admin-orders-chat-unread-refresh', onRefreshOrdersChatUnread);
    document.addEventListener(ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT, onRefreshProductQaUnread);
    document.addEventListener(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT, onRefreshProductQaPending);
    return () => {
      document.removeEventListener('admin-partner-pending-refresh', onRefreshPartner);
      document.removeEventListener('admin-orders-pending-refresh', onRefreshOrders);
      document.removeEventListener('admin-sourcing-pending-refresh', onRefreshSourcingPending);
      document.removeEventListener('admin-orders-chat-unread-refresh', onRefreshOrdersChatUnread);
      document.removeEventListener(ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT, onRefreshProductQaUnread);
      document.removeEventListener(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT, onRefreshProductQaPending);
    };
  }, [
    enabled,
    loadPendingPartnerApps,
    loadPendingOrdersApproval,
    loadPendingSourcingReview,
    loadOrdersChatUnread,
    loadProductQaUnread,
    loadProductQaPending,
  ]);

  const value = useMemo(
    () => ({
      pendingPartnerApps,
      pendingOrdersApproval,
      pendingSourcingReview,
      ordersChatUnread,
      productQaUnread,
      productQaPending,
    }),
    [pendingPartnerApps, pendingOrdersApproval, pendingSourcingReview, ordersChatUnread, productQaUnread, productQaPending],
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

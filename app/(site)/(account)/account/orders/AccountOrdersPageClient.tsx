'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountOrderDetailModal } from '@/components/AccountOrders/AccountOrderDetailModal';
import { AccountSourcingRequestDetailModal } from '@/components/AccountOrders/AccountSourcingRequestDetailModal';
import { SourcingRequestModal } from '@/components/SourcingRequest/SourcingRequestModal';
import { SourcingDraftBanner } from '@/components/SourcingRequest/SourcingDraftBanner';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import {
  ORDER_TABS,
  ACCOUNT_WORK_NOTIFICATIONS_EVENT,
  ACCOUNT_WORK_FEED_REFRESH_EVENT,
  accountOrdersTabForStatus,
  buildAccountOrdersHref,
  orderTabIndexFromQuery,
  type AccountOrdersDetailLink,
  type AccountWorkNotificationsDetail,
} from '@/lib/account/orders';
import {
  accountWorkHasNotification,
  parseAccountWorkUnreadSummary,
} from '@/lib/account/workNotifications';
import {
  fetchPublicOrderProgram,
  type OrderProgramPublic,
} from '@/lib/orderProgram/publicOrderProgram';
import { CompletedTab } from './components/CompletedTab';
import { PrepTab } from './components/PrepTab';
import { WorkTabFeed } from './components/WorkTabFeed';
import { useScopedOrdersFeed } from './hooks/useScopedOrdersFeed';
import styles from './page.module.css';

async function fetchWorkTabHasNotification(): Promise<boolean> {
  const res = await fetch('/api/user/order-chat/me/unread-count?scope=work', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return false;
  try {
    return accountWorkHasNotification(parseAccountWorkUnreadSummary(await res.json()));
  } catch {
    return false;
  }
}

export function AccountOrdersPageClient({
  initialTabIndex = 0,
  initialDetail = null,
}: { initialTabIndex?: number; initialDetail?: AccountOrdersDetailLink | null } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = useState(initialTabIndex);

  useEffect(() => {
    setSelectedIndex(initialTabIndex);
  }, [initialTabIndex]);

  const [workOrderDetailId, setWorkOrderDetailId] = useState<string | null>(null);
  const [workSourcingDetailId, setWorkSourcingDetailId] = useState<string | null>(null);
  const [detailChatOpen, setDetailChatOpen] = useState(false);
  const [detailStatus, setDetailStatus] = useState<string | null>(null);
  const [sourcingModalOpen, setSourcingModalOpen] = useState(false);
  const [sourcingResumeDraft, setSourcingResumeDraft] = useState(false);
  const [sourcingDraftRefreshKey, setSourcingDraftRefreshKey] = useState(0);
  const [workTabHasNotification, setWorkTabHasNotification] = useState(false);
  const [orderProgram, setOrderProgram] = useState<OrderProgramPublic | null>(null);
  /** Deep-link `chat=1` применяется один раз на id, дальше URL ведёт UI. */
  const appliedDeepLinkChatRef = useRef<string | null>(null);

  const isPreparationTab = selectedIndex === 0;
  const isInWorkTab = selectedIndex === 1;
  const isCompletedTab = selectedIndex === 2;

  const work = useScopedOrdersFeed('work');
  const completed = useScopedOrdersFeed('completed');
  const { load: loadWork, loadMore: loadMoreWork, clearEntityUnread: clearWorkEntityUnread } = work;
  const { load: loadCompleted, loadMore: loadMoreCompleted } = completed;

  const replaceDetailHref = useCallback(
    (opts: {
      tabIndex: number;
      kind: 'order' | 'sourcing';
      id: string;
      chat: boolean;
      status?: string | null;
    }) => {
      router.replace(
        buildAccountOrdersHref({
          tabIndex: opts.tabIndex,
          detail: {
            kind: opts.kind,
            id: opts.id,
            chat: opts.chat,
            status: opts.status,
          },
          pathname,
        }),
        { scroll: false },
      );
    },
    [pathname, router],
  );

  const onSelectOrderTab = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      setWorkOrderDetailId(null);
      setWorkSourcingDetailId(null);
      setDetailChatOpen(false);
      setDetailStatus(null);
      router.replace(buildAccountOrdersHref({ tabIndex: index, detail: null, pathname }), { scroll: false });
    },
    [pathname, router],
  );

  const openOrderDetail = useCallback(
    (id: string, opts?: { chat?: boolean; status?: string | null }) => {
      const chat = opts?.chat ?? false;
      const status = opts?.status ?? null;
      const tabIndex = status
        ? orderTabIndexFromQuery(accountOrdersTabForStatus('order', status))
        : selectedIndex;
      setSelectedIndex(tabIndex);
      setWorkSourcingDetailId(null);
      setWorkOrderDetailId(id);
      setDetailChatOpen(chat);
      setDetailStatus(status);
      replaceDetailHref({ tabIndex, kind: 'order', id, chat, status });
    },
    [replaceDetailHref, selectedIndex],
  );

  const openSourcingDetail = useCallback(
    (id: string, opts?: { chat?: boolean; status?: string | null }) => {
      const chat = opts?.chat ?? false;
      const status = opts?.status ?? null;
      const tabIndex = status
        ? orderTabIndexFromQuery(accountOrdersTabForStatus('sourcing', status))
        : selectedIndex;
      setSelectedIndex(tabIndex);
      setWorkOrderDetailId(null);
      setWorkSourcingDetailId(id);
      setDetailChatOpen(chat);
      setDetailStatus(status);
      replaceDetailHref({ tabIndex, kind: 'sourcing', id, chat, status });
    },
    [replaceDetailHref, selectedIndex],
  );

  const closeDetail = useCallback(() => {
    setWorkOrderDetailId(null);
    setWorkSourcingDetailId(null);
    setDetailChatOpen(false);
    setDetailStatus(null);
    router.replace(buildAccountOrdersHref({ tabIndex: selectedIndex, detail: null, pathname }), {
      scroll: false,
    });
  }, [pathname, router, selectedIndex]);

  const onDetailChatOpenChange = useCallback(
    (open: boolean) => {
      setDetailChatOpen(open);
      if (workOrderDetailId) {
        replaceDetailHref({
          tabIndex: selectedIndex,
          kind: 'order',
          id: workOrderDetailId,
          chat: open,
          status: detailStatus,
        });
      } else if (workSourcingDetailId) {
        replaceDetailHref({
          tabIndex: selectedIndex,
          kind: 'sourcing',
          id: workSourcingDetailId,
          chat: open,
          status: detailStatus,
        });
      }
    },
    [detailStatus, replaceDetailHref, selectedIndex, workOrderDetailId, workSourcingDetailId],
  );

  /** После fetch detail — выровнять вкладку, если deep-link был без ?tab= / ?status=. */
  const onDetailStatusResolved = useCallback(
    (kind: 'order' | 'sourcing', id: string, status: string | null | undefined) => {
      const tabIndex = orderTabIndexFromQuery(accountOrdersTabForStatus(kind, status));
      setDetailStatus(status ?? null);
      if (tabIndex !== selectedIndex) setSelectedIndex(tabIndex);
      replaceDetailHref({
        tabIndex,
        kind,
        id,
        chat: detailChatOpen,
        status: status ?? null,
      });
    },
    [detailChatOpen, replaceDetailHref, selectedIndex],
  );

  const deepLinkKind = initialDetail?.kind ?? null;
  const deepLinkId = initialDetail?.id ?? null;
  const deepLinkChat = initialDetail?.chat ?? false;
  const deepLinkStatus = initialDetail?.status ?? null;

  useEffect(() => {
    if (!deepLinkKind || !deepLinkId) return;
    if (deepLinkKind === 'order') {
      setWorkSourcingDetailId(null);
      setWorkOrderDetailId(deepLinkId);
    } else {
      setWorkOrderDetailId(null);
      setWorkSourcingDetailId(deepLinkId);
    }
    setDetailStatus(deepLinkStatus);
    const key = `${deepLinkKind}:${deepLinkId}`;
    if (deepLinkChat && appliedDeepLinkChatRef.current !== key) {
      appliedDeepLinkChatRef.current = key;
      setDetailChatOpen(true);
    } else if (!deepLinkChat) {
      appliedDeepLinkChatRef.current = null;
    }
  }, [deepLinkKind, deepLinkId, deepLinkChat, deepLinkStatus]);

  useEffect(() => {
    void fetchWorkTabHasNotification().then(setWorkTabHasNotification);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicOrderProgram().then((cfg) => {
      if (!cancelled) setOrderProgram(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onWorkNotifications = (ev: Event) => {
      void fetchWorkTabHasNotification().then(setWorkTabHasNotification);
      const detail = (ev as CustomEvent<AccountWorkNotificationsDetail>).detail;
      if (!detail?.entityId) return;
      clearWorkEntityUnread(detail.chatSubject === 'sourcing' ? 'sourcing' : 'order', detail.entityId);
    };
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
  }, [clearWorkEntityUnread]);

  useEffect(() => {
    const refreshWorkFeed = () => {
      if (isInWorkTab) void loadWork({ background: true });
      if (isCompletedTab) void loadCompleted({ background: true });
      void fetchWorkTabHasNotification().then(setWorkTabHasNotification);
    };
    window.addEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, refreshWorkFeed);
    return () => window.removeEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, refreshWorkFeed);
  }, [isInWorkTab, isCompletedTab, loadWork, loadCompleted]);

  useEffect(() => {
    if (!isInWorkTab) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void loadWork({ background: true });
      void fetchWorkTabHasNotification().then(setWorkTabHasNotification);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isInWorkTab, loadWork]);

  useEffect(() => {
    if (!isInWorkTab) return;
    void fetchWorkTabHasNotification().then(setWorkTabHasNotification);
  }, [isInWorkTab, work.orders]);

  useEffect(() => {
    if (!isInWorkTab) return;
    void loadWork();
  }, [isInWorkTab, loadWork]);

  useEffect(() => {
    if (!isCompletedTab) return;
    void loadCompleted();
  }, [isCompletedTab, loadCompleted]);

  return (
    <div className={productListStyles.page}>
      <div className={productListStyles.toolbar}>
        <AccountProjectTabs
          projects={ORDER_TABS}
          selectedIndex={selectedIndex}
          onSelect={onSelectOrderTab}
          tabHasNotification={[false, workTabHasNotification, false]}
        />
      </div>

      <SourcingDraftBanner
        refreshKey={sourcingDraftRefreshKey}
        onContinue={() => {
          setSourcingResumeDraft(true);
          setSourcingModalOpen(true);
        }}
      />

      {isPreparationTab ? (
        <PrepTab
          orderProgram={orderProgram}
          onRequestSourcing={() => {
            setSourcingResumeDraft(false);
            setSourcingModalOpen(true);
          }}
          onSubmitted={() => onSelectOrderTab(1)}
        />
      ) : null}

      {isInWorkTab ? (
        <WorkTabFeed
          feed={work.feed}
          loading={work.loading}
          loadingMore={work.loadingMore}
          error={work.error}
          remainingCount={work.remainingCount}
          orderProgram={orderProgram}
          onLoadMore={() => void loadMoreWork()}
          onOpenOrder={openOrderDetail}
          onOpenSourcing={openSourcingDetail}
        />
      ) : null}

      {isCompletedTab ? (
        <CompletedTab
          feed={completed.feed}
          loading={completed.loading}
          loadingMore={completed.loadingMore}
          error={completed.error}
          remainingCount={completed.remainingCount}
          orderProgram={orderProgram}
          onLoadMore={() => void loadMoreCompleted()}
          onOpenOrder={openOrderDetail}
          onOpenSourcing={openSourcingDetail}
        />
      ) : null}

      <AccountOrderDetailModal
        orderId={workOrderDetailId}
        initialChatOpen={detailChatOpen}
        onClose={closeDetail}
        onChatOpenChange={onDetailChatOpenChange}
        onStatusResolved={(status) => {
          if (workOrderDetailId) onDetailStatusResolved('order', workOrderDetailId, status);
        }}
      />
      <AccountSourcingRequestDetailModal
        requestId={workSourcingDetailId}
        initialChatOpen={detailChatOpen}
        onClose={() => {
          closeDetail();
          if (isInWorkTab) void loadWork({ background: true });
        }}
        onChatOpenChange={onDetailChatOpenChange}
        onStatusResolved={(status) => {
          if (workSourcingDetailId) onDetailStatusResolved('sourcing', workSourcingDetailId, status);
        }}
      />
      <SourcingRequestModal
        open={sourcingModalOpen}
        resumeDraft={sourcingResumeDraft}
        onClose={() => {
          setSourcingModalOpen(false);
          setSourcingResumeDraft(false);
          setSourcingDraftRefreshKey((key) => key + 1);
        }}
        onSubmitted={() => {
          setSourcingModalOpen(false);
          setSourcingResumeDraft(false);
          setSourcingDraftRefreshKey((key) => key + 1);
          void loadWork();
          onSelectOrderTab(1);
        }}
      />

      {!isPreparationTab && !isInWorkTab && !isCompletedTab ? (
        <p className={styles.inWorkEmpty}>Раздел в разработке.</p>
      ) : null}
    </div>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountOrderDetailModal } from '@/components/AccountOrders/AccountOrderDetailModal';
import { AccountOrderWorkCard } from '@/components/AccountOrders/AccountOrderWorkCard';
import { AccountSourcingRequestDetailModal } from '@/components/AccountOrders/AccountSourcingRequestDetailModal';
import { SourcingRequestModal } from '@/components/SourcingRequest/SourcingRequestModal';
import { SourcingDraftBanner } from '@/components/SourcingRequest/SourcingDraftBanner';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { AccountDetailedProductRow } from '@/components/AccountProductList/AccountDetailedProductRow';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import {
  deleteOrderPreparationLine,
  fetchOrderPreparationDraft,
  patchOrderPreparationDraft,
  patchOrderPreparationLineQuantity,
  submitOrderPreparationDraft,
} from '@/lib/orderPreparation/clientApi';
import { mapOrderLineToAccountProduct } from '@/lib/orderPreparation/mapLineToAccountProduct';
import { takeSelectOnlyPreparationLineIds } from '@/lib/orderPreparation/selectOnlyFromProjectSession';
import type { OrderPreparationDraftApi, OrderPreparationLineApi } from '@/lib/orderPreparation/types';
import { ORDER_TABS, orderTabQueryParamForUrl, ACCOUNT_WORK_NOTIFICATIONS_EVENT, ACCOUNT_WORK_FEED_REFRESH_EVENT, type AccountWorkNotificationsDetail } from '@/lib/account/orders';
import {
  dismissSourcingWorkPrompt,
  isSourcingWorkPromptDismissed,
} from '@/lib/account/sourcingPromptDismiss';
import { fetchUserOrdersList } from '@/lib/userOrders/clientApi';
import {
  mapUserOrderToWorkCard,
  sortUserOrdersByUpdatedDesc,
} from '@/lib/userOrders/mapOrderToWorkCard';
import {
  fetchUserSourcingRequestsList,
} from '@/lib/userSourcingRequests/clientApi';
import {
  mapSourcingRequestToWorkCard,
  sortSourcingRequestsByUpdatedDesc,
} from '@/lib/userSourcingRequests/mapSourcingToWorkCard';
import type { UserOrderListItemApi } from '@/lib/userOrders/types';
import type { UserSourcingRequestListItemApi } from '@/lib/userSourcingRequests/types';
import {
  fetchPublicOrderProgram,
  formatDesignerOwnExpectedBonusLabel,
  type OrderProgramPublic,
} from '@/lib/orderProgram/publicOrderProgram';
import { AccordionBig } from './AccordionBig';
import { SubmitOrderConfirmationModal } from './components/SubmitOrderConfirmationModal';
import styles from './page.module.css';

async function fetchOrderChatUnreadWorkScope(): Promise<number> {
  const res = await fetch('/api/user/order-chat/me/unread-count?scope=work', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return 0;
  try {
    const j = (await res.json()) as { count?: unknown };
    return typeof j.count === 'number' && Number.isFinite(j.count) ? j.count : 0;
  } catch {
    return 0;
  }
}

function formatRub(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0, style: 'currency', currency: 'RUB' }).format(n);
}

function sumSelectedLines(lines: OrderPreparationLineApi[], selected: Set<string>): number {
  let s = 0;
  for (const line of lines) {
    if (!selected.has(line.id)) continue;
    if (line.lineTotalRub != null && Number.isFinite(line.lineTotalRub)) {
      s += line.lineTotalRub;
      continue;
    }
    if (line.priceRubPerUnit != null && line.priceRubPerUnit > 0) {
      s += line.priceRubPerUnit * line.quantity;
    }
  }
  return Math.round(s * 100) / 100;
}

/** Сумма количеств по выбранным строкам (не число позиций/SKU). */
function sumSelectedUnits(lines: OrderPreparationLineApi[], selected: Set<string>): number {
  let s = 0;
  for (const line of lines) {
    if (!selected.has(line.id)) continue;
    const q = Number(line.quantity);
    if (Number.isFinite(q) && q > 0) s += q;
  }
  return Math.round(s * 1000) / 1000;
}

function selectedIdsForDraftLines(lines: OrderPreparationLineApi[]): Set<string> {
  const only = takeSelectOnlyPreparationLineIds();
  if (only?.length) {
    const allowed = new Set(lines.map((l) => l.id));
    const filtered = only.filter((id) => allowed.has(id));
    if (filtered.length > 0) return new Set(filtered);
  }
  return new Set(lines.map((l) => l.id));
}

type WorkFeedItem =
  | { kind: 'order'; order: UserOrderListItemApi }
  | { kind: 'sourcing'; sourcing: UserSourcingRequestListItemApi };

/** Дата активности для сортировки: последнее КП или дата заявки/заказа. */
function workFeedActivityIso(entry: WorkFeedItem): string {
  if (entry.kind === 'order') {
    const kpAt = entry.order.commercialProposalPublishedAt?.trim();
    return kpAt || entry.order.createdAt;
  }
  const kpAt = entry.sourcing.commercialProposalPublishedAt?.trim();
  return kpAt || entry.sourcing.createdAt;
}

function workFeedTimestamp(entry: WorkFeedItem): number {
  const ts = Date.parse(workFeedActivityIso(entry));
  return Number.isFinite(ts) ? ts : 0;
}

function buildWorkFeed(
  orders: UserOrderListItemApi[],
  sourcing: UserSourcingRequestListItemApi[],
): WorkFeedItem[] {
  const items: WorkFeedItem[] = [
    ...orders.map((order) => ({ kind: 'order' as const, order })),
    ...sourcing.map((request) => ({ kind: 'sourcing' as const, sourcing: request })),
  ];
  return items.sort((a, b) => workFeedTimestamp(b) - workFeedTimestamp(a));
}

export function AccountOrdersPageClient({ initialTabIndex = 0 }: { initialTabIndex?: number } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = useState(initialTabIndex);

  useEffect(() => {
    setSelectedIndex(initialTabIndex);
  }, [initialTabIndex]);

  const onSelectOrderTab = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      const q = orderTabQueryParamForUrl(index);
      if (q == null) {
        router.replace(pathname, { scroll: false });
      } else {
        router.replace(`${pathname}?tab=${encodeURIComponent(q)}`, { scroll: false });
      }
    },
    [pathname, router],
  );
  const [selectionMode, setSelectionMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<OrderPreparationDraftApi | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  /** Подсветка пустых ФИО/адреса при нажатии «Отправить на согласование» до открытия модалки. */
  const [submitGateHighlight, setSubmitGateHighlight] = useState<{ name: boolean; address: boolean }>({
    name: false,
    address: false,
  });
  const [inWorkOrders, setInWorkOrders] = useState<UserOrderListItemApi[]>([]);
  const [inWorkSourcing, setInWorkSourcing] = useState<UserSourcingRequestListItemApi[]>([]);
  const [inWorkLoading, setInWorkLoading] = useState(false);
  const [inWorkError, setInWorkError] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<UserOrderListItemApi[]>([]);
  const [completedSourcing, setCompletedSourcing] = useState<UserSourcingRequestListItemApi[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedError, setCompletedError] = useState<string | null>(null);
  const [workOrderDetailId, setWorkOrderDetailId] = useState<string | null>(null);
  const [workSourcingDetailId, setWorkSourcingDetailId] = useState<string | null>(null);
  const [sourcingModalOpen, setSourcingModalOpen] = useState(false);
  const [sourcingResumeDraft, setSourcingResumeDraft] = useState(false);
  const [sourcingDraftRefreshKey, setSourcingDraftRefreshKey] = useState(0);
  const [sourcingPromptVisible, setSourcingPromptVisible] = useState<boolean | null>(null);
  const [workTabUnread, setWorkTabUnread] = useState(0);
  const [orderProgram, setOrderProgram] = useState<OrderProgramPublic | null>(null);

  const isPreparationTab = selectedIndex === 0;
  const isInWorkTab = selectedIndex === 1;
  const isCompletedTab = selectedIndex === 2;

  const loadInWorkOrders = useCallback(async () => {
    setInWorkLoading(true);
    setInWorkError(null);
    try {
      const [ordersRes, sourcingRes] = await Promise.all([
        fetchUserOrdersList(1, 50, { scope: 'work' }),
        fetchUserSourcingRequestsList(1, 50, { scope: 'work' }),
      ]);
      setInWorkOrders(sortUserOrdersByUpdatedDesc(ordersRes.items));
      setInWorkSourcing(sortSourcingRequestsByUpdatedDesc(sourcingRes.items));
    } catch (e) {
      setInWorkError(e instanceof Error ? e.message : 'Не удалось загрузить заказы');
      setInWorkOrders([]);
      setInWorkSourcing([]);
    } finally {
      setInWorkLoading(false);
    }
  }, []);

  const workFeed = useMemo(
    () => buildWorkFeed(inWorkOrders, inWorkSourcing),
    [inWorkOrders, inWorkSourcing],
  );

  const loadCompletedOrders = useCallback(async () => {
    setCompletedLoading(true);
    setCompletedError(null);
    try {
      const [ordersRes, sourcingRes] = await Promise.all([
        fetchUserOrdersList(1, 50, { scope: 'completed' }),
        fetchUserSourcingRequestsList(1, 50, { scope: 'completed' }),
      ]);
      setCompletedOrders(sortUserOrdersByUpdatedDesc(ordersRes.items));
      setCompletedSourcing(sortSourcingRequestsByUpdatedDesc(sourcingRes.items));
    } catch (e) {
      setCompletedError(e instanceof Error ? e.message : 'Не удалось загрузить заказы');
      setCompletedOrders([]);
      setCompletedSourcing([]);
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  const completedFeed = useMemo(
    () => buildWorkFeed(completedOrders, completedSourcing),
    [completedOrders, completedSourcing],
  );

  const refreshDraft = useCallback(async () => {
    setDraftError(null);
    try {
      const d = await fetchOrderPreparationDraft();
      setDraft(d);
      setCustomerName(d.customerName ?? '');
      setDeliveryAddress(d.deliveryAddress ?? '');
      setOrderComment(d.comment ?? '');
      setSelectedIds(selectedIdsForDraftLines(d.lines));
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Не удалось загрузить заказ');
      setDraft(null);
    }
  }, []);

  useEffect(() => {
    setSourcingPromptVisible(!isSourcingWorkPromptDismissed());
  }, []);

  useEffect(() => {
    if (!isPreparationTab) return;
    let cancelled = false;
    setDraftLoading(true);
    void (async () => {
      try {
        const d = await fetchOrderPreparationDraft();
        if (cancelled) return;
        setDraft(d);
        setCustomerName(d.customerName ?? '');
        setDeliveryAddress(d.deliveryAddress ?? '');
        setOrderComment(d.comment ?? '');
        setSelectedIds(selectedIdsForDraftLines(d.lines));
      } catch (e) {
        if (!cancelled) setDraftError(e instanceof Error ? e.message : 'Не удалось загрузить заказ');
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPreparationTab]);

  useEffect(() => {
    void fetchOrderChatUnreadWorkScope().then(setWorkTabUnread);
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
      void fetchOrderChatUnreadWorkScope().then(setWorkTabUnread);
      const detail = (ev as CustomEvent<AccountWorkNotificationsDetail>).detail;
      if (!detail?.entityId) return;
      if (detail.chatSubject === 'sourcing') {
        setInWorkSourcing((prev) =>
          prev.map((r) =>
            r.id === detail.entityId
              ? { ...r, unreadStaffChatCount: 0, hasUnseenCommercialProposal: false }
              : r,
          ),
        );
      } else {
        setInWorkOrders((prev) =>
          prev.map((o) =>
            o.id === detail.entityId
              ? { ...o, unreadStaffChatCount: 0, hasUnseenCommercialProposal: false }
              : o,
          ),
        );
      }
    };
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
  }, []);

  useEffect(() => {
    const refreshWorkFeed = () => {
      if (isInWorkTab) void loadInWorkOrders();
      if (isCompletedTab) void loadCompletedOrders();
      void fetchOrderChatUnreadWorkScope().then(setWorkTabUnread);
    };
    window.addEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, refreshWorkFeed);
    return () => window.removeEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, refreshWorkFeed);
  }, [isInWorkTab, isCompletedTab, loadInWorkOrders, loadCompletedOrders]);

  useEffect(() => {
    if (!isInWorkTab) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void loadInWorkOrders();
      void fetchOrderChatUnreadWorkScope().then(setWorkTabUnread);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isInWorkTab, loadInWorkOrders]);

  useEffect(() => {
    if (!isInWorkTab) return;
    void fetchOrderChatUnreadWorkScope().then(setWorkTabUnread);
  }, [isInWorkTab, inWorkOrders]);

  useEffect(() => {
    if (!isInWorkTab) return;
    void loadInWorkOrders();
  }, [isInWorkTab, loadInWorkOrders]);

  useEffect(() => {
    if (!isCompletedTab) return;
    void loadCompletedOrders();
  }, [isCompletedTab, loadCompletedOrders]);

  useEffect(() => {
    if (isPreparationTab) setWorkOrderDetailId(null);
  }, [isPreparationTab]);

  useEffect(() => {
    if (!isPreparationTab || !draft?.orderId) return;
    const t = window.setTimeout(() => {
      void patchOrderPreparationDraft({
        customerName: customerName.trim() || null,
        deliveryAddress: deliveryAddress.trim() || null,
        comment: orderComment.trim() || null,
      }).catch(() => {
        /* debounce: ignore transient errors */
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [isPreparationTab, draft?.orderId, customerName, deliveryAddress, orderComment]);

  const selectedUnitsTotal = useMemo(
    () => (draft?.lines.length ? sumSelectedUnits(draft.lines, selectedIds) : 0),
    [draft?.lines, selectedIds],
  );
  const selectedPreviewLines = useMemo(
    () => (draft?.lines ?? []).filter((l) => selectedIds.has(l.id)),
    [draft?.lines, selectedIds],
  );
  const hasOrderLines = (draft?.lines.length ?? 0) > 0;
  const products = useMemo(
    () => (draft?.lines ?? []).map((line) => mapOrderLineToAccountProduct(line)),
    [draft?.lines],
  );

  const selectedTotalRub = useMemo(() => {
    if (!draft?.lines.length) return 0;
    return sumSelectedLines(draft.lines, selectedIds);
  }, [draft?.lines, selectedIds]);

  const preparationBonusLabel = useMemo(
    () => formatDesignerOwnExpectedBonusLabel(selectedTotalRub, orderProgram),
    [selectedTotalRub, orderProgram],
  );

  const onEnterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set(draft?.lines.map((l) => l.id) ?? []));
  };

  const onCancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const onProductCheckChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const onQuantityDelta = async (lineId: string, delta: number) => {
    const line = draft?.lines.find((l) => l.id === lineId);
    if (!line) return;
    if (delta < 0 && line.quantity <= 1) {
      if (!window.confirm('Удалить эту позицию из заказа?')) return;
      void removeLinesByIds([lineId]);
      return;
    }
    const nextQty = Math.max(1, line.quantity + delta);
    if (nextQty === line.quantity) return;
    try {
      const d = await patchOrderPreparationLineQuantity(lineId, nextQty);
      setDraft(d);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Не удалось обновить количество');
    }
  };

  const removeLinesByIds = useCallback(async (ids: string[]) => {
    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (uniq.length === 0) return;
    setDraftError(null);
    try {
      let nextDraft: OrderPreparationDraftApi | null = null;
      for (const id of uniq) {
        nextDraft = await deleteOrderPreparationLine(id);
      }
      if (nextDraft) {
        setDraft(nextDraft);
        setSelectedIds(new Set(nextDraft.lines.map((l) => l.id)));
        setSelectionMode(false);
      }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Не удалось удалить позицию');
    }
  }, []);

  const confirmRemoveSelectedLines = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok =
      ids.length === 1
        ? window.confirm('Удалить эту позицию из заказа?')
        : window.confirm(`Удалить ${ids.length} позиций из заказа?`);
    if (!ok) return;
    void removeLinesByIds(ids);
  };

  const confirmRemoveSingleLine = (lineId: string) => {
    if (!window.confirm('Удалить эту позицию из заказа?')) return;
    void removeLinesByIds([lineId]);
  };

  const openSubmitModal = () => {
    if (selectedPreviewLines.length < 1 || !draft?.lines.length) return;
    const name = customerName.trim();
    const addr = deliveryAddress.trim();
    if (!name || !addr) {
      setSubmitGateHighlight({ name: !name, address: !addr });
      const focusId = !name ? 'order-customer-name' : 'order-delivery-address';
      requestAnimationFrame(() => {
        document.getElementById(focusId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById(focusId)?.focus({ preventScroll: true });
      });
      return;
    }
    setSubmitGateHighlight({ name: false, address: false });
    setSubmitModalOpen(true);
  };

  const confirmSubmit = async () => {
    const lineIds = Array.from(selectedIds);
    if (lineIds.length < 1) {
      setDraftError('Выберите хотя бы одну позицию');
      return;
    }
    const name = customerName.trim();
    const addr = deliveryAddress.trim();
    if (!name) {
      setDraftError('Укажите ФИО заказчика');
      return;
    }
    if (!addr) {
      setDraftError('Укажите адрес доставки');
      return;
    }
    setSubmitLoading(true);
    setDraftError(null);
    try {
      await patchOrderPreparationDraft({
        customerName: name || null,
        deliveryAddress: addr || null,
        comment: orderComment.trim() || null,
      });
      await submitOrderPreparationDraft({ lineIds });
      setSubmitModalOpen(false);
      await refreshDraft();
      void loadInWorkOrders();
      void loadCompletedOrders();
      onSelectOrderTab(1);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Не удалось отправить заказ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalLabel = selectedTotalRub > 0 ? `~${formatRub(selectedTotalRub)}` : '—';

  return (
    <div className={productListStyles.page}>
      <div className={productListStyles.toolbar}>
        <AccountProjectTabs
          projects={ORDER_TABS}
          selectedIndex={selectedIndex}
          onSelect={onSelectOrderTab}
          tabHasNotification={[false, workTabUnread > 0, false]}
        />
      </div>

      <SourcingDraftBanner
        refreshKey={sourcingDraftRefreshKey}
        onContinue={() => {
          setSourcingResumeDraft(true);
          setSourcingModalOpen(true);
        }}
      />

      {isPreparationTab && sourcingPromptVisible ? (
        <div className={styles.ordersToolbarOuter}>
          <div className={styles.sourcingWorkPrompt}>
            <button
              type="button"
              className={styles.sourcingWorkPromptClose}
              onClick={() => {
                dismissSourcingWorkPrompt();
                setSourcingPromptVisible(false);
              }}
              aria-label="Скрыть подсказку"
            >
              ×
            </button>
            <p className={styles.sourcingWorkPromptText}>
              Не нашли нужную модель в каталоге? Опишите задачу — подберём по вашему ТЗ.
            </p>
            <Button type="button" variant="primary" onClick={() => {
              setSourcingResumeDraft(false);
              setSourcingModalOpen(true);
            }}>
              Заказать подбор
            </Button>
          </div>
        </div>
      ) : null}

      {isPreparationTab && hasOrderLines ? (
        <div className={styles.ordersToolbarOuter}>
          {selectionMode ? (
            <div className={styles.ordersSelectionToolbar}>
              <button type="button" className={productListStyles.selectAllButton} onClick={onCancelSelectionMode}>
                Отменить
              </button>
              <button
                type="button"
                className={productListStyles.selectAllButton}
                disabled={selectedIds.size === 0}
                onClick={confirmRemoveSelectedLines}
              >
                <img src="/icons/delete.svg" alt="" width={20} height={20} className={productListStyles.iconBlack} />
                Удалить
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
            </div>
          ) : (
            <button type="button" className={productListStyles.selectAllButton} onClick={onEnterSelectionMode}>
              Выбрать все
            </button>
          )}
        </div>
      ) : null}

      {isPreparationTab ? (
        <div className={styles.ordersMainContent}>
          <div className={`${productListStyles.productCardDetailedWrapper} ${styles.productCardDetailedWrapperOrders}`}>
            {draftError ? <p className={styles.orderPrepError}>{draftError}</p> : null}
            {draftLoading ? (
              <div className={styles.ordersPrepSkeletonList} aria-busy="true" aria-label="Загрузка">
                {[0, 1, 2].map((k) => (
                  <div key={k} className={styles.skeletonPrepRow}>
                    <div className={`${styles.skeletonPrepThumb} ${styles.skeletonShimmer}`} />
                    <div className={styles.skeletonPrepLines}>
                      <div className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`} style={{ width: '58%' }} />
                      <div className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`} style={{ width: '36%' }} />
                      <div className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`} style={{ width: '24%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {!draftLoading && products.length === 0 ? (
              <>
                <p className={styles.orderPrepMuted}>В заказе пока нет товаров.</p>
                <div className={styles.emptyOrderCatalog}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.openCatalogButton}
                    onClick={() => window.open('/catalog', '_blank', 'noopener,noreferrer')}
                  >
                    Открыть каталог
                  </Button>
                </div>
              </>
            ) : null}
            {!draftLoading
              ? products.map((product) => {
                  const line = draft?.lines.find((l) => l.id === product.id);
                  return (
                    <AccountDetailedProductRow
                      key={product.id}
                      product={product}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(product.id)}
                      onSelectedChange={(checked) => onProductCheckChange(product.id, checked)}
                      imageSrc={line?.imageUrl ?? undefined}
                      nameHref={line?.productSlug ? `/product/${line.productSlug}` : null}
                      productPagePath={line?.productSlug ? `/product/${line.productSlug}` : null}
                      quantity={line?.quantity ?? 1}
                      unit={line?.unit ?? 'шт'}
                      onQuantityDelta={
                        line ? (delta) => void onQuantityDelta(line.id, delta) : undefined
                      }
                      onRemoveFromProject={line ? () => confirmRemoveSingleLine(line.id) : undefined}
                      removeMenuItemText="Удалить из заказа"
                    />
                  );
                })
              : null}
          </div>

          <div className={styles.ordersSidebar}>
            {draftLoading ? (
              <>
                <div className={styles.skeletonSidebarBlock} aria-hidden>
                  <div className={`${styles.skeletonSidebarTitle} ${styles.skeletonShimmer}`} />
                  <div className={`${styles.skeletonSidebarField} ${styles.skeletonShimmer}`} />
                  <div className={`${styles.skeletonSidebarField} ${styles.skeletonShimmer}`} />
                  <div
                    className={`${styles.skeletonSidebarField} ${styles.skeletonShimmer}`}
                    style={{ minHeight: 88 }}
                  />
                </div>
                <div className={styles.skeletonSummaryCard} aria-hidden>
                  <div className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`} style={{ width: '32%' }} />
                  <div
                    className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`}
                    style={{ width: '48%', height: 22 }}
                  />
                  <div
                    className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`}
                    style={{ width: '100%', height: 44, borderRadius: 8 }}
                  />
                </div>
                <AccordionBig
                  title="Итого"
                  defaultOpen
                  className={styles.orderSummaryAccordionMobile}
                  panelClassName={styles.orderSummaryAccordionPanelMobile}
                >
                  <div className={styles.summaryTop}>
                    <div className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`} style={{ width: '72%' }} />
                    <div
                      className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`}
                      style={{ width: '40%', height: 26, marginTop: 8 }}
                    />
                  </div>
                  <div className={styles.summaryBottom}>
                    <div
                      className={`${styles.skeletonPrepLine} ${styles.skeletonShimmer}`}
                      style={{ width: '100%', height: 48, borderRadius: 8, marginTop: 8 }}
                    />
                  </div>
                </AccordionBig>
              </>
            ) : null}
            {!draftLoading ? (
              <>
            <AccordionBig title="Детали заказа" defaultOpen>
              <div className={styles.orderDetailsFields}>
                <TextField
                  label="ФИО заказчика"
                  id="order-customer-name"
                  value={customerName}
                  error={submitGateHighlight.name}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSubmitGateHighlight((h) => ({ ...h, name: false }));
                  }}
                  autoComplete="name"
                />
                <TextField
                  label="Адрес доставки"
                  id="order-delivery-address"
                  value={deliveryAddress}
                  error={submitGateHighlight.address}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setSubmitGateHighlight((h) => ({ ...h, address: false }));
                  }}
                  autoComplete="street-address"
                />
                <div className={textFieldStyles.field}>
                  <label className={textFieldStyles.label} htmlFor="order-comment">
                    <span className={textFieldStyles.labelText}>Комментарий к заказу</span>
                    <textarea
                      id="order-comment"
                      className={`${textFieldStyles.input} ${styles.orderCommentTextarea}`}
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      rows={5}
                    />
                  </label>
                </div>
              </div>
            </AccordionBig>

            <div className={styles.orderSummaryCard}>
              <div className={styles.summaryTop}>
                <div className={styles.summaryTitle}>Итого</div>
                <div className={styles.summarySelected}>
                  Вы выбрали: {selectedUnitsTotal} шт.
                </div>
                <div className={styles.summaryPrice}>{totalLabel}</div>
                <div className={styles.summaryEta}>
                  <img src="/icons/group.svg" alt="" width={16} height={16} className={styles.summaryEtaIcon} aria-hidden />
                  <span>Ориентировочная поставка: 65-80 дней</span>
                </div>
              </div>

              <div className={styles.summaryBottom}>
                <div className={styles.bonusRow}>
                  <div className={styles.bonusLeft}>
                    <img src="/icons/wallet-add.svg" alt="" width={16} height={16} aria-hidden />
                    <span className={styles.bonusText}>Ожидаемый бонус: {preparationBonusLabel}</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  disabled={selectedPreviewLines.length < 1 || draftLoading}
                  onClick={openSubmitModal}
                >
                  Отправить на согласование
                </Button>
                <div className={styles.summaryHint}>
                  После запуска оформления менеджер свяжется с вами для подтверждения деталей поставки
                </div>
              </div>
            </div>

            <AccordionBig
              title="Итого"
              defaultOpen
              className={styles.orderSummaryAccordionMobile}
              panelClassName={styles.orderSummaryAccordionPanelMobile}
            >
              <div className={styles.summaryTop}>
                <div className={styles.summarySelected}>
                  Вы выбрали: {selectedUnitsTotal} шт.
                </div>
                <div className={styles.summaryPrice}>{totalLabel}</div>
                <div className={styles.summaryEta}>
                  <img src="/icons/group.svg" alt="" width={16} height={16} className={styles.summaryEtaIcon} aria-hidden />
                  <span>Ориентировочная поставка: 65-80 дней</span>
                </div>
              </div>

              <div className={styles.summaryBottom}>
                <div className={styles.bonusRow}>
                  <div className={styles.bonusLeft}>
                    <img src="/icons/wallet-add.svg" alt="" width={16} height={16} aria-hidden />
                    <span className={styles.bonusText}>Ожидаемый бонус: {preparationBonusLabel}</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  disabled={selectedPreviewLines.length < 1 || draftLoading}
                  onClick={openSubmitModal}
                >
                  Отправить на согласование
                </Button>
                <div className={styles.summaryHint}>
                  После запуска оформления менеджер свяжется с вами для подтверждения деталей поставки
                </div>
              </div>
            </AccordionBig>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <SubmitOrderConfirmationModal
        open={submitModalOpen}
        onClose={() => !submitLoading && setSubmitModalOpen(false)}
        onConfirm={confirmSubmit}
        loading={submitLoading}
        selectedUnitsTotal={selectedUnitsTotal}
        totalLabel={totalLabel}
        previewLines={selectedPreviewLines}
        orderComment={orderComment}
      />

      {isInWorkTab ? (
        <div className={styles.inWorkList}>
          {inWorkError ? <p className={styles.orderPrepError}>{inWorkError}</p> : null}
          {inWorkLoading ? (
            <div className={styles.ordersInWorkSkeleton} aria-busy="true" aria-label="Загрузка">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className={styles.orderWrapperSkeleton}>
                  <div className={styles.skeletonInWorkCard}>
                    <div className={styles.skeletonInWorkTop}>
                      <div className={styles.skeletonInWorkLines}>
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '38%', height: 18 }}
                        />
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '52%' }}
                        />
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '72%' }}
                        />
                      </div>
                      <div className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`} style={{ width: 20, height: 20 }} />
                    </div>
                    <div className={styles.skeletonInWorkDots}>
                      <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
                      <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
                    </div>
                  </div>
                  <div className={styles.skeletonInWorkCta}>
                    <div className={`${styles.skeletonInWorkCtaBtn} ${styles.skeletonShimmer}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!inWorkLoading && !inWorkError && workFeed.length === 0 ? (
            <p className={styles.inWorkEmpty}>Нет заказов и заявок в работе.</p>
          ) : null}
          {!inWorkLoading
            ? workFeed.map((entry) =>
                entry.kind === 'order' ? (
                  <AccountOrderWorkCard
                    key={`order-${entry.order.id}`}
                    {...mapUserOrderToWorkCard(entry.order, {
                      onOpenDetails: () => setWorkOrderDetailId(entry.order.id),
                      orderProgram,
                    })}
                  />
                ) : (
                  <AccountOrderWorkCard
                    key={`sourcing-${entry.sourcing.id}`}
                    {...mapSourcingRequestToWorkCard(entry.sourcing, {
                      onOpenDetails: () => setWorkSourcingDetailId(entry.sourcing.id),
                      orderProgram,
                    })}
                  />
                ),
              )
            : null}
        </div>
      ) : null}

      {isCompletedTab ? (
        <div className={styles.inWorkList}>
          {completedError ? <p className={styles.orderPrepError}>{completedError}</p> : null}
          {completedLoading ? (
            <div className={styles.ordersInWorkSkeleton} aria-busy="true" aria-label="Загрузка">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className={styles.orderWrapperSkeleton}>
                  <div className={styles.skeletonInWorkCard}>
                    <div className={styles.skeletonInWorkTop}>
                      <div className={styles.skeletonInWorkLines}>
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '38%', height: 18 }}
                        />
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '52%' }}
                        />
                        <div
                          className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                          style={{ width: '72%' }}
                        />
                      </div>
                      <div className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`} style={{ width: 20, height: 20 }} />
                    </div>
                    <div className={styles.skeletonInWorkDots}>
                      <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
                      <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
                    </div>
                  </div>
                  <div className={styles.skeletonInWorkCta}>
                    <div className={`${styles.skeletonInWorkCtaBtn} ${styles.skeletonShimmer}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!completedLoading && !completedError && completedFeed.length === 0 ? (
            <p className={styles.inWorkEmpty}>Нет завершённых заказов и заявок.</p>
          ) : null}
          {!completedLoading
            ? completedFeed.map((entry) =>
                entry.kind === 'order' ? (
                  <AccountOrderWorkCard
                    key={`order-${entry.order.id}`}
                    {...mapUserOrderToWorkCard(entry.order, {
                      onOpenDetails: () => setWorkOrderDetailId(entry.order.id),
                      orderProgram,
                    })}
                  />
                ) : (
                  <AccountOrderWorkCard
                    key={`sourcing-${entry.sourcing.id}`}
                    {...mapSourcingRequestToWorkCard(entry.sourcing, {
                      onOpenDetails: () => setWorkSourcingDetailId(entry.sourcing.id),
                      orderProgram,
                    })}
                  />
                ),
              )
            : null}
        </div>
      ) : null}

      <AccountOrderDetailModal orderId={workOrderDetailId} onClose={() => setWorkOrderDetailId(null)} />
      <AccountSourcingRequestDetailModal
        requestId={workSourcingDetailId}
        onClose={() => {
          setWorkSourcingDetailId(null);
          if (isInWorkTab) void loadInWorkOrders();
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
          void loadInWorkOrders();
          onSelectOrderTab(1);
        }}
      />

      {isPreparationTab ? null : !isInWorkTab && !isCompletedTab ? (
        <p className={styles.inWorkEmpty}>Раздел в разработке.</p>
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import { AccordionBig } from '@/app/(site)/(account)/account/orders/AccordionBig';
import {
  dispatchAccountWorkNotificationsEvent,
  ACCOUNT_WORK_NOTIFICATIONS_EVENT,
  type AccountWorkNotificationsDetail,
} from '@/lib/account/orders';
/** Общий табличный chrome ЛК (Команда / Доход / модалка заказа). */
import report from '@/components/styles/PartnerReportTable.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useOrderKpResponse } from '@/hooks/useOrderKpResponse';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { orderStatusLabel } from '@/lib/orders/orderStatus';
import { formatKpGrossTotalsLabel, kpGrossTotals } from '@/lib/commercialProposal/kpGrossDimensions';
import { KpGrossDisplay } from '@/components/commercialProposal/KpGrossDisplay';
import { kpLineTotalRub, kpLineUnitAfterDiscount, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import type { CommercialProposalLineApi } from '@/lib/commercialProposal/types';
import { fetchUserOrder, ackUserOrderCommercialProposalSeen } from '@/lib/userOrders/clientApi';
import { downloadCommercialProposalPdf } from '@/lib/commercialProposal/exportCommercialProposalPdf';
import { cacheOrderCommercialProposal } from '@/lib/commercialProposal/kpProposalCache';
import { kpDecisionNotice } from '@/lib/userOrders/orderNextStepHint';
import type { UserOrderDetailApi } from '@/lib/userOrders/types';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import { AccountGalleryThumb } from '@/components/AccountOrders/AccountGalleryThumb';
import { OrderKpAcceptModal } from './OrderKpAcceptModal';
import { OrderKpActionFooter } from './OrderKpActionFooter';
import styles from './AccountOrderDetailModal.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function kpDeliveryEtaLabel(lines: CommercialProposalLineApi[]): string | null {
  const etas = Array.from(
    new Set(
      lines
        .map((l) => (typeof l.deliveryEta === 'string' ? l.deliveryEta.trim() : ''))
        .filter(Boolean),
    ),
  );
  return etas.length ? etas.join(' · ') : null;
}


function parseSnapshot(row: { snapshot?: unknown }): Record<string, unknown> | null {
  const s = row.snapshot;
  if (s && typeof s === 'object' && !Array.isArray(s)) return s as Record<string, unknown>;
  return null;
}

function itemTitle(row: UserOrderDetailApi['items'][number]): string {
  const s = parseSnapshot(row);
  const n = s?.productName;
  if (typeof n === 'string' && n.trim()) return n.trim();
  return row.product?.name?.trim() || '—';
}

function itemImageUrl(row: UserOrderDetailApi['items'][number]): string | null {
  const s = parseSnapshot(row);
  const u = s?.imageUrl;
  if (typeof u === 'string' && u.trim()) return u.trim();
  const first = row.product?.images?.[0]?.url;
  return first?.trim() || null;
}

function formatRub(amount: string | number, currency = 'RUB'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: currency || 'RUB',
  }).format(n);
}

function kpLineImageUrl(line: CommercialProposalLineApi): string | null {
  const s = line.snapshot && typeof line.snapshot === 'object' ? (line.snapshot as Record<string, unknown>) : null;
  const u = s?.imageUrl;
  if (typeof u === 'string' && u.trim()) return u.trim();
  return null;
}

function formatOrderCreatedTitle(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
    return `Заказ от ${datePart}`;
  } catch {
    return 'Заказ';
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AccountOrderItemsTable({
  order,
  positionHeader,
  footerMuted = false,
}: {
  order: UserOrderDetailApi;
  positionHeader: string;
  /** При наличии КП — исходная сумма заявки вторична */
  footerMuted?: boolean;
}) {
  const galleryUrls = useMemo(
    () => order.items.map((row) => itemImageUrl(row)).filter((url): url is string => Boolean(url)),
    [order.items],
  );

  if (order.items.length === 0) {
    return <p className={styles.muted}>Нет позиций</p>;
  }
  return (
    <div className={`${report.tableFrame} ${styles.orderTableFrame}`}>
      <table className={report.table}>
        <thead>
          <tr>
            <th scope="col" className={report.thLeftTight} style={{ width: 116 }} aria-hidden />
            <th scope="col" className={report.thDesigner}>
              {positionHeader}
            </th>
            <th scope="col" className={report.thCenterLevel}>
              Кол-во
            </th>
            <th scope="col" className={report.thRightTightFirst}>
              Цена
            </th>
            <th scope="col" className={report.thRightTight}>
              Сумма
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((row) => {
            const snap = parseSnapshot(row);
            const meta = orderItemSnapshotMetaRows(snap);
            const unit = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
            const lineTotal = Number.isFinite(unit) ? unit * row.quantity : NaN;
            const img = itemImageUrl(row);
            return (
              <tr key={row.id}>
                <td className={`${report.tdLeftTight} ${styles.tdTopAlign}`}>
                  <div className={styles.thumbWrap}>
                    {img ? (
                      <AccountGalleryThumb
                        src={img}
                        galleryUrls={galleryUrls}
                        className={styles.thumb}
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className={styles.thumbPh} aria-hidden />
                    )}
                  </div>
                </td>
                <td className={`${report.tdDesigner} ${styles.tdTopAlign}`}>
                  <div className={styles.lineName}>{itemTitle(row)}</div>
                  {row.product?.brand?.name ? <div className={styles.brandNote}>{row.product.brand.name}</div> : null}
                  {meta.length > 0 ? (
                    <ul className={styles.metaList}>
                      {meta.map((m, i) => (
                        <li key={i}>
                          {m.label}: {m.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </td>
                <td className={report.tdCenterLevel}>
                  {row.quantity} шт.
                </td>
                <td className={report.tdRightTightFirst}>{formatRub(row.price, order.currency)}</td>
                <td className={report.tdRightTight}>
                  {Number.isFinite(lineTotal) ? formatRub(lineTotal, order.currency) : '—'}
                </td>
              </tr>
            );
          })}
          <tr className={styles.tableFooterRow}>
            <td
              colSpan={4}
              className={`${report.tdRightTightFirst}${footerMuted ? ` ${styles.tableFooterMuted}` : ''}`}
            >
              Ожидаемая сумма заказа
            </td>
            <td
              className={`${report.tdRightTight} ${styles.tableFooterValue}${footerMuted ? ` ${styles.tableFooterMuted}` : ''}`}
            >
              {formatRub(order.totalAmount, order.currency)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AccountKpLinesTable({ order, lines }: { order: UserOrderDetailApi; lines: CommercialProposalLineApi[] }) {
  const totals = useMemo(() => kpOfferAggregates(lines), [lines]);
  const grossTotals = useMemo(() => kpGrossTotals(lines), [lines]);
  const galleryUrls = useMemo(
    () => lines.map((line) => kpLineImageUrl(line)).filter((url): url is string => Boolean(url)),
    [lines],
  );
  const avgDiscountPctLabel = `${Math.round(totals.avgDiscountPercent * 10) / 10}%`;
  const hasDiscount = totals.oldTotalRub !== totals.newTotalRub || totals.avgDiscountPercent > 0;

  return (
    <div className={`${report.tableFrame} ${styles.orderTableFrame}`}>
      <table className={report.table}>
        <thead>
          <tr>
            <th scope="col" className={report.thLeftTight} style={{ width: 116 }} aria-hidden />
            <th scope="col" className={report.thDesigner}>
              Позиция
            </th>
            <th scope="col" className={report.thCenterLevel}>
              Кол-во
            </th>
            <th scope="col" className={report.thRightTightFirst}>
              Цена
            </th>
            <th scope="col" className={report.thRightTight}>
              Сумма
            </th>
            <th scope="col" className={styles.kpGrossColHead}>
              Брутто
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const snap =
              line.snapshot && typeof line.snapshot === 'object' ? (line.snapshot as Record<string, unknown>) : null;
            const name =
              snap && typeof snap.productName === 'string' && snap.productName.trim() ? snap.productName.trim() : '—';
            const meta = orderItemSnapshotMetaRows(snap);
            const lineTotal = kpLineTotalRub(line);
            const img = kpLineImageUrl(line);
            const disc = line.discountPercent != null && Number.isFinite(line.discountPercent) ? line.discountPercent : 0;
            const hasDisc = disc > 0;
            const newUnit = kpLineUnitAfterDiscount(line);
            return (
              <tr key={line.id}>
                <td className={`${report.tdLeftTight} ${styles.tdTopAlign}`}>
                  <div className={styles.thumbWrap}>
                    {img ? (
                      <AccountGalleryThumb
                        src={img}
                        galleryUrls={galleryUrls}
                        className={styles.thumb}
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className={styles.thumbPh} aria-hidden />
                    )}
                  </div>
                </td>
                <td className={report.tdDesigner}>
                  <div className={styles.lineName}>{name}</div>
                  {meta.length ? (
                    <ul className={styles.muted} style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {meta.map((m, i) => (
                        <li key={i}>
                          {m.label}: {m.value}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {line.deliveryEta ? (
                    <div className={styles.muted} style={{ marginTop: 6 }}>
                      Срок доставки: {line.deliveryEta}
                    </div>
                  ) : null}
                </td>
                <td className={report.tdCenterLevel}>
                  {line.quantity} {line.unit}
                </td>
                <td className={report.tdRightTightFirst}>
                  <div className={styles.kpPriceStack}>
                    {hasDisc ? (
                      <>
                        <span className={styles.kpPriceDiscount}>−{disc}%</span>
                        <span className={styles.kpPriceOld}>{formatRub(line.offerUnitPrice, order.currency)}</span>
                        <span className={styles.kpPriceNew}>{formatRub(newUnit, order.currency)}</span>
                      </>
                    ) : (
                      <span>{formatRub(line.offerUnitPrice, order.currency)}</span>
                    )}
                  </div>
                </td>
                <td className={report.tdRightTight}>{formatRub(lineTotal, order.currency)}</td>
                <td className={styles.kpGrossCol}>
                  <KpGrossDisplay snapshot={snap} />
                </td>
              </tr>
            );
          })}
          <tr className={styles.tableFooterRow}>
            <td colSpan={6} className={styles.kpFooterTotals}>
              <div className={styles.kpFooterTotalsInner}>
                {grossTotals.hasAny ? (
                  <div className={styles.kpFooterLine}>
                    <strong>Итого (брутто):</strong>
                    <span>{formatKpGrossTotalsLabel(grossTotals)}</span>
                  </div>
                ) : null}
                <div className={styles.kpFooterLine}>
                  <strong>Итого:</strong>
                  <span className={styles.kpFooterPriceInline}>
                    {hasDiscount ? (
                      <>
                        <span className={styles.kpPriceDiscount}>−{avgDiscountPctLabel}</span>
                        <span className={styles.kpPriceOld}>{formatRub(totals.oldTotalRub, order.currency)}</span>
                        <span className={styles.kpPriceNew}>{formatRub(totals.newTotalRub, order.currency)}</span>
                      </>
                    ) : (
                      <span className={styles.kpPriceNew}>{formatRub(totals.newTotalRub, order.currency)}</span>
                    )}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  orderId: string | null;
  /** Открыть чат сразу при открытии модалки (deep-link / URL sync). */
  initialChatOpen?: boolean;
  onClose: () => void;
  /** Синхронизировать `?chat=` при open/close чата в модалке. */
  onChatOpenChange?: (open: boolean) => void;
  /** После загрузки заказа — выровнять вкладку deep-link по реальному status. */
  onStatusResolved?: (status: string) => void;
};

export function AccountOrderDetailModal({
  orderId,
  initialChatOpen = false,
  onClose,
  onChatOpenChange,
  onStatusResolved,
}: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const sendChatTextRef = useRef<(text: string) => Promise<boolean>>(async () => false);
  const loadRef = useRef<(id: string) => Promise<void>>(async () => undefined);
  const [order, setOrder] = useState<UserOrderDetailApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const onStatusResolvedRef = useRef(onStatusResolved);
  onStatusResolvedRef.current = onStatusResolved;

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchUserOrder(id);
      setOrder(detail);
      cacheOrderCommercialProposal(id, detail.latestCommercialProposal);
      if (detail.status) onStatusResolvedRef.current?.(detail.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заказ');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);
  loadRef.current = load;

  const commercialProposalVersion =
    order?.commercialProposalVersion ?? order?.latestCommercialProposal?.versionNumber ?? null;

  const {
    chatOpen,
    setChatOpen,
    acceptOpen,
    setAcceptOpen,
    openAccept,
    canRespondKp,
    chatSeedDraft,
    composerBanner,
    chatInputPlaceholder,
    openChat,
    openKpChat,
    closeChat,
    handleChatSend,
    markAccepted,
  } = useOrderKpResponse({
    orderId: orderId ?? '',
    commercialProposalVersion,
    canRespondToCommercialProposal: order?.canRespondToCommercialProposal ?? false,
    hasUnseenCommercialProposal: false,
    sendChatText: (text) => sendChatTextRef.current(text),
    staleVersionMessage: 'КП обновлено — закройте окно и откройте заказ снова.',
    onResponded: (decision) => {
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              canRespondToCommercialProposal: false,
              customerKpDecision: decision,
            }
          : prev,
      );
    },
    onAccepted: () => {
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              canRespondToCommercialProposal: false,
              customerKpDecision: 'ACCEPTED',
              status: prev.status === 'PROPOSAL_FORMED' ? 'APPROVED' : prev.status,
            }
          : prev,
      );
      if (orderId) void loadRef.current(orderId);
    },
  });

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      setPdfBusy(false);
      setPdfError(null);
      return;
    }
    setPdfError(null);
    void load(orderId);
  }, [orderId, load]);

  useEffect(() => {
    if (orderId && initialChatOpen) setChatOpen(true);
  }, [orderId, initialChatOpen, setChatOpen]);

  const handleOpenChat = useCallback(() => {
    openChat();
    onChatOpenChange?.(true);
  }, [openChat, onChatOpenChange]);

  const handleCloseChat = useCallback(() => {
    closeChat();
    onChatOpenChange?.(false);
  }, [closeChat, onChatOpenChange]);

  const handleOpenAccept = useCallback(() => {
    openAccept();
    onChatOpenChange?.(false);
  }, [openAccept, onChatOpenChange]);

  const handleOpenKpChat = useCallback(
    (decision: 'CHANGES_REQUESTED' | 'REJECTED') => {
      openKpChat(decision);
      onChatOpenChange?.(true);
    },
    [openKpChat, onChatOpenChange],
  );
  useEffect(() => {
    if (!order?.id || loading) return;
    void (async () => {
      try {
        await ackUserOrderCommercialProposalSeen(order.id);
        dispatchAccountWorkNotificationsEvent({ entityId: order.id, chatSubject: 'order' });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Не удалось отметить КП просмотренным';
        setError((prev) => prev ?? msg);
      }
    })();
  }, [order?.id, order?.latestCommercialProposal?.versionNumber, loading]);

  useEffect(() => {
    if (!order?.id) return;
    const onWorkNotifications = (ev: Event) => {
      const detail = (ev as CustomEvent<AccountWorkNotificationsDetail>).detail;
      if (detail?.entityId !== order.id) return;
      if ((detail.chatSubject ?? 'order') !== 'order') return;
      setOrder((prev) => (prev ? { ...prev, unreadStaffChatCount: 0 } : prev));
    };
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
  }, [order?.id]);

  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (acceptOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAcceptOpen(false);
        return;
      }
      if (chatOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleCloseChat();
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [orderId, onClose, chatOpen, acceptOpen, handleCloseChat, setAcceptOpen]);

  useEffect(() => {
    if (!orderId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [orderId]);

  const {
    chatMessages,
    chatLoading,
    chatError,
    chatComposerDisabled,
    chatAttachPickerDisabled,
    pendingAttachmentsHint,
    pendingOutgoingAttachments,
    canSendAttachmentMessage,
    sendChatText,
    attachChatFiles,
    removePendingChatAttachment,
    deleteChatMessage,
    chatHasOlderHistory,
    chatLoadingOlderHistory,
    loadOlderChatMessages,
  } = useOrderChat({
    orderId: order?.id ?? null,
    enabled: chatOpen,
    variant: 'account',
    timeLocale: 'ru-RU',
  });
  sendChatTextRef.current = sendChatText;

  const staffUnread = order?.unreadStaffChatCount ?? 0;
  const cp = order?.latestCommercialProposal;
  const kpLines = cp?.lines ?? [];
  const hasKp = Boolean(cp && kpLines.length > 0);
  const kpEta = useMemo(() => (hasKp ? kpDeliveryEtaLabel(kpLines) : null), [hasKp, kpLines]);
  const decision = order?.customerKpDecision ?? null;
  const decisionNotice = order ? kpDecisionNotice(canRespondKp, decision) : undefined;
  const statusRejected = !canRespondKp && decision === 'REJECTED';

  const chatTitle = useMemo(() => {
    if (!order) return 'Сообщения';
    return `Чат · ${formatOrderDisplayId(order.id)}`;
  }, [order]);

  async function handleDownloadKpPdf() {
    if (!order?.latestCommercialProposal || pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await downloadCommercialProposalPdf({
        orderId: order.id,
        proposal: order.latestCommercialProposal,
      });
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Не удалось сформировать PDF');
    } finally {
      setPdfBusy(false);
    }
  }

  useModalFocusTrap(Boolean(orderId), panelRef);

  if (!orderId) return null;

  return (
    <>
      <button type="button" className={panelModal.backdrop} aria-label="Закрыть" onClick={onClose} />
      <section
        ref={panelRef}
        className={`${panelModal.panel} ${panelModal.panelOrderWide} ${styles.orderDetailModalShell}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-order-detail-title"
        tabIndex={-1}
      >
        <ChatWindow
          variant="embedded"
          embeddedLayout="overlay"
          open={chatOpen}
          onClose={handleCloseChat}
          title={chatTitle}
          messages={chatMessages}
          messageEmptyHint={chatLoading ? 'Загрузка…' : 'Пока нет сообщений'}
          errorText={chatError}
          composerDisabled={chatComposerDisabled}
          attachPickerDisabled={chatAttachPickerDisabled}
          attachmentsEnabled
          pendingAttachmentsHint={pendingAttachmentsHint}
          pendingOutgoing={pendingOutgoingAttachments}
          allowEmptySend={canSendAttachmentMessage}
          onSend={handleChatSend}
          seedDraft={chatSeedDraft}
          composerBanner={composerBanner}
          inputPlaceholder={chatInputPlaceholder}
          onAttachFiles={attachChatFiles}
          onRemovePendingAttachment={removePendingChatAttachment}
          onDeleteMessage={deleteChatMessage}
          hasOlderHistory={chatHasOlderHistory}
          loadingOlderHistory={chatLoadingOlderHistory}
          onLoadOlderHistory={loadOlderChatMessages}
        />
        <OrderKpAcceptModal
          open={acceptOpen}
          orderId={orderId}
          expectedVersion={commercialProposalVersion}
          onClose={() => setAcceptOpen(false)}
          onAccepted={markAccepted}
        />
        <header className={panelModal.header}>
          <button type="button" className={panelModal.iconBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>
        <div className={`${panelModal.inner} ${styles.innerTightTop} ${styles.modalBody}`}>
          {loading ? <p className={styles.muted}>Загрузка…</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {order && !loading ? (
            <>
              <div className={styles.titleBlock}>
                <h2 id="account-order-detail-title" className={panelModal.title}>
                  {formatOrderCreatedTitle(order.createdAt)}
                </h2>
                <p className={styles.orderNumber} title={order.id}>
                  Номер {formatOrderDisplayId(order.id)}
                </p>
                {decisionNotice ? (
                  <p
                    className={
                      statusRejected
                        ? `${styles.statusNotice} ${styles.statusNoticeRejected}`
                        : styles.statusNotice
                    }
                  >
                    {decisionNotice}
                  </p>
                ) : null}
              </div>

              <div className={styles.metaGridPlain}>
                <div className={styles.metaItem}>
                  <div className={styles.metaItemLabel}>Статус</div>
                  <div
                    className={
                      statusRejected
                        ? `${styles.metaItemValue} ${styles.metaItemValueRejected}`
                        : styles.metaItemValue
                    }
                  >
                    {orderStatusLabel(order.status, 'ru')}
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <div className={styles.metaItemLabel}>Обновлён</div>
                  <div className={styles.metaItemValue}>{formatDateTime(order.updatedAt)}</div>
                </div>
                {cp?.publishedAt ? (
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>КП от</div>
                    <div className={styles.metaItemValue}>{formatDateTime(cp.publishedAt)}</div>
                  </div>
                ) : null}
                {kpEta ? (
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>Срок доставки</div>
                    <div className={styles.metaItemValue}>{kpEta}</div>
                  </div>
                ) : null}
              </div>

              <AccordionBig title="Детали" className={styles.accordionFullWidth} panelClassName={styles.accordionPanelMeta}>
                <div className={styles.metaGridPlain}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>ФИО</div>
                    <div className={styles.metaItemValue}>{order.customerName?.trim() || '—'}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>Телефон</div>
                    <div className={styles.metaItemValue}>{order.customerPhone?.trim() || '—'}</div>
                  </div>
                  <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.metaItemLabel}>Адрес</div>
                    <div className={`${styles.metaItemValue} ${styles.blockText}`}>
                      {order.deliveryAddress?.trim() || '—'}
                    </div>
                  </div>
                  <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.metaItemLabel}>Комментарий</div>
                    <div className={`${styles.metaItemValue} ${styles.blockText}`}>
                      {order.comment?.trim() || '—'}
                    </div>
                  </div>
                </div>
              </AccordionBig>

              {hasKp && cp ? (
                <div className={styles.orderCompareStack}>
                  <div className={styles.orderTableFrameWrap}>
                    <div className={styles.kpSectionHead}>
                      <div>
                        <h3 className={styles.sectionTitle}>Коммерческое предложение</h3>
                        {cp.publishedAt ? (
                          <p className={styles.muted}>от {formatDateTime(cp.publishedAt)}</p>
                        ) : null}
                      </div>
                    </div>
                    {pdfError ? (
                      <p className={styles.error} role="alert">
                        {pdfError}
                      </p>
                    ) : null}
                    <AccountKpLinesTable order={order} lines={kpLines} />
                  </div>
                  <AccordionBig
                    title="Было: исходный заказ"
                    className={styles.accordionFullWidth}
                    panelClassName={styles.accordionPanelMeta}
                  >
                    <AccountOrderItemsTable order={order} positionHeader="Товар" footerMuted />
                  </AccordionBig>
                </div>
              ) : (
                <div className={styles.orderTableFrameWrap}>
                  <AccountOrderItemsTable order={order} positionHeader="Товар" />
                </div>
              )}
            </>
          ) : null}
        </div>
        {order && !loading ? (
          <OrderKpActionFooter
            staffUnreadCount={staffUnread}
            canRespondKp={canRespondKp}
            onOpenChat={handleOpenChat}
            onConfirm={handleOpenAccept}
            onRequestChanges={() => handleOpenKpChat('CHANGES_REQUESTED')}
            onReject={() => handleOpenKpChat('REJECTED')}
            onDownloadPdf={hasKp ? () => void handleDownloadKpPdf() : undefined}
            pdfBusy={pdfBusy}
          />
        ) : null}
      </section>
    </>
  );
}

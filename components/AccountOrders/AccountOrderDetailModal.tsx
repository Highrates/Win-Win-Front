'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccordionBig } from '@/app/(account)/account/orders/AccordionBig';
import { ACCOUNT_WORK_NOTIFICATIONS_EVENT } from '@/lib/account/orders';
import teamPageStyles from '@/app/(account)/account/team/page.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat } from '@/hooks/useOrderChat';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { orderStatusLabel } from '@/lib/orders/orderStatus';
import { formatKpGrossTotalsLabel, kpGrossTotals } from '@/lib/commercialProposal/kpGrossDimensions';
import { KpGrossDisplay } from '@/components/commercialProposal/KpGrossDisplay';
import { kpLineTotalRub, kpLineUnitAfterDiscount, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import type { CommercialProposalLineApi } from '@/lib/commercialProposal/types';
import { fetchUserOrder, ackUserOrderCommercialProposalSeen } from '@/lib/userOrders/clientApi';
import type { UserOrderDetailApi } from '@/lib/userOrders/types';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import workCardStyles from '@/components/AccountOrders/AccountOrderWorkCard.module.css';
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

function OrderCtaMessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.83335 15.3582H9.16669L12.875 17.8249C13.425 18.1916 14.1667 17.7999 14.1667 17.1332V15.3582C16.6667 15.3582 18.3334 13.6916 18.3334 11.1916V6.19157C18.3334 3.69157 16.6667 2.0249 14.1667 2.0249H5.83335C3.33335 2.0249 1.66669 3.69157 1.66669 6.19157V11.1916C1.66669 13.6916 3.33335 15.3582 5.83335 15.3582Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function TableFlowArrow() {
  return (
    <div className={styles.tableFlowArrow} aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 5v14M12 19l-4-4M12 19l4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function AccountOrderItemsTable({
  order,
  positionHeader,
}: {
  order: UserOrderDetailApi;
  positionHeader: string;
}) {
  if (order.items.length === 0) {
    return <p className={styles.muted}>Нет позиций</p>;
  }
  return (
    <div className={`${teamPageStyles.tableFrame} ${styles.orderTableFrame}`}>
      <table className={teamPageStyles.table}>
        <thead>
          <tr>
            <th scope="col" className={teamPageStyles.thLeftTight} style={{ width: 116 }} aria-hidden />
            <th scope="col" className={teamPageStyles.thDesigner}>
              {positionHeader}
            </th>
            <th scope="col" className={teamPageStyles.thCenterLevel}>
              Кол-во
            </th>
            <th scope="col" className={teamPageStyles.thRightTightFirst}>
              Цена
            </th>
            <th scope="col" className={teamPageStyles.thRightTight}>
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
                <td className={`${teamPageStyles.tdLeftTight} ${styles.tdTopAlign}`}>
                  <div className={styles.thumbWrap}>
                    {img ? (
                      <img className={styles.thumb} src={img} alt="" width={100} height={100} />
                    ) : (
                      <div className={styles.thumbPh} aria-hidden />
                    )}
                  </div>
                </td>
                <td className={`${teamPageStyles.tdDesigner} ${styles.tdTopAlign}`}>
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
                <td className={teamPageStyles.tdCenterLevel}>
                  {row.quantity} шт.
                </td>
                <td className={teamPageStyles.tdRightTightFirst}>{formatRub(row.price, order.currency)}</td>
                <td className={teamPageStyles.tdRightTight}>
                  {Number.isFinite(lineTotal) ? formatRub(lineTotal, order.currency) : '—'}
                </td>
              </tr>
            );
          })}
          <tr className={styles.tableFooterRow}>
            <td colSpan={4} className={teamPageStyles.tdRightTightFirst}>
              Ожидаемая сумма заказа
            </td>
            <td className={`${teamPageStyles.tdRightTight} ${styles.tableFooterValue}`}>
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
  const avgDiscountPctLabel = `${Math.round(totals.avgDiscountPercent * 10) / 10}%`;
  const hasDiscount = totals.oldTotalRub !== totals.newTotalRub || totals.avgDiscountPercent > 0;

  return (
    <div className={`${teamPageStyles.tableFrame} ${styles.orderTableFrame}`}>
      <table className={teamPageStyles.table}>
        <thead>
          <tr>
            <th scope="col" className={teamPageStyles.thLeftTight} style={{ width: 116 }} aria-hidden />
            <th scope="col" className={teamPageStyles.thDesigner}>
              Позиция
            </th>
            <th scope="col" className={teamPageStyles.thCenterLevel}>
              Кол-во
            </th>
            <th scope="col" className={teamPageStyles.thRightTightFirst}>
              Цена
            </th>
            <th scope="col" className={teamPageStyles.thRightTight}>
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
                <td className={`${teamPageStyles.tdLeftTight} ${styles.tdTopAlign}`}>
                  <div className={styles.thumbWrap}>
                    {img ? (
                      <img className={styles.thumb} src={img} alt="" width={100} height={100} />
                    ) : (
                      <div className={styles.thumbPh} aria-hidden />
                    )}
                  </div>
                </td>
                <td className={teamPageStyles.tdDesigner}>
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
                <td className={teamPageStyles.tdCenterLevel}>
                  {line.quantity} {line.unit}
                </td>
                <td className={teamPageStyles.tdRightTightFirst}>
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
                <td className={teamPageStyles.tdRightTight}>{formatRub(lineTotal, order.currency)}</td>
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
  onClose: () => void;
};

/** Сколько строк КП считать «много»: при открытии прокручиваем к актуальному блоку */
const KP_LINES_SCROLL_THRESHOLD = 5;

export function AccountOrderDetailModal({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<UserOrderDetailApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const latestOfferRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const o = await fetchUserOrder(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заказ');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      setChatOpen(false);
      return;
    }
    void load(orderId);
  }, [orderId, load]);

  useEffect(() => {
    if (!order?.id || loading) return;
    void (async () => {
      try {
        await ackUserOrderCommercialProposalSeen(order.id);
        window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_NOTIFICATIONS_EVENT));
      } catch {
        /* просмотр заказа не зависит от ack */
      }
    })();
  }, [order?.id, order?.latestCommercialProposal?.versionNumber, loading]);

  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [orderId, onClose]);

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
  } = useOrderChat({
    orderId: order?.id ?? null,
    enabled: chatOpen,
    variant: 'account',
    timeLocale: 'ru-RU',
  });

  const staffUnread = order?.unreadStaffChatCount ?? 0;
  const cp = order?.latestCommercialProposal;
  const kpLines = cp?.lines ?? [];
  const hasKp = Boolean(cp && kpLines.length > 0);

  const chatTitle = useMemo(() => {
    if (!order) return 'Сообщения';
    return `Чат · ${formatOrderDisplayId(order.id)}`;
  }, [order]);

  const hasCheckout = Boolean(hasKp);

  useEffect(() => {
    if (!order || !hasKp || kpLines.length < KP_LINES_SCROLL_THRESHOLD) return;
    const id = window.requestAnimationFrame(() => {
      latestOfferRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [order?.id, hasKp, kpLines.length]);

  if (!orderId) return null;

  return (
    <>
      <button type="button" className={panelModal.backdrop} aria-label="Закрыть" onClick={onClose} />
      <section
        className={`${panelModal.panel} ${panelModal.panelOrderWide} ${styles.orderDetailModalShell}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-order-detail-title"
      >
        <ChatWindow
          open={chatOpen}
          onClose={() => setChatOpen(false)}
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
          onSend={sendChatText}
          onAttachFiles={attachChatFiles}
          onRemovePendingAttachment={removePendingChatAttachment}
          onDeleteMessage={deleteChatMessage}
        />
        <header className={panelModal.header}>
          <button type="button" className={panelModal.iconBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>
        <div className={`${panelModal.inner} ${styles.innerTightTop}`}>
          {loading ? <p className={styles.muted}>Загрузка…</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {order && !loading ? (
            <>
              <div>
                <h2 id="account-order-detail-title" className={panelModal.title}>
                  {formatOrderCreatedTitle(order.createdAt)}
                </h2>
                <p className={styles.fullId} title={order.id}>
                  Номер заказа: {formatOrderDisplayId(order.id)}
                </p>
              </div>

              <div className={`${styles.metaGrid} ${styles.metaGridStacked}`}>
                <div className={styles.metaGridMain}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>Статус</div>
                    <div className={styles.metaItemValue}>{orderStatusLabel(order.status, 'ru')}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>Создан</div>
                    <div className={styles.metaItemValue}>{formatDateTime(order.createdAt)}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>Обновлён</div>
                    <div className={styles.metaItemValue}>{formatDateTime(order.updatedAt)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${workCardStyles.ctaButton} ${styles.modalCtaMessage}${staffUnread > 0 ? ` ${workCardStyles.ctaButtonUnread}` : ''}${!hasCheckout ? ` ${styles.modalCtaMessageSolo}` : ''}`}
                  aria-label={
                    staffUnread > 0 ? `Написать по заказу, непрочитанных: ${staffUnread}` : 'Написать по заказу'
                  }
                  onClick={() => setChatOpen(true)}
                >
                  <OrderCtaMessageIcon
                    className={`${workCardStyles.ctaIcon}${staffUnread > 0 ? ` ${workCardStyles.ctaIconUnread}` : ''}`}
                  />
                  {staffUnread > 0 ? (
                    <span className={workCardStyles.ctaUnreadCount}>({staffUnread})</span>
                  ) : null}
                </button>
                {hasCheckout ? (
                  <button type="button" className={`${workCardStyles.orderCheckoutBtn} ${styles.modalCtaCheckout}`}>
                    <span>Оформить</span>
                    <span aria-hidden>→</span>
                  </button>
                ) : null}
              </div>

              <AccordionBig title="Детали" className={styles.accordionFullWidth} panelClassName={styles.accordionPanelMeta}>
                <div className={styles.metaGridPlain}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaItemLabel}>ФИО</div>
                    <div className={styles.metaItemValue}>{order.customerName?.trim() || '—'}</div>
                  </div>
                  <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.metaItemLabel}>Адрес</div>
                    <div className={`${styles.metaItemValue} ${styles.blockText}`}>
                      {order.deliveryAddress?.trim() || '—'}
                    </div>
                  </div>
                </div>
              </AccordionBig>

              {hasKp && cp ? (
                <div className={styles.orderCompareStack}>
                  <div className={styles.orderTableFrameWrapPrev}>
                    <p className={styles.orderSnapshotLabel}>Исходный заказ</p>
                    <div className={styles.orderTableFrameDimTarget}>
                      <AccountOrderItemsTable order={order} positionHeader="Товар" />
                    </div>
                  </div>
                  <TableFlowArrow />
                  <div ref={latestOfferRef} className={styles.orderTableFrameWrap}>
                    <h3 className={panelModal.title} style={{ fontSize: '1.05rem', marginBottom: 8 }}>
                      Коммерческое предложение
                    </h3>
                    {cp.publishedAt ? (
                      <p className={styles.muted} style={{ marginBottom: 12 }}>
                        от {formatDateTime(cp.publishedAt)}
                      </p>
                    ) : null}
                    <AccountKpLinesTable order={order} lines={kpLines} />
                  </div>
                </div>
              ) : (
                <div className={styles.orderTableFrameWrap}>
                  <AccountOrderItemsTable order={order} positionHeader="Товар" />
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

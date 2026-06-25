'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveSourcingProductDisplayName } from '@win-win/sourcing-request';
import { AccordionBig } from '@/app/(account)/account/orders/AccordionBig';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import {
  ACCOUNT_WORK_NOTIFICATIONS_EVENT,
  dispatchAccountWorkNotificationsEvent,
  type AccountWorkNotificationsDetail,
} from '@/lib/account/orders';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { formatBudgetDigitsGrouped } from '@/lib/formatBudgetRub';
import { sourcingKpLineTotalRub, sourcingKpOrderTotalRub } from '@/lib/sourcingCommercialProposal/kpLineTotals';
import type { SourcingCommercialProposalApi, SourcingCommercialProposalLineApi } from '@/lib/sourcingCommercialProposal/types';
import {
  ackUserSourcingCommercialProposalSeen,
  fetchUserSourcingRequest,
} from '@/lib/userSourcingRequests/clientApi';
import { sourcingStatusLabel } from '@/lib/userSourcingRequests/sourcingStatus';
import type { UserSourcingRequestDetailApi } from '@/lib/userSourcingRequests/types';
import { AccountGalleryThumb } from '@/components/AccountOrders/AccountGalleryThumb';
import styles from './AccountSourcingRequestDetailModal.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDetailDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatBudget(value: string | null): string {
  if (!value?.trim()) return '—';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '—';
  return `${formatBudgetDigitsGrouped(digits)} ₽`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function AccountSourcingKpLinesTable({ lines }: { lines: SourcingCommercialProposalLineApi[] }) {
  const total = useMemo(() => sourcingKpOrderTotalRub(lines), [lines]);
  const galleryUrls = useMemo(
    () => lines.flatMap((line) => line.imageUrls ?? []).filter((url) => url.trim()),
    [lines],
  );
  return (
    <div className={styles.kpTableWrap}>
      <table className={styles.kpTable}>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Кол-во</th>
            <th>Цена</th>
            <th>Срок поставки</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const hasDetails =
              Boolean(line.description?.trim()) || (line.imageUrls ?? []).length > 0;
            return (
              <Fragment key={line.id}>
                <tr className={hasDetails ? styles.kpLineMainRow : undefined}>
                  <td>
                    <div className={styles.kpLineName}>{line.productName}</div>
                  </td>
                  <td>
                    {line.quantity} {line.unit}
                  </td>
                  <td>{formatMoney(line.offerUnitPrice)}</td>
                  <td>{line.deliveryEta?.trim() || '—'}</td>
                  <td>{formatMoney(sourcingKpLineTotalRub(line))}</td>
                </tr>
                {hasDetails ? (
                  <tr className={styles.kpLineDetailsRow}>
                    <td colSpan={5}>
                      {line.description?.trim() ? (
                        <p className={styles.kpLineDesc}>{line.description}</p>
                      ) : null}
                      {(line.imageUrls ?? []).length > 0 ? (
                        <div className={styles.kpLineImages}>
                          {(line.imageUrls ?? []).map((url, idx) => (
                            <AccountGalleryThumb
                              key={`${url}-${idx}`}
                              src={url}
                              galleryUrls={galleryUrls}
                              className={styles.kpLineThumb}
                            />
                          ))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          <tr>
            <td colSpan={4} className={styles.kpTotalLabel}>
              Итого
            </td>
            <td className={styles.kpTotalValue}>{formatMoney(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  requestId: string | null;
  onClose: () => void;
};

export function AccountSourcingRequestDetailModal({ requestId, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const latestOfferRef = useRef<HTMLDivElement | null>(null);
  const [detail, setDetail] = useState<UserSourcingRequestDetailApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = Boolean(requestId);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await fetchUserSourcingRequest(id));
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заявку');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestId) {
      setDetail(null);
      setError(null);
      return;
    }
    void load(requestId);
  }, [load, requestId]);

  useEffect(() => {
    if (!detail?.id || loading) return;
    void (async () => {
      try {
        await ackUserSourcingCommercialProposalSeen(detail.id);
        dispatchAccountWorkNotificationsEvent({ entityId: detail.id, chatSubject: 'sourcing' });
      } catch {
        /* просмотр заявки не зависит от ack */
      }
    })();
  }, [detail?.id, detail?.latestCommercialProposal?.versionNumber, loading]);

  useEffect(() => {
    if (!detail?.id) return;
    const onWorkNotifications = (ev: Event) => {
      const evDetail = (ev as CustomEvent<AccountWorkNotificationsDetail>).detail;
      if (evDetail?.entityId !== detail.id) return;
      if ((evDetail.chatSubject ?? 'order') !== 'sourcing') return;
      setDetail((prev) => (prev ? { ...prev, unreadStaffChatCount: 0 } : prev));
    };
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
  }, [detail?.id]);

  useEffect(() => {
    if (!requestId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [requestId, onClose]);

  useEffect(() => {
    if (!requestId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [requestId]);

  const publishedKps = useMemo((): SourcingCommercialProposalApi[] => {
    const list = detail?.publishedCommercialProposals ?? [];
    if (list.length > 0) return list;
    const latest = detail?.latestCommercialProposal;
    return latest && latest.lines.length > 0 ? [latest] : [];
  }, [detail?.publishedCommercialProposals, detail?.latestCommercialProposal]);
  const hasKp = publishedKps.length > 0;
  const latestKpLines = publishedKps[0]?.lines ?? [];
  const referenceGalleryUrls = useMemo(
    () => (detail?.items ?? []).flatMap((item) => item.referenceImages.map((img) => img.url)),
    [detail?.items],
  );

  useEffect(() => {
    if (!detail || !hasKp || latestKpLines.length < 3) return;
    const id = window.requestAnimationFrame(() => {
      latestOfferRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [detail?.id, hasKp, latestKpLines.length]);

  useModalFocusTrap(open, panelRef);

  if (!open) return null;

  const shortNo = requestId ? formatOrderDisplayId(requestId) : '';

  return (
    <>
      <button type="button" className={panelModal.backdrop} aria-label="Закрыть" onClick={onClose} />
      <section
        ref={panelRef}
        className={`${panelModal.panel} ${panelModal.panelOrderWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sourcing-detail-title"
        tabIndex={-1}
      >
        <header className={panelModal.header}>
          <button type="button" className={panelModal.iconBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>
        <div className={`${panelModal.inner} ${styles.inner}`}>
          <h2 id="sourcing-detail-title" className={panelModal.title}>
            Заявка на подбор
          </h2>

          {loading ? <p className={styles.muted}>Загрузка…</p> : null}
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          {detail ? (
            <>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Номер</span>
                  <span title={detail.id}>{shortNo}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Статус</span>
                  <span>{sourcingStatusLabel(detail.status)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Создана</span>
                  <span>{formatDetailDate(detail.createdAt)}</span>
                </div>
                {!hasKp ? (
                  <div className={styles.summaryRow}>
                    <span className={styles.label}>Тема</span>
                    <span>{detail.title}</span>
                  </div>
                ) : null}
                {detail.deliveryCity?.trim() && !hasKp ? (
                  <div className={styles.summaryRow}>
                    <span className={styles.label}>Город доставки</span>
                    <span>{detail.deliveryCity}</span>
                  </div>
                ) : null}
              </div>

              {!hasKp ? (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Товары</h3>
                <div className={styles.accordionList}>
                  {detail.items.map((item, index) => (
                    <AccordionBig
                      key={item.id}
                      title={resolveSourcingProductDisplayName({
                        name: item.name,
                        requestTitle: detail.title,
                        productIndex: index,
                        productCount: detail.items.length,
                      })}
                      defaultOpen={index === 0}
                      className={styles.accordionFullWidth}
                      panelClassName={styles.itemGrid}
                    >
                      {item.productLink?.trim() ? (
                        <div className={styles.itemRow}>
                          <span className={styles.label}>Ссылка</span>
                          <a href={item.productLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            {item.productLink}
                          </a>
                        </div>
                      ) : null}
                      {item.material?.trim() ? (
                        <div className={styles.itemRow}>
                          <span className={styles.label}>Материал</span>
                          <span>{item.material}</span>
                        </div>
                      ) : null}
                      {item.color?.trim() ? (
                        <div className={styles.itemRow}>
                          <span className={styles.label}>Цвет</span>
                          <span>{item.color}</span>
                        </div>
                      ) : null}
                      {item.size?.trim() ? (
                        <div className={styles.itemRow}>
                          <span className={styles.label}>Размер</span>
                          <span>{item.size}</span>
                        </div>
                      ) : null}
                      <div className={styles.itemRow}>
                        <span className={styles.label}>Количество</span>
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.expectedBudget ? (
                        <div className={styles.itemRow}>
                          <span className={styles.label}>Бюджет за ед.</span>
                          <span>{formatBudget(item.expectedBudget)}</span>
                        </div>
                      ) : null}
                      {item.description?.trim() ? (
                        <div className={styles.itemRowFull}>
                          <span className={styles.label}>Описание</span>
                          <p className={styles.description}>{item.description}</p>
                        </div>
                      ) : null}
                      {item.referenceImages.length > 0 ? (
                        <div className={styles.itemRowFull}>
                          <span className={styles.label}>Референсы</span>
                          <div className={styles.thumbs}>
                            {item.referenceImages.map((img) => (
                              <AccountGalleryThumb
                                key={img.id}
                                src={img.url}
                                galleryUrls={referenceGalleryUrls}
                                className={styles.thumb}
                                alt={img.filename}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </AccordionBig>
                  ))}
                </div>
              </div>
              ) : null}

              {!hasKp && detail.attachments.length > 0 ? (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Вложения</h3>
                  <ul className={styles.attachments}>
                    {detail.attachments.map((a) => (
                      <li key={a.id}>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                          {a.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasKp ? (
                <div ref={latestOfferRef} className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    {publishedKps.length > 1 ? 'Коммерческие предложения' : 'Коммерческое предложение'}
                  </h3>
                  <div className={styles.kpPublishedStack}>
                    {publishedKps.map((cp, index) => (
                      <div key={cp.id} className={styles.kpVersionBlock}>
                        {cp.publishedAt ? (
                          <p className={styles.kpVersionCaption}>
                            {publishedKps.length > 1 && index > 0
                              ? `КП от ${formatDetailDate(cp.publishedAt)}`
                              : `от ${formatDetailDate(cp.publishedAt)}`}
                          </p>
                        ) : null}
                        <AccountSourcingKpLinesTable lines={cp.lines} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccordionBig } from '@/app/(account)/account/orders/AccordionBig';
import teamPageStyles from '@/app/(account)/account/team/page.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { fetchUserOrder } from '@/lib/userOrders/clientApi';
import type { UserOrderDetailApi } from '@/lib/userOrders/types';
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

function statusLabelRu(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'На согласовании';
    case 'ORDERED':
      return 'Заказано';
    case 'PAID':
      return 'Оплачено';
    case 'RECEIVED':
      return 'Получено';
    case 'DRAFT':
      return 'Черновик';
    default:
      return 'В работе';
  }
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

function metaRowsFromSnapshot(snapshot: Record<string, unknown> | null): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (!snapshot) return rows;
  const mod = snapshot.modificationLabel;
  if (typeof mod === 'string' && mod.trim()) {
    rows.push({ label: 'Модификация', value: mod.trim() });
  }
  const em = snapshot.elementMaterialRows;
  if (Array.isArray(em)) {
    for (const row of em) {
      if (row && typeof row === 'object' && 'elementLabel' in row && 'materialColorLabel' in row) {
        const el = (row as { elementLabel?: unknown }).elementLabel;
        const mat = (row as { materialColorLabel?: unknown }).materialColorLabel;
        if (typeof el === 'string' && typeof mat === 'string') {
          rows.push({ label: el.trim() || 'Элемент', value: mat.trim() || '—' });
        }
      }
    }
  }
  return rows;
}

type Props = {
  orderId: string | null;
  onClose: () => void;
};

export function AccountOrderDetailModal({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<UserOrderDetailApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return;
    }
    void load(orderId);
  }, [orderId, load]);

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

  if (!orderId) return null;

  return (
    <>
      <button type="button" className={panelModal.backdrop} aria-label="Закрыть" onClick={onClose} />
      <section
        className={`${panelModal.panel} ${panelModal.panelOrderWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-order-detail-title"
      >
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

              <dl className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <dt>Статус</dt>
                  <dd>{statusLabelRu(order.status)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Создан</dt>
                  <dd>{formatDateTime(order.createdAt)}</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>Обновлён</dt>
                  <dd>{formatDateTime(order.updatedAt)}</dd>
                </div>
              </dl>

              <div>
                {order.items.length === 0 ? (
                  <p className={styles.muted}>Нет позиций</p>
                ) : (
                  <div className={`${teamPageStyles.tableFrame} ${styles.orderTableFrame}`}>
                    <table className={teamPageStyles.table}>
                      <thead>
                        <tr>
                          <th scope="col" className={teamPageStyles.thLeftTight} style={{ width: 116 }} aria-hidden />
                          <th scope="col" className={teamPageStyles.thDesigner}>
                            Товар
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
                          const meta = metaRowsFromSnapshot(snap);
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
                                {row.product?.brand?.name ? (
                                  <div className={styles.brandNote}>{row.product.brand.name}</div>
                                ) : null}
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
                              <td className={teamPageStyles.tdRightTightFirst}>
                                {formatRub(row.price, order.currency)}
                              </td>
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
                )}
              </div>

              <AccordionBig title="Детали" className={styles.accordionFullWidth} panelClassName={styles.accordionPanelMeta}>
                <dl className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <dt>ФИО</dt>
                    <dd>{order.customerName?.trim() || '—'}</dd>
                  </div>
                  <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
                    <dt>Адрес</dt>
                    <dd className={styles.blockText}>{order.deliveryAddress?.trim() || '—'}</dd>
                  </div>
                </dl>
              </AccordionBig>

              <div>
                <h3 className={styles.sectionTitle}>Комментарий</h3>
                <p className={styles.blockText}>{order.comment?.trim() || '—'}</p>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

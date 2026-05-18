'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import {
  adminOrderDetailStrings,
  adminOrdersStrings,
} from '@/lib/admin-i18n/adminOrdersI18n';
import { useMergedAdminOrderStatusLabels } from '@/lib/admin-i18n/useMergedAdminOrderStatusLabels';
import { formatAdminOrderDateTime } from '@/lib/dates/formatAdminOrderDateTime';
import { kpLineTotalRub, kpLineUnitAfterDiscount } from '@/lib/commercialProposal/kpOfferTotals';
import type {
  CommercialProposalApi,
  CommercialProposalSummaryApi,
} from '@/lib/commercialProposal/types';
import styles from '../../catalog/catalogAdmin.module.css';
import pn from '../../catalog/products/new/productNew.module.css';
import od from './orderAdminDetail.module.css';
import { AdminOrderSideChat } from './AdminOrderSideChat';
import { AdminOrdersConfirmModal } from '../AdminOrdersConfirmModal';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import { ORDER_STATUS_DRAFT, ORDER_STATUS_FLOW } from '@/lib/orders/orderStatus';

type AdminOrderDetail = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  comment: string | null;
  customerName: string | null;
  deliveryAddress: string | null;
  documentUrls: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    profile: null | { firstName: string | null; lastName: string | null };
  };
  items: {
    id: string;
    quantity: number;
    unit: string;
    price: string | number;
    snapshot: unknown;
    product: {
      id: string;
      name: string;
      slug: string;
      images?: { url: string }[];
      brand?: { name: string } | null;
    };
  }[];
};

function parseSnapshot(row: { snapshot: unknown }): Record<string, unknown> | null {
  const s = row.snapshot;
  if (s && typeof s === 'object' && !Array.isArray(s)) return s as Record<string, unknown>;
  return null;
}

function itemTitle(row: AdminOrderDetail['items'][0]): string {
  const s = parseSnapshot(row);
  const n = s?.productName;
  if (typeof n === 'string' && n.trim()) return n.trim();
  return row.product?.name?.trim() || '—';
}

function itemImageUrl(row: AdminOrderDetail['items'][0]): string | null {
  const s = parseSnapshot(row);
  const u = s?.imageUrl;
  if (typeof u === 'string' && u.trim()) return u.trim();
  const first = row.product?.images?.[0]?.url;
  return first?.trim() || null;
}

/** Суммы без копеек */
function formatMoneyInt(amount: string | number, currency: string, numberLocale: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatQtyUnit(qty: number, unit: string): string {
  const u = (unit || 'шт.').trim();
  return `${qty}\u00A0${u}`;
}

function kpLineDisplayTitle(snapshot: Record<string, unknown> | null): string {
  const n = snapshot?.productName;
  if (typeof n === 'string' && n.trim()) return n.trim();
  return '—';
}

function kpLineImageUrl(snapshot: Record<string, unknown> | null): string | null {
  const u = snapshot?.imageUrl;
  return typeof u === 'string' && u.trim() ? u.trim() : null;
}

function kpDiscountShown(pct: number | null): string | null {
  if (pct == null || !Number.isFinite(pct) || pct <= 0) return null;
  if (pct === Math.floor(pct)) return `${pct}%`;
  return `${pct.toFixed(1).replace(/\.0$/, '')}%`;
}

function accountDisplayName(user: AdminOrderDetail['user']): string {
  const p = user.profile;
  const n = [p?.firstName, p?.lastName]
    .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
    .join(' ')
    .trim();
  if (n) return n;
  return user.email?.trim() || user.phone?.trim() || '—';
}

function orderLinesTotalRub(items: AdminOrderDetail['items']): number {
  let s = 0;
  for (const row of items) {
    const unit = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
    if (Number.isFinite(unit)) s += unit * row.quantity;
  }
  return Math.round(s * 100) / 100;
}

function statusSelectOptions(orderStatus: string): readonly string[] {
  if (orderStatus === ORDER_STATUS_DRAFT) return [ORDER_STATUS_DRAFT, ...ORDER_STATUS_FLOW];
  if (orderStatus === 'PENDING_APPROVAL') return ORDER_STATUS_FLOW;
  return ORDER_STATUS_FLOW;
}

export function OrderAdminDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const listS = useMemo(() => adminOrdersStrings(locale), [locale]);
  const statusLabels = useMergedAdminOrderStatusLabels();
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [kpSummaryLoading, setKpSummaryLoading] = useState(false);
  const [kpSummary, setKpSummary] = useState<CommercialProposalSummaryApi | null>(null);
  const [publishedKpFull, setPublishedKpFull] = useState<CommercialProposalApi[]>([]);
  const [loadingPublishedKpFull, setLoadingPublishedKpFull] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBackendJson<AdminOrderDetail>(`orders/admin/${orderId}`);
      setOrder(res);
      setSelectedStatus(res.status === 'PENDING_APPROVAL' ? 'PROPOSAL_FORMED' : res.status);
    } catch (e) {
      const msg = e instanceof Error ? e.message : d.errLoad;
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, d.errLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order || order.status === ORDER_STATUS_DRAFT) {
      setKpSummary(null);
      setKpSummaryLoading(false);
      return;
    }
    let cancelled = false;
    setKpSummaryLoading(true);
    void (async () => {
      try {
        const s = await adminBackendJson<CommercialProposalSummaryApi>(
          `orders/admin/${encodeURIComponent(order.id)}/commercial-proposals`,
        );
        if (!cancelled) setKpSummary(s);
      } catch {
        if (!cancelled) setKpSummary(null);
      } finally {
        if (!cancelled) setKpSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.status]);

  useEffect(() => {
    const st = order?.status;
    if (!kpSummary?.published?.length || st === ORDER_STATUS_DRAFT) {
      setPublishedKpFull([]);
      setLoadingPublishedKpFull(false);
      return;
    }
    let cancelled = false;
    const base = `orders/admin/${encodeURIComponent(orderId)}/commercial-proposals/published/`;
    setLoadingPublishedKpFull(true);
    setPublishedKpFull([]);
    void (async () => {
      try {
        const rows = await Promise.all(
          kpSummary.published.map((p) =>
            adminBackendJson<CommercialProposalApi>(`${base}${p.versionNumber}`),
          ),
        );
        if (!cancelled) setPublishedKpFull(rows);
      } catch {
        if (!cancelled) setPublishedKpFull([]);
      } finally {
        if (!cancelled) setLoadingPublishedKpFull(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kpSummary?.published, orderId, order?.status]);

  useEffect(() => {
    if (typeof window === 'undefined' || !order) return;
    if (window.location.hash !== '#order-chat') return;
    requestAnimationFrame(() => {
      document.getElementById('order-chat')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [order]);

  const statusOpts = order ? [...statusSelectOptions(order.status)] : [];
  const selectValue = !order
    ? ''
    : statusOpts.length === 0
      ? order.status
      : statusOpts.includes(selectedStatus)
        ? selectedStatus
        : (statusOpts[0] ?? selectedStatus);

  const statusDirty = !!order && statusOpts.length > 0 && selectValue !== order.status;

  const linesTotal = useMemo(() => (order ? orderLinesTotalRub(order.items) : 0), [order]);

  const showPublishedKpBlock =
    !!order &&
    order.status !== ORDER_STATUS_DRAFT &&
    (kpSummaryLoading || kpSummary !== null);

  async function saveStatus() {
    if (!order || statusOpts.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson(`orders/admin/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selectValue }),
      });
      await load();
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new Event('admin-orders-pending-refresh'));
        document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errSaveStatus);
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancelFromDetail() {
    if (!order) return;
    setCancelLoading(true);
    setError(null);
    try {
      await adminBackendJson(`orders/admin/${order.id}`, { method: 'DELETE' });
      setCancelOpen(false);
      document.dispatchEvent(new Event('admin-orders-pending-refresh'));
      document.dispatchEvent(new Event('admin-orders-chat-unread-refresh'));
      router.push('/admin/orders?bucket=new');
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errDeleteOrder);
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return <p className={styles.muted}>{listS.loading}</p>;
  }

  if (error && !order) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!order) {
    return <p className={styles.muted}>{d.notFound}</p>;
  }

  return (
    <>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={`${pn.productFormGrid} ${od.orderDetailGrid}`}>
        <div className={pn.productFormMain}>
          <div className={styles.detailHero}>
            <div className={styles.detailTitleRow} style={{ marginTop: 0 }}>
              <div className={styles.formWide}>
                <label className={styles.label}>
                  <span>{d.labelStatus}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <>
                        <select
                          className={styles.input}
                          style={{ maxWidth: 280 }}
                          value={selectValue}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                          {statusOpts.map((st) => (
                            <option key={st} value={st}>
                              {statusLabels[st] ?? st}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={!statusDirty || saving}
                          onClick={() => void saveStatus()}
                        >
                          {saving ? d.saving : d.save}
                        </button>
                    </>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              <div>
                <div className={styles.cardNote}>{d.labelCreated}</div>
                <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
                  {formatAdminOrderDateTime(order.createdAt, locale)}
                </div>
              </div>
              <div>
                <div className={styles.cardNote}>{d.labelUpdated}</div>
                <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
                  {formatAdminOrderDateTime(order.updatedAt, locale)}
                </div>
              </div>
              <div>
                <div className={styles.cardNote}>{d.labelAccount}</div>
                <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
                  <Link href={`/admin/clients/${encodeURIComponent(order.user.id)}`} className={styles.backLink}>
                    {accountDisplayName(order.user)}
                  </Link>
                </div>
              </div>
              <div>
                <div className={styles.cardNote}>{d.labelEmail}</div>
                <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
                  {order.user.email || '—'}
                </div>
              </div>
              <div>
                <div className={styles.cardNote}>{d.labelPhone}</div>
                <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
                  {order.user.phone || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.sectionClient}</h2>
            <div className={styles.formWide} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>
                <span className={styles.cardNote}>{d.labelFio}</span>
                <br />
                <span className={styles.cardTitle}>{order.customerName?.trim() || '—'}</span>
              </p>
              <p>
                <span className={styles.cardNote}>{d.labelAddress}</span>
                <br />
                <span style={{ whiteSpace: 'pre-wrap' }}>{order.deliveryAddress?.trim() || '—'}</span>
              </p>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{d.sectionItems}</h2>
            {order.items.length === 0 ? (
              <p className={styles.muted}>{d.noItems}</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 54 }} aria-hidden />
                      <th>{d.thProduct}</th>
                      <th>{d.thQtyUnit}</th>
                      <th>{d.thPrice}</th>
                      <th>{d.thLineTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((row) => {
                      const snap = parseSnapshot(row);
                      const meta = orderItemSnapshotMetaRows(snap, {
                        modification: d.snapshotModification,
                        elementFallback: d.snapshotElementFallback,
                      });
                      const unit = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
                      const lineTotal = Number.isFinite(unit) ? unit * row.quantity : NaN;
                      const img = itemImageUrl(row);
                      return (
                        <tr key={row.id}>
                          <td>
                            {img ? (
                              <img
                                className={styles.productListThumb}
                                src={img}
                                alt=""
                                width={46}
                                height={46}
                              />
                            ) : (
                              <div className={styles.productListThumbPh} aria-hidden />
                            )}
                          </td>
                          <td>
                            <Link
                              href={`/admin/catalog/products/${encodeURIComponent(row.product.id)}`}
                              className={styles.backLink}
                            >
                              <div className={styles.cardTitle}>{itemTitle(row)}</div>
                            </Link>
                            {row.product?.brand?.name ? (
                              <div className={styles.cardNote}>{row.product.brand.name}</div>
                            ) : null}
                            {meta.length > 0 ? (
                              <ul className={styles.cardNote} style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {meta.map((m, i) => (
                                  <li key={i}>
                                    {m.label}: {m.value}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </td>
                          <td>{formatQtyUnit(row.quantity, row.unit)}</td>
                          <td>{formatMoneyInt(row.price, order.currency, numberLocale)}</td>
                          <td>
                            {Number.isFinite(lineTotal)
                              ? formatMoneyInt(lineTotal, order.currency, numberLocale)
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td aria-hidden />
                      <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {d.footerSumLabel}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatMoneyInt(linesTotal, order.currency, numberLocale)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showPublishedKpBlock ? (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{d.kpSectionPublished}</h2>
              {kpSummaryLoading ? (
                <p className={styles.muted}>{d.kpPublishedLoading}</p>
              ) : kpSummary && kpSummary.published.length === 0 ? (
                <p className={styles.muted}>{d.kpPublishedNone}</p>
              ) : loadingPublishedKpFull ? (
                <p className={styles.muted}>{d.kpPublishedLoading}</p>
              ) : kpSummary!.published.length > 0 && publishedKpFull.length === 0 ? (
                <p className={styles.error}>{d.kpPublishedDetailError}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {publishedKpFull.map((proposal) => {
                    const kpTotalRub = proposal.lines.reduce((acc, ln) => acc + kpLineTotalRub(ln), 0);
                    const kpTotalRounded = Math.round(kpTotalRub * 100) / 100;
                    const dateStr = proposal.publishedAt
                      ? formatAdminOrderDateTime(proposal.publishedAt, locale)
                      : '—';
                    return (
                      <div key={proposal.id}>
                        <p className={styles.cardNote} style={{ margin: '0 0 12px' }}>
                          {d.kpPublishedVersionCaption(
                            proposal.versionNumber,
                            dateStr,
                            listS.itemsCount(proposal.lines.length),
                          )}
                        </p>
                        {proposal.lines.length === 0 ? (
                          <p className={styles.muted}>{d.noItems}</p>
                        ) : (
                          <div className={styles.tableWrap}>
                            <table className={styles.table}>
                              <thead>
                                <tr>
                                  <th style={{ width: 54 }} aria-hidden />
                                  <th>{d.thProduct}</th>
                                  <th>{d.thQtyUnit}</th>
                                  <th>{d.thPrice}</th>
                                  <th>{d.thLineTotal}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proposal.lines.map((ln) => {
                                  const snap =
                                    ln.snapshot && typeof ln.snapshot === 'object'
                                      ? ln.snapshot
                                      : null;
                                  const meta = orderItemSnapshotMetaRows(snap, {
                                    modification: d.snapshotModification,
                                    elementFallback: d.snapshotElementFallback,
                                  });
                                  const unitEff = kpLineUnitAfterDiscount(ln);
                                  const lineTotal = kpLineTotalRub(ln);
                                  const img = kpLineImageUrl(snap);
                                  const dc = kpDiscountShown(
                                    ln.discountPercent != null && Number.isFinite(ln.discountPercent)
                                      ? ln.discountPercent
                                      : null,
                                  );
                                  return (
                                    <tr key={ln.id}>
                                      <td>
                                        {img ? (
                                          <img
                                            className={styles.productListThumb}
                                            src={img}
                                            alt=""
                                            width={46}
                                            height={46}
                                          />
                                        ) : (
                                          <div className={styles.productListThumbPh} aria-hidden />
                                        )}
                                      </td>
                                      <td>
                                        <Link
                                          href={`/admin/catalog/products/${encodeURIComponent(ln.productId)}`}
                                          className={styles.backLink}
                                        >
                                          <div className={styles.cardTitle}>{kpLineDisplayTitle(snap)}</div>
                                        </Link>
                                        {dc ? (
                                          <div className={styles.cardNote}>
                                            {d.kpDiscountLabel}: {dc}
                                          </div>
                                        ) : null}
                                        {meta.length > 0 ? (
                                          <ul
                                            className={styles.cardNote}
                                            style={{ margin: '8px 0 0', paddingLeft: 18 }}
                                          >
                                            {meta.map((m, mi) => (
                                              <li key={mi}>
                                                {m.label}: {m.value}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : null}
                                      </td>
                                      <td>{formatQtyUnit(ln.quantity, ln.unit)}</td>
                                      <td>{formatMoneyInt(unitEff, order.currency, numberLocale)}</td>
                                      <td>{formatMoneyInt(lineTotal, order.currency, numberLocale)}</td>
                                    </tr>
                                  );
                                })}
                                <tr>
                                  <td aria-hidden />
                                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {d.footerSumLabel}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {formatMoneyInt(kpTotalRounded, order.currency, numberLocale)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className={styles.section}>
            {d.actionsHintPrepareCp.trim() ? (
              <p className={styles.cardNote} style={{ marginBottom: 12 }}>
                {d.actionsHintPrepareCp}
              </p>
            ) : null}
            {kpSummary?.draft ? (
              <p className={styles.cardNote} style={{ marginBottom: 8 }}>
                {locale === 'zh'
                  ? `草稿：${kpSummary.draft.lineCount} 项`
                  : `Черновик КП: ${kpSummary.draft.lineCount} поз.`}
              </p>
            ) : null}
            <div className={styles.toolbar} style={{ marginBottom: 0 }}>
              {order.status !== ORDER_STATUS_DRAFT && order.status !== 'COMPLETED' ? (
                <Link
                  href={`/admin/orders/${encodeURIComponent(order.id)}/kp`}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  {d.actionPrepareCp}
                </Link>
              ) : order.status === ORDER_STATUS_DRAFT ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled
                  title="КП доступно после отправки заказа на согласование"
                >
                  {d.actionPrepareCp}
                </button>
              ) : null}
              {order.status === 'PENDING_APPROVAL' ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => setCancelOpen(true)}
                >
                  {d.actionCancelOrder}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <aside
          id="order-chat"
          className={`${pn.productFormPlacement} ${od.orderDetailPlacement}`}
          aria-label={d.chatAsideAria}
        >
          <AdminOrderSideChat orderId={orderId} />
        </aside>
      </div>

      <AdminOrdersConfirmModal
        open={cancelOpen}
        title={d.cancelModalTitle}
        confirmLabel={d.cancelModalConfirm}
        cancelLabel={d.cancelModalCancel}
        loading={cancelLoading}
        onClose={() => !cancelLoading && setCancelOpen(false)}
        onConfirm={confirmCancelFromDetail}
      >
        <p className={styles.muted} style={{ margin: 0 }}>
          {d.cancelModalReminder}
        </p>
      </AdminOrdersConfirmModal>
    </>
  );
}

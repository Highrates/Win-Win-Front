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
import { downloadCommercialProposalPdf } from '@/lib/commercialProposal/exportCommercialProposalPdf';
import { downloadPiExcel } from '@/lib/commercialProposal/piExcelAdmin';
import { kpLineTotalRub, kpLineUnitAfterDiscount } from '@/lib/commercialProposal/kpOfferTotals';
import type {
  CommercialProposalApi,
  CommercialProposalSummaryApi,
} from '@/lib/commercialProposal/types';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import {
  AdminFlashBanner,
  type AdminFlashBannerState,
} from '@/components/admin/AdminFlashBanner/AdminFlashBanner';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import clientsStyles from '../../clients/clients.module.css';
import pn from '../../catalog/products/new/productNew.module.css';
import od from './orderAdminDetail.module.css';
import { AdminOrderSideChat } from './AdminOrderSideChat';
import { AdminOrdersConfirmModal } from '../AdminOrdersConfirmModal';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import { ORDER_STATUS_DRAFT, ORDER_STATUS_FLOW } from '@/lib/orders/orderStatus';

type CustomerKpDecisionCode = 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED';

type CustomerKpRequisites = {
  legalType?: string | null;
  contactName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  inn?: string | null;
  kpp?: string | null;
  legalAddress?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bic?: string | null;
  correspondentAccount?: string | null;
};

type AdminOrderDetail = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  comment: string | null;
  adminNotes?: string | null;
  customerName: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  updatedAt: string;
  customerKpDecision?: CustomerKpDecisionCode | null;
  customerKpDecisionAt?: string | null;
  customerKpDecisionVersion?: number | null;
  customerKpRequisites?: CustomerKpRequisites | null;
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

function parseCustomerKpRequisites(raw: unknown): CustomerKpRequisites | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as CustomerKpRequisites;
}

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
  const [expandedKpVersion, setExpandedKpVersion] = useState<number | null>(null);
  const [publishedKpByVersion, setPublishedKpByVersion] = useState<
    Record<number, CommercialProposalApi | 'loading' | 'error'>
  >({});
  const [pdfBusyById, setPdfBusyById] = useState<Record<string, string>>({});
  const [excelBusyById, setExcelBusyById] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<AdminFlashBannerState>(null);
  const clearFlash = useCallback(() => setFlash(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBackendJson<AdminOrderDetail>(`orders/admin/${orderId}`);
      setOrder(res);
      setSelectedStatus(res.status);
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
      setExpandedKpVersion(null);
      setPublishedKpByVersion({});
      return;
    }
    setExpandedKpVersion(kpSummary.published[0]!.versionNumber);
    setPublishedKpByVersion({});
  }, [kpSummary?.published, order?.status]);

  const loadPublishedVersion = useCallback(
    async (version: number) => {
      let skip = false;
      setPublishedKpByVersion((prev) => {
        if (prev[version] && prev[version] !== 'error') {
          skip = true;
          return prev;
        }
        return { ...prev, [version]: 'loading' };
      });
      if (skip) return;
      try {
        const row = await adminBackendJson<CommercialProposalApi>(
          `orders/admin/${encodeURIComponent(orderId)}/commercial-proposals/published/${version}`,
        );
        setPublishedKpByVersion((prev) => ({ ...prev, [version]: row }));
      } catch {
        setPublishedKpByVersion((prev) => ({ ...prev, [version]: 'error' }));
      }
    },
    [orderId],
  );

  useEffect(() => {
    if (expandedKpVersion == null || order?.status === ORDER_STATUS_DRAFT) return;
    void loadPublishedVersion(expandedKpVersion);
  }, [expandedKpVersion, loadPublishedVersion, order?.status]);

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
      <AdminFlashBanner flash={flash} onClear={clearFlash} dismissLabel={d.flashDismiss} />

      <div className={`${pn.productFormGrid} ${od.orderDetailGrid}`}>
        <div className={pn.productFormMain}>
          <div className={od.statusRow}>
            <AdminSelect
              label={d.labelStatus}
              className={od.statusSelect}
              value={selectValue}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOpts.map((st) => (
                <option key={st} value={st}>
                  {statusLabels[st] ?? st}
                </option>
              ))}
            </AdminSelect>
            <AdminCompactBtn
              type="button"
              variant="accent"
              disabled={!statusDirty || saving}
              onClick={() => void saveStatus()}
            >
              {saving ? d.saving : d.save}
            </AdminCompactBtn>
          </div>
          {order.status === 'PENDING_APPROVAL' ? (
            <p className={`${styles.cardNote} ${od.statusHint}`}>{d.statusPendingHint}</p>
          ) : null}

          <dl className={clientsStyles.detailList}>
            <div>
              <dt>{d.labelCreated}</dt>
              <dd>{formatAdminOrderDateTime(order.createdAt, locale)}</dd>
            </div>
            <div>
              <dt>{d.labelUpdated}</dt>
              <dd>{formatAdminOrderDateTime(order.updatedAt, locale)}</dd>
            </div>
            <div>
              <dt>{d.labelAccount}</dt>
              <dd>
                <Link href={`/admin/clients/${encodeURIComponent(order.user.id)}`} className={styles.backLink}>
                  {accountDisplayName(order.user)}
                </Link>
              </dd>
            </div>
            <div>
              <dt>{d.labelEmail}</dt>
              <dd>{order.user.email || '—'}</dd>
            </div>
            <div>
              <dt>{d.labelPhone}</dt>
              <dd>{order.user.phone || '—'}</dd>
            </div>
          </dl>

          <div className={styles.section}>
            <h2 className={styles.groupHeading}>{d.sectionClient}</h2>
            <dl className={clientsStyles.detailList}>
              <div>
                <dt>{d.labelFio}</dt>
                <dd>{order.customerName?.trim() || '—'}</dd>
              </div>
              <div>
                <dt>{d.labelAddress}</dt>
                <dd className={od.preWrap}>{order.deliveryAddress?.trim() || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.section}>
            <h2 className={styles.groupHeading}>{d.sectionItems}</h2>
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
                              <ul className={`${styles.cardNote} ${od.itemMetaList}`}>
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
              <h2 className={styles.groupHeading}>{d.kpSectionPublished}</h2>
              {kpSummaryLoading ? (
                <p className={styles.muted}>{d.kpPublishedLoading}</p>
              ) : kpSummary && kpSummary.published.length === 0 ? (
                <p className={styles.muted}>{d.kpPublishedNone}</p>
              ) : (
                <div className={od.kpPublishedStack}>
                  {(kpSummary?.published ?? []).map((meta) => {
                    const open = expandedKpVersion === meta.versionNumber;
                    const cached = publishedKpByVersion[meta.versionNumber];
                    const proposal = typeof cached === 'object' ? cached : null;
                    const dateStr = meta.publishedAt
                      ? formatAdminOrderDateTime(meta.publishedAt, locale)
                      : '—';
                    const pdfBusyLabel = pdfBusyById[meta.id];
                    return (
                      <div key={meta.id} className={od.kpVersionAccordion}>
                        <div className={od.kpVersionCaptionRow}>
                          <button
                            type="button"
                            className={od.kpVersionToggle}
                            aria-expanded={open}
                            onClick={() =>
                              setExpandedKpVersion((cur) =>
                                cur === meta.versionNumber ? null : meta.versionNumber,
                              )
                            }
                          >
                            <img
                              src="/icons/arrow.svg"
                              alt=""
                              width={18}
                              height={18}
                              className={`${od.kpVersionArrow} ${open ? od.kpVersionArrowOpen : ''}`}
                              aria-hidden
                            />
                            <p className={`${styles.cardNote} ${od.kpVersionCaption}`}>
                              {d.kpPublishedVersionCaption(
                                meta.versionNumber,
                                dateStr,
                                listS.itemsCount(meta.lineCount),
                              )}
                            </p>
                          </button>
                          <div className={od.kpVersionActions}>
                            <AdminCompactBtn
                              type="button"
                              variant="outline"
                              disabled={Boolean(pdfBusyLabel) || meta.lineCount === 0}
                              onClick={() => {
                                if (pdfBusyById[meta.id]) return;
                                const run = async () => {
                                  let full = proposal;
                                  if (!full) {
                                    setPublishedKpByVersion((prev) => ({
                                      ...prev,
                                      [meta.versionNumber]: 'loading',
                                    }));
                                    try {
                                      full = await adminBackendJson<CommercialProposalApi>(
                                        `orders/admin/${encodeURIComponent(order.id)}/commercial-proposals/published/${meta.versionNumber}`,
                                      );
                                      setPublishedKpByVersion((prev) => ({
                                        ...prev,
                                        [meta.versionNumber]: full!,
                                      }));
                                    } catch {
                                      setPublishedKpByVersion((prev) => ({
                                        ...prev,
                                        [meta.versionNumber]: 'error',
                                      }));
                                      setFlash({ kind: 'error', text: d.kpPublishedDetailError });
                                      return;
                                    }
                                  }
                                  if (!full.lines.length) return;
                                  setPdfBusyById((prev) => ({ ...prev, [meta.id]: d.actionPdfBusy }));
                                  try {
                                    const r = await downloadCommercialProposalPdf({
                                      orderId: order.id,
                                      proposal: full,
                                      onProgress: (p) =>
                                        setPdfBusyById((prev) => ({
                                          ...prev,
                                          [meta.id]: p.label || d.actionPdfBusy,
                                        })),
                                    });
                                    if (r.failedImageCount > 0) {
                                      setFlash({
                                        kind: 'ok',
                                        text: d.pdfSavedWithImageWarnings(r.failedImageCount),
                                      });
                                    }
                                  } catch (e) {
                                    setFlash({
                                      kind: 'error',
                                      text: e instanceof Error ? e.message : d.errPdf,
                                    });
                                  } finally {
                                    setPdfBusyById((prev) => {
                                      const next = { ...prev };
                                      delete next[meta.id];
                                      return next;
                                    });
                                  }
                                };
                                void run();
                              }}
                            >
                              {pdfBusyLabel ?? d.actionPdf}
                            </AdminCompactBtn>
                            <AdminCompactBtn
                              type="button"
                              variant="outline"
                              disabled={Boolean(excelBusyById[meta.id]) || meta.lineCount === 0}
                              title={d.excelSheetProtectHint}
                              onClick={() => {
                                if (excelBusyById[meta.id]) return;
                                setExcelBusyById((prev) => ({ ...prev, [meta.id]: true }));
                                void downloadPiExcel(
                                  `orders/admin/${encodeURIComponent(order.id)}/commercial-proposals/excel?source=published&version=${meta.versionNumber}`,
                                  `PI-order-v${meta.versionNumber}.xlsx`,
                                )
                                  .catch((e) => {
                                    setFlash({
                                      kind: 'error',
                                      text: e instanceof Error ? e.message : d.errExcelExport,
                                    });
                                  })
                                  .finally(() => {
                                    setExcelBusyById((prev) => {
                                      const next = { ...prev };
                                      delete next[meta.id];
                                      return next;
                                    });
                                  });
                              }}
                            >
                              {excelBusyById[meta.id]
                                ? d.excelBusy
                                : d.actionExcelVersion(meta.versionNumber)}
                            </AdminCompactBtn>
                          </div>
                        </div>
                        {open ? (
                          <div className={od.kpVersionPanel}>
                            {cached === 'loading' || cached == null ? (
                              <p className={styles.muted}>{d.kpPublishedLoading}</p>
                            ) : cached === 'error' ? (
                              <p className={styles.error}>{d.kpPublishedDetailError}</p>
                            ) : proposal!.lines.length === 0 ? (
                              <p className={styles.muted}>{d.noItems}</p>
                            ) : (
                              (() => {
                                const kpTotalRub = proposal!.lines.reduce(
                                  (acc, ln) => acc + kpLineTotalRub(ln),
                                  0,
                                );
                                const kpTotalRounded = Math.round(kpTotalRub * 100) / 100;
                                return (
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
                                        {proposal!.lines.map((ln) => {
                                          const snap =
                                            ln.snapshot && typeof ln.snapshot === 'object'
                                              ? ln.snapshot
                                              : null;
                                          const rows = orderItemSnapshotMetaRows(snap, {
                                            modification: d.snapshotModification,
                                            elementFallback: d.snapshotElementFallback,
                                          });
                                          const unitEff = kpLineUnitAfterDiscount(ln);
                                          const lineTotal = kpLineTotalRub(ln);
                                          const img = kpLineImageUrl(snap);
                                          const dc = kpDiscountShown(
                                            ln.discountPercent != null &&
                                              Number.isFinite(ln.discountPercent)
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
                                                  <div
                                                    className={styles.productListThumbPh}
                                                    aria-hidden
                                                  />
                                                )}
                                              </td>
                                              <td>
                                                <Link
                                                  href={`/admin/catalog/products/${encodeURIComponent(ln.productId)}`}
                                                  className={styles.backLink}
                                                >
                                                  <div className={styles.cardTitle}>
                                                    {kpLineDisplayTitle(snap)}
                                                  </div>
                                                </Link>
                                                {dc ? (
                                                  <div className={styles.cardNote}>
                                                    {d.kpDiscountLabel}: {dc}
                                                  </div>
                                                ) : null}
                                                {rows.length > 0 ? (
                                                  <ul
                                                    className={`${styles.cardNote} ${od.itemMetaList}`}
                                                  >
                                                    {rows.map((m, mi) => (
                                                      <li key={mi}>
                                                        {m.label}: {m.value}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : null}
                                              </td>
                                              <td>{formatQtyUnit(ln.quantity, ln.unit)}</td>
                                              <td>
                                                {formatMoneyInt(unitEff, order.currency, numberLocale)}
                                              </td>
                                              <td>
                                                {formatMoneyInt(
                                                  lineTotal,
                                                  order.currency,
                                                  numberLocale,
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                        <tr>
                                          <td aria-hidden />
                                          <td
                                            colSpan={3}
                                            style={{ textAlign: 'right', fontWeight: 600 }}
                                          >
                                            {d.footerSumLabel}
                                          </td>
                                          <td style={{ fontWeight: 600 }}>
                                            {formatMoneyInt(
                                              kpTotalRounded,
                                              order.currency,
                                              numberLocale,
                                            )}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {showPublishedKpBlock || order.customerKpDecision ? (
            <div className={styles.section}>
              <h2 className={styles.groupHeading}>{d.kpSectionCustomerResponse}</h2>
              {!order.customerKpDecision ? (
                <p className={styles.muted}>{d.kpCustomerNoResponse}</p>
              ) : (
                <dl className={clientsStyles.detailList}>
                  <div>
                    <dt>{d.labelStatus}</dt>
                    <dd>
                      {order.customerKpDecision === 'ACCEPTED'
                        ? d.kpCustomerDecisionAccepted
                        : order.customerKpDecision === 'REJECTED'
                          ? d.kpCustomerDecisionRejected
                          : d.kpCustomerDecisionChanges}
                    </dd>
                  </div>
                  {order.customerKpDecisionVersion != null ? (
                    <div>
                      <dt>{d.kpCustomerDecisionVersion}</dt>
                      <dd>{order.customerKpDecisionVersion}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>{d.kpCustomerDecisionAt}</dt>
                    <dd>
                      {order.customerKpDecisionAt
                        ? formatAdminOrderDateTime(order.customerKpDecisionAt, locale)
                        : '—'}
                    </dd>
                  </div>
                  {order.customerKpDecision === 'ACCEPTED'
                    ? (() => {
                        const req =
                          parseCustomerKpRequisites(order.customerKpRequisites) ??
                          order.customerKpRequisites ??
                          null;
                        if (!req) return null;
                        const legal =
                          req.legalType === 'IE'
                            ? d.kpCustomerLegalIe
                            : req.legalType === 'LLC'
                              ? d.kpCustomerLegalLlc
                              : d.kpCustomerLegalIndividual;
                        return (
                          <>
                            <div>
                              <dt>{d.kpCustomerRequisitesHeading}</dt>
                              <dd>{legal}</dd>
                            </div>
                            {req.contactName?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqContact}</dt>
                                <dd>{req.contactName.trim()}</dd>
                              </div>
                            ) : null}
                            {req.phone?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqPhone}</dt>
                                <dd>{req.phone.trim()}</dd>
                              </div>
                            ) : null}
                            {req.companyName?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqCompany}</dt>
                                <dd>{req.companyName.trim()}</dd>
                              </div>
                            ) : null}
                            {req.inn?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqInn}</dt>
                                <dd>{req.inn.trim()}</dd>
                              </div>
                            ) : null}
                            {req.kpp?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqKpp}</dt>
                                <dd>{req.kpp.trim()}</dd>
                              </div>
                            ) : null}
                            {req.legalAddress?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqLegalAddress}</dt>
                                <dd className={od.preWrap}>{req.legalAddress.trim()}</dd>
                              </div>
                            ) : null}
                            {req.bankName?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqBankName}</dt>
                                <dd>{req.bankName.trim()}</dd>
                              </div>
                            ) : null}
                            {req.bankAccount?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqBankAccount}</dt>
                                <dd>{req.bankAccount.trim()}</dd>
                              </div>
                            ) : null}
                            {req.bic?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqBic}</dt>
                                <dd>{req.bic.trim()}</dd>
                              </div>
                            ) : null}
                            {req.correspondentAccount?.trim() ? (
                              <div>
                                <dt>{d.kpCustomerReqCorrAccount}</dt>
                                <dd>{req.correspondentAccount.trim()}</dd>
                              </div>
                            ) : null}
                          </>
                        );
                      })()
                    : null}
                </dl>
              )}
            </div>
          ) : null}

          <div className={styles.section}>
            {d.actionsHintPrepareCp.trim() ? (
              <p className={`${styles.cardNote} ${od.actionsHint}`}>{d.actionsHintPrepareCp}</p>
            ) : null}
            {kpSummary?.draft ? (
              <p className={`${styles.cardNote} ${od.draftHint}`}>
                {d.kpDraftLineCount(kpSummary.draft.lineCount)}
              </p>
            ) : null}
            <div className={styles.formActions}>
              {order.status !== ORDER_STATUS_DRAFT && order.status !== 'COMPLETED' ? (
                <AdminCompactBtnLink
                  href={`/admin/orders/${encodeURIComponent(order.id)}/kp`}
                  variant="accent"
                >
                  {d.actionPrepareCp}
                </AdminCompactBtnLink>
              ) : order.status === ORDER_STATUS_DRAFT ? (
                <AdminCompactBtn
                  type="button"
                  variant="accent"
                  disabled
                  title={d.actionKpDisabledDraft}
                >
                  {d.actionPrepareCp}
                </AdminCompactBtn>
              ) : null}
              {order.status === 'PENDING_APPROVAL' ? (
                <AdminCompactBtn type="button" variant="danger" onClick={() => setCancelOpen(true)}>
                  {d.actionCancelOrder}
                </AdminCompactBtn>
              ) : null}
            </div>
          </div>
        </div>

        <aside
          id="order-chat"
          className={`${pn.productFormPlacement} ${od.orderDetailPlacement}`}
          aria-label={d.chatAsideAria}
        >
          <AdminOrderSideChat orderId={orderId} initialAdminNotes={order.adminNotes ?? ''} />
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

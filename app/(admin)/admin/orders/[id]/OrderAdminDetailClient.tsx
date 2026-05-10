'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import {
  adminOrderDetailStrings,
  adminOrderStatusLabels,
  adminOrdersStrings,
} from '@/lib/admin-i18n/adminOrdersI18n';
import styles from '../../catalog/catalogAdmin.module.css';

/** Все статусы Prisma — чтобы корректно отображать черновик и т.д. */
const DETAIL_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'ORDERED', 'PAID', 'RECEIVED'] as const;
type DetailOrderStatus = (typeof DETAIL_STATUSES)[number];

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
  user: { id: string; email: string | null; phone: string | null };
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

function formatMoney(amount: string | number, currency: string, numberLocale: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string, dateLocale: string): string {
  try {
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function metaRowsFromSnapshot(
  snapshot: Record<string, unknown> | null,
  labels: { modification: string; elementFallback: string },
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (!snapshot) return rows;
  const mod = snapshot.modificationLabel;
  if (typeof mod === 'string' && mod.trim()) {
    rows.push({ label: labels.modification, value: mod.trim() });
  }
  const em = snapshot.elementMaterialRows;
  if (Array.isArray(em)) {
    for (const row of em) {
      if (row && typeof row === 'object' && 'elementLabel' in row && 'materialColorLabel' in row) {
        const el = (row as { elementLabel?: unknown }).elementLabel;
        const mat = (row as { materialColorLabel?: unknown }).materialColorLabel;
        if (typeof el === 'string' && typeof mat === 'string') {
          rows.push({ label: el.trim() || labels.elementFallback, value: mat.trim() || '—' });
        }
      }
    }
  }
  return rows;
}

export function OrderAdminDetailClient({ orderId }: { orderId: string }) {
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const listS = useMemo(() => adminOrdersStrings(locale), [locale]);
  const statusLabels = useMemo(() => adminOrderStatusLabels(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);

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

  const selectValue =
    order && DETAIL_STATUSES.includes(selectedStatus as DetailOrderStatus)
      ? selectedStatus
      : order?.status && DETAIL_STATUSES.includes(order.status as DetailOrderStatus)
        ? order.status
        : 'ORDERED';

  const statusDirty = !!order && selectValue !== order.status;

  async function saveStatus() {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson(`orders/admin/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selectValue }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : d.errSaveStatus);
    } finally {
      setSaving(false);
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

  const statusLabel =
    statusLabels[order.status] ?? order.status;

  return (
    <>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.detailHero}>
        <p className={styles.cardNote}>
          <span className={styles.badge}>{statusLabel}</span>
        </p>
        <div className={styles.detailTitleRow} style={{ marginTop: 12 }}>
          <div className={styles.formWide}>
            <label className={styles.label}>
              <span>{d.labelStatus}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <select
                  className={styles.input}
                  style={{ maxWidth: 280 }}
                  value={selectValue}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {DETAIL_STATUSES.map((st) => (
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
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{d.sectionMeta}</h2>
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div>
            <div className={styles.cardNote}>{d.labelCreated}</div>
            <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
              {formatDate(order.createdAt, dateLocale)}
            </div>
          </div>
          <div>
            <div className={styles.cardNote}>{d.labelUpdated}</div>
            <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
              {formatDate(order.updatedAt, dateLocale)}
            </div>
          </div>
          <div>
            <div className={styles.cardNote}>{d.labelTotal}</div>
            <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
              {formatMoney(order.totalAmount, order.currency, numberLocale)}
            </div>
          </div>
          <div>
            <div className={styles.cardNote}>{d.labelCurrency}</div>
            <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
              {order.currency}
            </div>
          </div>
          <div>
            <div className={styles.cardNote}>{d.labelUserId}</div>
            <div className={styles.cardTitle} style={{ margin: '4px 0 0' }}>
              <code style={{ fontSize: '0.8125rem' }}>{order.user.id}</code>
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
        <h2 className={styles.sectionTitle}>{d.sectionComment}</h2>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {order.comment?.trim() ? order.comment.trim() : d.emptyComment}
        </p>
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
                  <th>{d.thQty}</th>
                  <th>{d.thUnit}</th>
                  <th>{d.thPrice}</th>
                  <th>{d.thLineTotal}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {order.items.map((row) => {
                  const snap = parseSnapshot(row);
                  const meta = metaRowsFromSnapshot(snap, {
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
                        <div className={styles.cardTitle}>{itemTitle(row)}</div>
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
                      <td>{row.quantity}</td>
                      <td>{row.unit}</td>
                      <td>{formatMoney(row.price, order.currency, numberLocale)}</td>
                      <td>
                        {Number.isFinite(lineTotal)
                          ? formatMoney(lineTotal, order.currency, numberLocale)
                          : '—'}
                      </td>
                      <td>
                        <Link href={`/admin/catalog/products/${row.product.id}`} className={styles.backLink}>
                          {d.openProduct}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{d.sectionDocs}</h2>
        {order.documentUrls && typeof order.documentUrls === 'object' && !Array.isArray(order.documentUrls) ? (
          (() => {
            const entries = Object.entries(order.documentUrls).filter(
              ([, v]) => typeof v === 'string' && (v as string).trim(),
            ) as [string, string][];
            if (entries.length === 0) {
              return <p className={styles.muted}>{d.noDocs}</p>;
            }
            return (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {entries.map(([key, url]) => (
                  <li key={key} style={{ marginBottom: 6 }}>
                    <span className={styles.cardNote}>{key}: </span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.backLink}>
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            );
          })()
        ) : (
          <p className={styles.muted}>{d.noDocs}</p>
        )}
      </div>
    </>
  );
}

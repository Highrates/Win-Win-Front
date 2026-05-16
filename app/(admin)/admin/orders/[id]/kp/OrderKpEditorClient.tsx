'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import type { CommercialProposalApi, CommercialProposalLineApi, CommercialProposalSummaryApi } from '@/lib/commercialProposal/types';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import styles from '../../../catalog/catalogAdmin.module.css';
import { kpGrossTotals } from '@/lib/commercialProposal/kpGrossDimensions';
import { KpGrossDisplay, KpGrossTotalsDisplay } from '@/components/commercialProposal/KpGrossDisplay';
import { kpLineTotalRub, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import { OrderKpGrossEditModal } from './OrderKpGrossEditModal';
import { OrderKpPublishConfirmModal, type NextOrderStatusChoice } from './OrderKpPublishConfirmModal';
import { OrderKpReplaceModal } from './OrderKpReplaceModal';

const iconBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 4,
};

function lineTitle(snap: Record<string, unknown> | null): string {
  if (snap && typeof snap.productName === 'string' && snap.productName.trim()) return snap.productName.trim();
  return '—';
}

function parseOfferPriceInput(raw: string): number {
  const t = raw
    .replace(/\u00a0/g, ' ')
    .replace(/\s/g, '')
    .replace(/₽/g, '')
    .replace(/руб\.?/gi, '')
    .replace(',', '.');
  if (t === '' || t === '.') return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function formatOfferPriceInput(n: number, numberLocale: string): string {
  if (!Number.isFinite(n)) return '';
  const s = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(n);
  return `${s}\u00a0₽`;
}

function OfferUnitPriceField({
  value,
  numberLocale,
  onChange,
  className,
}: {
  value: number;
  numberLocale: string;
  onChange: (n: number) => void;
  className?: string;
}) {
  const formatted = useMemo(() => formatOfferPriceInput(value, numberLocale), [value, numberLocale]);

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      style={{ width: 200 }}
      value={formatted}
      onChange={(e) => onChange(parseOfferPriceInput(e.target.value))}
    />
  );
}

export function OrderKpEditorClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [summary, setSummary] = useState<CommercialProposalSummaryApi | null>(null);
  const [lines, setLines] = useState<CommercialProposalLineApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [needsInit, setNeedsInit] = useState(false);
  const [replaceLineIndex, setReplaceLineIndex] = useState<number | null>(null);
  const [grossEditLineIndex, setGrossEditLineIndex] = useState<number | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [nextOrderStatus, setNextOrderStatus] = useState<NextOrderStatusChoice>('PROPOSAL_FORMED');

  const basePath = `orders/admin/${encodeURIComponent(orderId)}/commercial-proposals`;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, ord] = await Promise.all([
        adminBackendJson<CommercialProposalSummaryApi>(basePath),
        adminBackendJson<{ status: string }>(`orders/admin/${encodeURIComponent(orderId)}`).catch(() => null),
      ]);
      setSummary(s);
      setOrderStatus(ord?.status ?? null);
      try {
        const dr = await adminBackendJson<CommercialProposalApi>(`${basePath}/draft`);
        setLines(dr.lines);
        setNeedsInit(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (
          msg.includes('404') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('не найден')
        ) {
          setLines([]);
          setNeedsInit(true);
        } else throw e;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setSummary(null);
      setLines([]);
      setOrderStatus(null);
    } finally {
      setLoading(false);
    }
  }, [basePath, orderId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function initDraft(fromPublishedProposalId?: string) {
    setError(null);
    try {
      const dr = await adminBackendJson<CommercialProposalApi>(`${basePath}/draft/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fromPublishedProposalId ? { fromPublishedProposalId } : {}),
      });
      setLines(dr.lines);
      setNeedsInit(false);
      const s = await adminBackendJson<CommercialProposalSummaryApi>(basePath);
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать черновик');
    }
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    try {
      const sorted = [...lines].map((l, i) => ({ ...l, sortOrder: i }));
      const dr = await adminBackendJson<CommercialProposalApi>(`${basePath}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: sorted.map((l) => ({
            sourceOrderItemId: l.sourceOrderItemId,
            sortOrder: l.sortOrder,
            productId: l.productId,
            productVariantId: l.productVariantId,
            quantity: l.quantity,
            unit: l.unit,
            snapshot: l.snapshot ?? undefined,
            offerUnitPrice: l.offerUnitPrice,
            discountPercent: l.discountPercent,
            deliveryEta: l.deliveryEta,
            lineNote: null,
          })),
        }),
      });
      setLines(dr.lines);
      const s = await adminBackendJson<CommercialProposalSummaryApi>(basePath);
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function executePublish() {
    setPublishing(true);
    setError(null);
    try {
      await saveDraft();
      const publishBody =
        orderStatus === 'PENDING_APPROVAL' ? { nextOrderStatus: nextOrderStatus as NextOrderStatusChoice } : {};
      await adminBackendJson<{ versionNumber: number }>(`${basePath}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishBody),
      });
      setPublishConfirmOpen(false);
      await loadAll();
      router.push(`/admin/orders/${encodeURIComponent(orderId)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось опубликовать');
    } finally {
      setPublishing(false);
    }
  }

  function updateLine(i: number, patch: Partial<CommercialProposalLineApi>) {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  const kpTotals = useMemo(() => kpOfferAggregates(lines), [lines]);
  const grossTotals = useMemo(() => kpGrossTotals(lines), [lines]);
  const avgDiscountPctLabel = `${Math.round(kpTotals.avgDiscountPercent * 10) / 10}%`;

  const publishedHint =
    summary && summary.published.length > 0
      ? `Опубликовано: v${summary.published[0]!.versionNumber} (${summary.published[0]!.lineCount} поз.)`
      : d.kpNotSentYet;

  const publishConfirmLabels = useMemo(
    () => ({
      title: d.kpPublishConfirmTitle,
      cancel: d.kpPublishConfirmCancel,
      submit: d.kpPublishConfirmSubmit,
      submitting: d.kpPublishConfirmSending,
    }),
    [d],
  );

  useEffect(() => {
    if (publishConfirmOpen && orderStatus === 'PENDING_APPROVAL') {
      setNextOrderStatus('PROPOSAL_FORMED');
    }
  }, [publishConfirmOpen, orderStatus]);

  return (
    <div>
      <p className={styles.cardNote} style={{ marginBottom: 16 }}>
        <Link href={`/admin/orders/${encodeURIComponent(orderId)}`} className={styles.backLink}>
          {d.backList}
        </Link>
      </p>
      <p className={styles.cardNote}>{publishedHint}</p>
      {summary?.draft ? (
        <p className={styles.cardNote}>
          Черновик: {summary.draft.lineCount} поз. · обновлён {new Date(summary.draft.updatedAt).toLocaleString(numberLocale)}
        </p>
      ) : null}

      {loading ? <p className={styles.cardNote}>Загрузка…</p> : null}
      {error ? (
        <p style={{ color: 'var(--color-red, #c53029)' }} role="alert">
          {error}
        </p>
      ) : null}

      {needsInit && !loading ? (
        <div className={styles.section} style={{ marginTop: 16 }}>
          <p className={styles.cardTitle}>Создать черновик КП из состава заказа</p>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void initDraft()}>
            Создать черновик
          </button>
          {summary && summary.published.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <p className={styles.cardNote}>Или скопировать в новый черновик опубликованную версию:</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {summary.published.map((p) => (
                  <li key={p.id} style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      className={styles.backLink}
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                      onClick={() => void initDraft(p.id)}
                    >
                      Копия КП v{p.versionNumber} ({p.lineCount} поз.)
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !needsInit ? (
        <>
          <div className={styles.section} style={{ marginTop: 16 }}>
            <div className={styles.toolbar} style={{ marginBottom: 12 }}>
              <button type="button" className={styles.btn} disabled={saving} onClick={() => void saveDraft()}>
                {saving ? 'Сохранение…' : 'Сохранить черновик'}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={publishing || lines.length === 0}
                onClick={() => setPublishConfirmOpen(true)}
              >
                {publishing ? d.kpPublishing : d.kpPublish}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{d.thProduct}</th>
                    <th>Конфигурация</th>
                    <th>Габариты брутто</th>
                    <th>{d.kpQtyPieces}</th>
                    <th>{d.thPrice}</th>
                    <th>Скидка %</th>
                    <th>Срок поставки</th>
                    <th>{d.thLineTotal}</th>
                    <th scope="col" style={{ width: 48 }} aria-label={d.kpBtnReplace}>
                      <img src="/icons/change-product.svg" alt="" width={24} height={24} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const snap = line.snapshot && typeof line.snapshot === 'object' ? line.snapshot : null;
                    const meta = orderItemSnapshotMetaRows(snap, {
                      modification: d.snapshotModification,
                      elementFallback: d.snapshotElementFallback,
                    });
                    return (
                      <tr key={line.id}>
                        <td>
                          <span className={styles.cardTitle} style={{ fontSize: '0.9375rem' }}>
                            {lineTitle(snap)}
                          </span>
                        </td>
                        <td>
                          {meta.length ? (
                            <ul className={styles.cardNote} style={{ margin: 0, paddingLeft: 16 }}>
                              {meta.map((m, k) => (
                                <li key={k}>
                                  {m.label}: {m.value}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <KpGrossDisplay
                              snapshot={snap}
                              className={styles.cardNote}
                              style={{ fontSize: '0.8125rem', flex: 1 }}
                            />
                            <button
                              type="button"
                              style={{ ...iconBtnStyle, flexShrink: 0 }}
                              aria-label="Редактировать габариты брутто"
                              title="Редактировать габариты брутто"
                              onClick={() => setGrossEditLineIndex(i)}
                            >
                              <img src="/icons/edit.svg" alt="" width={20} height={20} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <input
                              className={styles.input}
                              type="number"
                              min={1}
                              style={{ width: 72 }}
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                              }
                            />
                            <input
                              className={styles.input}
                              style={{ width: 56 }}
                              value={line.unit}
                              onChange={(e) => updateLine(i, { unit: e.target.value })}
                              aria-label={d.thUnit}
                            />
                          </div>
                        </td>
                        <td>
                          <OfferUnitPriceField
                            className={styles.input}
                            value={line.offerUnitPrice}
                            numberLocale={numberLocale}
                            onChange={(n) => updateLine(i, { offerUnitPrice: n })}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.input}
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            style={{ width: 72 }}
                            value={line.discountPercent ?? ''}
                            placeholder="0"
                            onChange={(e) => {
                              const v = e.target.value;
                              updateLine(i, {
                                discountPercent: v === '' ? null : parseFloat(v) || 0,
                              });
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.input}
                            style={{ width: 120 }}
                            value={line.deliveryEta ?? ''}
                            placeholder="65–80 дн."
                            onChange={(e) => updateLine(i, { deliveryEta: e.target.value || null })}
                          />
                        </td>
                        <td>
                          {new Intl.NumberFormat(numberLocale, {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(kpLineTotalRub(line))}
                        </td>
                        <td>
                          <button
                            type="button"
                            style={iconBtnStyle}
                            aria-label={d.kpBtnReplace}
                            title={d.kpBtnReplace}
                            onClick={() => setReplaceLineIndex(i)}
                          >
                            <img src="/icons/change-product.svg" alt="" width={24} height={24} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {lines.length > 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.cardNote}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 24,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            {grossTotals.hasAny ? (
                              <>
                                <strong>Итого (брутто):</strong>{' '}
                                <KpGrossTotalsDisplay totals={grossTotals} />
                              </>
                            ) : null}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              flexWrap: 'wrap',
                              marginLeft: 'auto',
                            }}
                          >
                            <strong>Итого:</strong>
                            <span className={styles.cardNote} style={{ textDecoration: 'line-through' }}>
                              {new Intl.NumberFormat(numberLocale, {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(kpTotals.oldTotalRub)}
                            </span>
                            <span style={{ color: 'var(--color-red)' }}>{avgDiscountPctLabel}</span>
                            <strong>
                              {new Intl.NumberFormat(numberLocale, {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(kpTotals.newTotalRub)}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <OrderKpPublishConfirmModal
        open={publishConfirmOpen}
        orderId={orderId}
        lines={lines}
        lineCount={lines.length}
        totals={kpTotals}
        numberLocale={numberLocale}
        labels={publishConfirmLabels}
        publishing={publishing}
        showNextStatus={orderStatus === 'PENDING_APPROVAL'}
        nextOrderStatus={nextOrderStatus}
        onNextOrderStatus={setNextOrderStatus}
        onClose={() => {
          if (!publishing) setPublishConfirmOpen(false);
        }}
        onConfirm={() => void executePublish()}
      />

      <OrderKpReplaceModal
        open={replaceLineIndex != null}
        onClose={() => setReplaceLineIndex(null)}
        onApply={({ productId, productVariantId, snapshot }) => {
          if (replaceLineIndex == null) return;
          const idx = replaceLineIndex;
          setReplaceLineIndex(null);
          setLines((prev) =>
            prev.map((l, j) =>
              j === idx
                ? {
                    ...l,
                    productId,
                    productVariantId,
                    snapshot,
                    sourceOrderItemId: null,
                  }
                : l,
            ),
          );
        }}
      />

      <OrderKpGrossEditModal
        open={grossEditLineIndex != null}
        productName={lineTitle(
          grossEditLineIndex != null &&
            lines[grossEditLineIndex]?.snapshot &&
            typeof lines[grossEditLineIndex].snapshot === 'object'
            ? (lines[grossEditLineIndex].snapshot as Record<string, unknown>)
            : null,
        )}
        snapshot={
          grossEditLineIndex != null &&
          lines[grossEditLineIndex]?.snapshot &&
          typeof lines[grossEditLineIndex].snapshot === 'object'
            ? (lines[grossEditLineIndex].snapshot as Record<string, unknown>)
            : null
        }
        onClose={() => setGrossEditLineIndex(null)}
        onSave={(nextSnap) => {
          if (grossEditLineIndex == null) return;
          const idx = grossEditLineIndex;
          setGrossEditLineIndex(null);
          updateLine(idx, { snapshot: nextSnap });
        }}
      />
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { PiExcelImportDiffModal } from '@/components/admin/PiExcelImportDiffModal/PiExcelImportDiffModal';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useUnsavedChangesGuard } from '@/lib/adminConfirm/useUnsavedChangesGuard';
import {
  downloadPiExcel,
  importPiExcel,
  type PiExcelImportResult,
} from '@/lib/commercialProposal/piExcelAdmin';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { adminOrderKpStrings } from '@/lib/admin-i18n/adminOrderKpI18n';
import type { CommercialProposalApi, CommercialProposalLineApi, CommercialProposalSummaryApi } from '@/lib/commercialProposal/types';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import styles from '@/app/(admin)/admin/catalogAdmin.module.css';
import kpStyles from './kpEditor.module.css';
import { kpGrossTotals } from '@/lib/commercialProposal/kpGrossDimensions';
import { KpGrossDisplay, KpGrossTotalsDisplay } from '@/components/commercialProposal/KpGrossDisplay';
import { kpLineTotalRub, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import { OrderKpGrossEditModal } from './OrderKpGrossEditModal';
import { OrderKpPublishConfirmModal, type NextOrderStatusChoice } from './OrderKpPublishConfirmModal';
import { OrderKpReplaceModal } from './OrderKpReplaceModal';

function lineTitle(snap: Record<string, unknown> | null, dash: string): string {
  if (snap && typeof snap.productName === 'string' && snap.productName.trim()) return snap.productName.trim();
  return dash;
}

function lineThumbUrl(snap: Record<string, unknown> | null): string | null {
  const u = snap?.imageUrl;
  return typeof u === 'string' && u.trim() ? u.trim() : null;
}

function formatRub(n: number, numberLocale: string): string {
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
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
  ariaLabel,
  onChange,
}: {
  value: number;
  numberLocale: string;
  ariaLabel: string;
  onChange: (n: number) => void;
}) {
  const formatted = useMemo(() => formatOfferPriceInput(value, numberLocale), [value, numberLocale]);

  return (
    <AdminTextField
      className={kpStyles.fieldPrice}
      controlClassName={kpStyles.fieldPrice}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={formatted}
      onChange={(e) => onChange(parseOfferPriceInput(e.target.value))}
      aria-label={ariaLabel}
    />
  );
}

export function OrderKpEditorClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminOrderKpStrings(locale), [locale]);
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
  const [excelExportBusy, setExcelExportBusy] = useState(false);
  const [excelImportBusy, setExcelImportBusy] = useState(false);
  const [excelVersionBusy, setExcelVersionBusy] = useState<Record<number, boolean>>({});
  const [excelPreview, setExcelPreview] = useState<PiExcelImportResult | null>(null);
  const [excelPendingFile, setExcelPendingFile] = useState<File | null>(null);
  const [excelApplying, setExcelApplying] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [successHint, setSuccessHint] = useState<string | null>(null);
  const excelFileRef = useRef<HTMLInputElement | null>(null);

  const basePath = `orders/admin/${encodeURIComponent(orderId)}/commercial-proposals`;
  useUnsavedChangesGuard(dirty);

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
        setDirty(false);
        setNeedsInit(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (
          msg.includes('404') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('не найден')
        ) {
          setLines([]);
          setDirty(false);
          setNeedsInit(true);
        } else throw e;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errLoad);
      setSummary(null);
      setLines([]);
      setOrderStatus(null);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, [basePath, orderId, t.errLoad]);

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
      setDirty(false);
      setNeedsInit(false);
      const s = await adminBackendJson<CommercialProposalSummaryApi>(basePath);
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errInitDraft);
    }
  }

  async function saveDraft(opts?: { flash?: boolean }): Promise<boolean> {
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
      setDirty(false);
      if (opts?.flash !== false) setSavedFlash(true);
      const s = await adminBackendJson<CommercialProposalSummaryApi>(basePath);
      setSummary(s);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errSaveDraft);
      return false;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!savedFlash || dirty) return;
    const timer = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [savedFlash, dirty]);

  useEffect(() => {
    if (dirty) setSavedFlash(false);
  }, [dirty]);

  async function discardDraftChanges() {
    if (!window.confirm(t.discardConfirm)) return;
    await loadAll();
  }

  async function executePublish() {
    setPublishing(true);
    setError(null);
    try {
      const draftSaved = await saveDraft({ flash: false });
      if (!draftSaved) return;
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
      setError(e instanceof Error ? e.message : t.errPublish);
    } finally {
      setPublishing(false);
    }
  }

  function updateLine(i: number, patch: Partial<CommercialProposalLineApi>) {
    setDirty(true);
    setSuccessHint(null);
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  function confirmExcelIfDirty(): boolean {
    if (!dirty) return true;
    return window.confirm(t.excelDirtyConfirm);
  }

  const kpTotals = useMemo(() => kpOfferAggregates(lines), [lines]);
  const grossTotals = useMemo(() => kpGrossTotals(lines), [lines]);
  const avgDiscountPctLabel = `${Math.round(kpTotals.avgDiscountPercent * 10) / 10}%`;

  const publishedHint =
    summary && summary.published.length > 0
      ? t.publishedHint(summary.published[0]!.versionNumber, summary.published[0]!.lineCount)
      : t.notSentYet;

  const publishConfirmLabels = useMemo(
    () => ({
      title: t.publishConfirmTitle,
      cancel: t.publishConfirmCancel,
      submit: t.publishConfirmSubmit,
      submitting: t.publishConfirmSending,
    }),
    [t],
  );

  useEffect(() => {
    if (publishConfirmOpen && orderStatus === 'PENDING_APPROVAL') {
      setNextOrderStatus('PROPOSAL_FORMED');
    }
  }, [publishConfirmOpen, orderStatus]);

  return (
    <div>
      <p className={styles.muted}>{publishedHint}</p>
      {summary?.draft ? (
        <p className={styles.muted}>
          {t.draftHint(
            summary.draft.lineCount,
            new Date(summary.draft.updatedAt).toLocaleString(numberLocale),
          )}
        </p>
      ) : null}

      {loading ? <p className={styles.muted}>{t.loading}</p> : null}
      {error ? (
        <p className={styles.error} role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {successHint ? (
        <p className={styles.muted} role="status" aria-live="polite">
          {successHint}
        </p>
      ) : null}

      {needsInit && !loading ? (
        <div className={styles.section}>
          <h2 className={styles.groupHeading}>{t.initDraftHeading}</h2>
          <div className={styles.formActions}>
            <AdminCompactBtn type="button" variant="accent" onClick={() => void initDraft()}>
              {t.initDraftBtn}
            </AdminCompactBtn>
          </div>
          {summary && summary.published.length > 0 ? (
            <div className={styles.section}>
              <p className={styles.muted}>{t.initCopyHint}</p>
              <ul className={kpStyles.initCopyList}>
                {summary.published.map((p) => (
                  <li key={p.id} className={kpStyles.publishedVersionRow}>
                    <AdminCompactBtn type="button" variant="outline" onClick={() => void initDraft(p.id)}>
                      {t.initCopyBtn(p.versionNumber, p.lineCount)}
                    </AdminCompactBtn>
                    <AdminCompactBtn
                      type="button"
                      variant="outline"
                      disabled={Boolean(excelVersionBusy[p.versionNumber]) || p.lineCount === 0}
                      title={t.excelSheetProtectHint}
                      onClick={() => {
                        setExcelVersionBusy((prev) => ({ ...prev, [p.versionNumber]: true }));
                        void downloadPiExcel(
                          `${basePath}/excel?source=published&version=${p.versionNumber}`,
                          `PI-order-v${p.versionNumber}.xlsx`,
                        )
                          .catch((e) => {
                            setError(e instanceof Error ? e.message : t.errExcelExport);
                          })
                          .finally(() => {
                            setExcelVersionBusy((prev) => {
                              const next = { ...prev };
                              delete next[p.versionNumber];
                              return next;
                            });
                          });
                      }}
                    >
                      {excelVersionBusy[p.versionNumber]
                        ? t.excelBusy
                        : t.excelExportVersion(p.versionNumber)}
                    </AdminCompactBtn>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !needsInit && summary && summary.published.length > 0 ? (
        <div className={styles.section}>
          <p className={styles.muted}>{t.publishedExcelHint}</p>
          <div className={styles.formActions}>
            {summary.published.map((p) => (
              <AdminCompactBtn
                key={p.id}
                type="button"
                variant="outline"
                disabled={Boolean(excelVersionBusy[p.versionNumber]) || p.lineCount === 0}
                title={t.excelSheetProtectHint}
                onClick={() => {
                  setExcelVersionBusy((prev) => ({ ...prev, [p.versionNumber]: true }));
                  void downloadPiExcel(
                    `${basePath}/excel?source=published&version=${p.versionNumber}`,
                    `PI-order-v${p.versionNumber}.xlsx`,
                  )
                    .catch((e) => {
                      setError(e instanceof Error ? e.message : t.errExcelExport);
                    })
                    .finally(() => {
                      setExcelVersionBusy((prev) => {
                        const next = { ...prev };
                        delete next[p.versionNumber];
                        return next;
                      });
                    });
                }}
              >
                {excelVersionBusy[p.versionNumber]
                  ? t.excelBusy
                  : t.excelExportVersion(p.versionNumber)}
              </AdminCompactBtn>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !needsInit ? (
        <div className={styles.section}>
          <div className={kpStyles.editorActions}>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={saving || !dirty}
              onClick={() => void saveDraft()}
            >
              {saving ? t.savingDraft : t.saveDraft}
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="accent"
              disabled={publishing || lines.length === 0}
              title={dirty ? t.publishSavesDraft : undefined}
              onClick={() => {
                setError(null);
                setPublishConfirmOpen(true);
              }}
            >
              {publishing ? t.publishing : dirty ? t.publishSavesDraft : t.publish}
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={excelExportBusy || excelImportBusy || lines.length === 0}
              title={t.excelSheetProtectHint}
              onClick={() => {
                setExcelExportBusy(true);
                setSuccessHint(null);
                void downloadPiExcel(`${basePath}/excel?source=draft`, `PI-order-draft.xlsx`)
                  .catch((e) => {
                    setError(e instanceof Error ? e.message : t.errExcelExport);
                  })
                  .finally(() => setExcelExportBusy(false));
              }}
            >
              {excelExportBusy ? t.excelBusy : t.excelExportDraft}
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={excelExportBusy || excelImportBusy}
              onClick={() => {
                if (!confirmExcelIfDirty()) return;
                excelFileRef.current?.click();
              }}
            >
              {excelImportBusy ? t.excelBusy : t.excelImportDraft}
            </AdminCompactBtn>
            {savedFlash && !dirty ? (
              <span className={kpStyles.savedFlash} role="status">
                {t.savedDraft}
              </span>
            ) : null}
            <input
              ref={excelFileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setExcelImportBusy(true);
                setError(null);
                setSuccessHint(null);
                void importPiExcel(`${basePath}/draft/import-excel`, file, { dryRun: true })
                  .then((r) => {
                    setExcelPendingFile(file);
                    setExcelPreview(r);
                  })
                  .catch((err) => {
                    setError(err instanceof Error ? err.message : t.errExcelImport);
                  })
                  .finally(() => setExcelImportBusy(false));
              }}
            />
          </div>

          {lines.length > 0 ? (
            <div className={kpStyles.totalsCard}>
              <div>
                <p className={kpStyles.totalsCardTitle}>{t.totalsHeading}</p>
                <p className={kpStyles.totalsCardMeta}>{t.positionsCount(lines.length)}</p>
                {grossTotals.hasAny ? (
                  <p className={styles.cardNote} style={{ margin: '6px 0 0' }}>
                    <strong>{t.totalGross}</strong> <KpGrossTotalsDisplay totals={grossTotals} />
                  </p>
                ) : null}
              </div>
              <div className={kpStyles.totalsSum}>
                <span className={`${styles.cardNote} ${kpStyles.strikeTotal}`}>
                  {formatRub(kpTotals.oldTotalRub, numberLocale)}
                </span>
                <span className={kpStyles.discountPct}>{avgDiscountPctLabel}</span>
                <strong>{formatRub(kpTotals.newTotalRub, numberLocale)}</strong>
              </div>
            </div>
          ) : null}

          <div className={kpStyles.tableScroll}>
            <table className={`${styles.table} ${kpStyles.kpTable}`}>
              <thead>
                <tr>
                  <th className={kpStyles.productSticky}>{t.thProduct}</th>
                  <th>{t.thConfig}</th>
                  <th>{t.thGrossDims}</th>
                  <th>{t.thQtyPieces}</th>
                  <th>{t.thPrice}</th>
                  <th>{t.thDiscount}</th>
                  <th>{t.thDelivery}</th>
                  <th>{t.thLineTotal}</th>
                  <th scope="col" style={{ width: 48 }} aria-label={t.btnReplace}>
                    <img src="/icons/change-product.svg" alt="" width={24} height={24} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const snap = line.snapshot && typeof line.snapshot === 'object' ? line.snapshot : null;
                  const meta = orderItemSnapshotMetaRows(snap, {
                    modification: t.snapshotModification,
                    elementFallback: t.snapshotElementFallback,
                  });
                  const thumb = lineThumbUrl(snap);
                  return (
                    <tr key={line.id}>
                      <td className={kpStyles.productSticky}>
                        <div className={kpStyles.productCell}>
                          {thumb ? (
                            <img
                              className={styles.productListThumb}
                              src={thumb}
                              alt=""
                              width={46}
                              height={46}
                            />
                          ) : (
                            <div className={styles.productListThumbPh} aria-hidden />
                          )}
                          <span className={`${styles.cardTitle} ${kpStyles.productTitle}`}>
                            {lineTitle(snap, t.dash)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {meta.length ? (
                          <ul className={`${styles.cardNote} ${kpStyles.itemMetaList}`}>
                            {meta.map((m, k) => (
                              <li key={k}>
                                {m.label}: {m.value}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          t.dash
                        )}
                      </td>
                      <td>
                        <div className={kpStyles.grossCell}>
                          <KpGrossDisplay
                            snapshot={snap}
                            className={`${styles.cardNote} ${kpStyles.grossDisplay}`}
                          />
                          <button
                            type="button"
                            className={kpStyles.iconBtn}
                            aria-label={t.ariaEditGross}
                            title={t.ariaEditGross}
                            onClick={() => setGrossEditLineIndex(i)}
                          >
                            <img src="/icons/edit.svg" alt="" width={20} height={20} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={kpStyles.qtyRow}>
                          <AdminTextField
                            className={kpStyles.fieldQty}
                            controlClassName={kpStyles.fieldQty}
                            type="number"
                            min={1}
                            value={String(line.quantity)}
                            onChange={(e) =>
                              updateLine(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                            }
                            aria-label={t.thQtyPieces}
                          />
                          <AdminTextField
                            className={kpStyles.fieldUnit}
                            controlClassName={kpStyles.fieldUnit}
                            value={line.unit}
                            onChange={(e) => updateLine(i, { unit: e.target.value })}
                            aria-label={t.thUnit}
                          />
                        </div>
                      </td>
                      <td>
                        <OfferUnitPriceField
                          value={line.offerUnitPrice}
                          numberLocale={numberLocale}
                          ariaLabel={t.ariaUnitPrice}
                          onChange={(n) => updateLine(i, { offerUnitPrice: n })}
                        />
                      </td>
                      <td>
                        <AdminTextField
                          className={kpStyles.fieldDiscount}
                          controlClassName={kpStyles.fieldDiscount}
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={line.discountPercent ?? ''}
                          placeholder="0"
                          onChange={(e) => {
                            const v = e.target.value;
                            updateLine(i, {
                              discountPercent: v === '' ? null : parseFloat(v) || 0,
                            });
                          }}
                          aria-label={t.ariaDiscount}
                        />
                      </td>
                      <td>
                        <AdminTextField
                          className={kpStyles.fieldDelivery}
                          controlClassName={kpStyles.fieldDelivery}
                          value={line.deliveryEta ?? ''}
                          placeholder={t.deliveryPlaceholder}
                          onChange={(e) => updateLine(i, { deliveryEta: e.target.value || null })}
                          aria-label={t.ariaDelivery}
                        />
                      </td>
                      <td>{formatRub(kpLineTotalRub(line), numberLocale)}</td>
                      <td>
                        <button
                          type="button"
                          className={kpStyles.iconBtn}
                          aria-label={t.btnReplace}
                          title={t.btnReplace}
                          onClick={() => setReplaceLineIndex(i)}
                        >
                          <img src="/icons/change-product.svg" alt="" width={24} height={24} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={kpStyles.lineCards}>
            {lines.map((line, i) => {
              const snap = line.snapshot && typeof line.snapshot === 'object' ? line.snapshot : null;
              const meta = orderItemSnapshotMetaRows(snap, {
                modification: t.snapshotModification,
                elementFallback: t.snapshotElementFallback,
              });
              const thumb = lineThumbUrl(snap);
              return (
                <article key={line.id} className={kpStyles.lineCard}>
                  <div className={kpStyles.lineCardHead}>
                    {thumb ? (
                      <img className={styles.productListThumb} src={thumb} alt="" width={46} height={46} />
                    ) : (
                      <div className={styles.productListThumbPh} aria-hidden />
                    )}
                    <div className={kpStyles.lineCardHeadText}>
                      <div className={`${styles.cardTitle} ${kpStyles.productTitle}`}>
                        {lineTitle(snap, t.dash)}
                      </div>
                      {meta.length ? (
                        <ul className={`${styles.cardNote} ${kpStyles.itemMetaList}`}>
                          {meta.map((m, k) => (
                            <li key={k}>
                              {m.label}: {m.value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={kpStyles.iconBtn}
                      aria-label={t.btnReplace}
                      title={t.btnReplace}
                      onClick={() => setReplaceLineIndex(i)}
                    >
                      <img src="/icons/change-product.svg" alt="" width={24} height={24} />
                    </button>
                  </div>
                  <div className={kpStyles.lineCardGrid}>
                    <div className={`${kpStyles.lineCardField} ${kpStyles.lineCardFieldFull}`}>
                      <span className={kpStyles.lineCardLabel}>{t.thGrossDims}</span>
                      <div className={kpStyles.grossCell}>
                        <KpGrossDisplay
                          snapshot={snap}
                          className={`${styles.cardNote} ${kpStyles.grossDisplay}`}
                        />
                        <button
                          type="button"
                          className={kpStyles.iconBtn}
                          aria-label={t.ariaEditGross}
                          title={t.ariaEditGross}
                          onClick={() => setGrossEditLineIndex(i)}
                        >
                          <img src="/icons/edit.svg" alt="" width={20} height={20} />
                        </button>
                      </div>
                    </div>
                    <div className={kpStyles.lineCardField}>
                      <span className={kpStyles.lineCardLabel}>{t.thQtyPieces}</span>
                      <div className={kpStyles.qtyRow}>
                        <AdminTextField
                          className={kpStyles.fieldQty}
                          controlClassName={kpStyles.fieldQty}
                          type="number"
                          min={1}
                          value={String(line.quantity)}
                          onChange={(e) =>
                            updateLine(i, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          aria-label={t.thQtyPieces}
                        />
                        <AdminTextField
                          className={kpStyles.fieldUnit}
                          controlClassName={kpStyles.fieldUnit}
                          value={line.unit}
                          onChange={(e) => updateLine(i, { unit: e.target.value })}
                          aria-label={t.thUnit}
                        />
                      </div>
                    </div>
                    <div className={kpStyles.lineCardField}>
                      <span className={kpStyles.lineCardLabel}>{t.thPrice}</span>
                      <OfferUnitPriceField
                        value={line.offerUnitPrice}
                        numberLocale={numberLocale}
                        ariaLabel={t.ariaUnitPrice}
                        onChange={(n) => updateLine(i, { offerUnitPrice: n })}
                      />
                    </div>
                    <div className={kpStyles.lineCardField}>
                      <span className={kpStyles.lineCardLabel}>{t.thDiscount}</span>
                      <AdminTextField
                        className={kpStyles.fieldDiscount}
                        controlClassName={kpStyles.fieldDiscount}
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={line.discountPercent ?? ''}
                        placeholder="0"
                        onChange={(e) => {
                          const v = e.target.value;
                          updateLine(i, {
                            discountPercent: v === '' ? null : parseFloat(v) || 0,
                          });
                        }}
                        aria-label={t.ariaDiscount}
                      />
                    </div>
                    <div className={kpStyles.lineCardField}>
                      <span className={kpStyles.lineCardLabel}>{t.thDelivery}</span>
                      <AdminTextField
                        className={kpStyles.fieldDelivery}
                        controlClassName={kpStyles.fieldDelivery}
                        value={line.deliveryEta ?? ''}
                        placeholder={t.deliveryPlaceholder}
                        onChange={(e) => updateLine(i, { deliveryEta: e.target.value || null })}
                        aria-label={t.ariaDelivery}
                      />
                    </div>
                  </div>
                  <div className={kpStyles.lineCardTotal}>
                    <span>{t.thLineTotal}</span>
                    <span>{formatRub(kpLineTotalRub(line), numberLocale)}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {lines.length > 0 ? (
            <div className={kpStyles.totalsCard} style={{ marginTop: 14, marginBottom: 0 }}>
              <div>
                <p className={kpStyles.totalsCardTitle}>{t.totalsHeading}</p>
                {grossTotals.hasAny ? (
                  <p className={styles.cardNote} style={{ margin: 0 }}>
                    <strong>{t.totalGross}</strong> <KpGrossTotalsDisplay totals={grossTotals} />
                  </p>
                ) : null}
              </div>
              <div className={kpStyles.totalsSum}>
                <span className={`${styles.cardNote} ${kpStyles.strikeTotal}`}>
                  {formatRub(kpTotals.oldTotalRub, numberLocale)}
                </span>
                <span className={kpStyles.discountPct}>{avgDiscountPctLabel}</span>
                <strong>{formatRub(kpTotals.newTotalRub, numberLocale)}</strong>
              </div>
            </div>
          ) : null}
        </div>
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
        draftOrPublishError={publishConfirmOpen ? error : null}
        showNextStatus={orderStatus === 'PENDING_APPROVAL'}
        nextOrderStatus={nextOrderStatus}
        onNextOrderStatus={setNextOrderStatus}
        onClose={() => {
          if (!publishing) {
            setPublishConfirmOpen(false);
            setError(null);
          }
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
          setDirty(true);
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
          t.dash,
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

      <PiExcelImportDiffModal
        open={Boolean(excelPreview)}
        preview={excelPreview}
        applying={excelApplying}
        labels={d.excelDiffLabels}
        onClose={() => {
          if (excelApplying) return;
          setExcelPreview(null);
          setExcelPendingFile(null);
        }}
        onApply={async () => {
          if (!excelPendingFile || excelApplying) return;
          if (!confirmExcelIfDirty()) return;
          setExcelApplying(true);
          setError(null);
          try {
            const r = await importPiExcel(`${basePath}/draft/import-excel`, excelPendingFile, {
              expectedUpdatedAt: excelPreview?.draftUpdatedAt,
            });
            setExcelPreview(null);
            setExcelPendingFile(null);
            setSuccessHint(d.excelImportOk(r.updatedCount, r.unmatchedCount, r.addedCount));
            await loadAll();
          } catch (err) {
            setError(err instanceof Error ? err.message : t.errExcelImport);
          } finally {
            setExcelApplying(false);
          }
        }}
      />

      {!loading && !needsInit && dirty ? (
        <div className={kpStyles.dirtyBar} role="status">
          <p className={kpStyles.dirtyBarHint}>{t.dirtyHint}</p>
          <div className={kpStyles.dirtyBarActions}>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={saving || publishing}
              onClick={() => void discardDraftChanges()}
            >
              {t.discardDraft}
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="accent"
              disabled={saving || publishing}
              onClick={() => void saveDraft({ flash: true })}
            >
              {saving ? t.savingDraft : t.saveDraft}
            </AdminCompactBtn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

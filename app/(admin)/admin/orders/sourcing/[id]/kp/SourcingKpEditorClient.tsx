'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AdminTextField, AdminTextArea } from '@/components/AdminTextField/AdminTextField';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { adminSourcingKpStrings } from '@/lib/admin-i18n/adminSourcingKpI18n';
import { sourcingKpLineTotalRub, sourcingKpOrderTotalRub } from '@/lib/sourcingCommercialProposal/kpLineTotals';
import type { SourcingCommercialProposalLineApi, SourcingCommercialProposalSummaryApi } from '@/lib/sourcingCommercialProposal/types';
import {
  fetchSourcingKpDraft,
  fetchSourcingKpSummary,
  initSourcingKpDraft,
  publishSourcingKpDraft,
  saveSourcingKpDraft,
} from '@/lib/userSourcingRequests/sourcingKpAdminApi';
import styles from '../../../../catalog/catalogAdmin.module.css';
import kpStyles from '../../../[id]/kp/kpEditor.module.css';
import skStyles from './sourcingKpEditor.module.css';
import { SourcingKpPublishConfirmModal } from './SourcingKpPublishConfirmModal';

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

function formatMoney(n: number, numberLocale: string): string {
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
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

function normalizeDraftLine(line: SourcingCommercialProposalLineApi): SourcingCommercialProposalLineApi {
  return {
    ...line,
    imageUrls: Array.isArray(line.imageUrls) ? line.imageUrls.filter((u) => u?.trim()) : [],
  };
}

function mergeImageUrls(existing: string[], additions: string[]): string[] {
  const out = [...existing];
  const seen = new Set(existing);
  for (const raw of additions) {
    const u = raw?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function SourcingKpLineImagesBlock({
  urls,
  labels,
  onChange,
  onOpenPicker,
}: {
  urls: string[];
  labels: { heading: string; add: string; remove: string };
  onChange: (urls: string[]) => void;
  onOpenPicker: () => void;
}) {
  return (
    <div className={skStyles.lineImagesBlock}>
      <span className={skStyles.lineImagesLabel}>{labels.heading}</span>
      <div className={skStyles.lineImagesGrid}>
        {urls.map((url, imgIdx) => (
          <div key={`${url}-${imgIdx}`} className={skStyles.lineImageTile}>
            <img className={skStyles.lineImageThumb} src={url} alt="" loading="lazy" />
            <button
              type="button"
              className={skStyles.lineImageRemove}
              aria-label={labels.remove}
              title={labels.remove}
              onClick={() => onChange(urls.filter((_, j) => j !== imgIdx))}
            >
              <img src="/icons/delete.svg" alt="" width={12} height={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={skStyles.lineImageAddBtn}
          aria-label={labels.add}
          title={labels.add}
          onClick={onOpenPicker}
        >
          +
        </button>
      </div>
    </div>
  );
}

function newDraftLine(sortOrder: number): SourcingCommercialProposalLineApi {
  return {
    id: `draft-${sortOrder}-${Date.now()}`,
    sourceSourcingRequestItemId: null,
    sortOrder,
    productName: '',
    description: '',
    imageUrls: [],
    quantity: 1,
    unit: 'шт',
    offerUnitPrice: 0,
    deliveryEta: null,
  };
}

export function SourcingKpEditorClient({ sourcingRequestId }: { sourcingRequestId: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const t = useMemo(() => adminSourcingKpStrings(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [summary, setSummary] = useState<SourcingCommercialProposalSummaryApi | null>(null);
  const [lines, setLines] = useState<SourcingCommercialProposalLineApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [needsInit, setNeedsInit] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [imagePickerLineIndex, setImagePickerLineIndex] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchSourcingKpSummary(sourcingRequestId);
      setSummary(s);
      try {
        const dr = await fetchSourcingKpDraft(sourcingRequestId);
        setLines(dr.lines.map(normalizeDraftLine));
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
      setError(e instanceof Error ? e.message : t.errLoad);
      setSummary(null);
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [sourcingRequestId, t.errLoad]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function initDraft(fromPublishedProposalId?: string) {
    setError(null);
    try {
      const dr = await initSourcingKpDraft(sourcingRequestId, fromPublishedProposalId);
      setLines(dr.lines.map(normalizeDraftLine));
      setNeedsInit(false);
      setSummary(await fetchSourcingKpSummary(sourcingRequestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errInitDraft);
    }
  }

  async function saveDraft(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const sorted = [...lines].map((l, i) => ({ ...l, sortOrder: i }));
      const dr = await saveSourcingKpDraft(
        sourcingRequestId,
        sorted.map((l) => ({
          sourceSourcingRequestItemId: l.sourceSourcingRequestItemId,
          sortOrder: l.sortOrder,
          productName: l.productName,
          description: l.description,
          imageUrls: l.imageUrls,
          quantity: l.quantity,
          unit: l.unit,
          offerUnitPrice: l.offerUnitPrice,
          deliveryEta: l.deliveryEta,
        })),
      );
      setLines(dr.lines.map(normalizeDraftLine));
      setSummary(await fetchSourcingKpSummary(sourcingRequestId));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errSaveDraft);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function executePublish() {
    setPublishing(true);
    setError(null);
    try {
      const draftSaved = await saveDraft();
      if (!draftSaved) return;
      await publishSourcingKpDraft(sourcingRequestId);
      setPublishConfirmOpen(false);
      router.push(`/admin/orders/sourcing/${encodeURIComponent(sourcingRequestId)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errPublish);
    } finally {
      setPublishing(false);
    }
  }

  function updateLine(i: number, patch: Partial<SourcingCommercialProposalLineApi>) {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }

  function addLine() {
    setLines((prev) => [...prev, newDraftLine(prev.length)]);
  }

  const orderTotal = useMemo(() => sourcingKpOrderTotalRub(lines), [lines]);

  const publishedHint =
    summary && summary.published.length > 0
      ? t.publishedHint(summary.published[0]!.versionNumber, summary.published[0]!.lineCount)
      : d.kpNotSentYet;

  const publishConfirmLabels = useMemo(
    () => ({
      title: t.kpPublishConfirmTitle,
      cancel: t.kpPublishConfirmCancel,
      submit: t.kpPublishConfirmSubmit,
      submitting: t.kpPublishConfirmSending,
    }),
    [t],
  );

  return (
    <div>
      <MediaLibraryPickerModal
        open={imagePickerLineIndex != null}
        title={t.imagePickerTitle}
        mediaFilter="image"
        onClose={() => setImagePickerLineIndex(null)}
        onPickBatch={(items) => {
          if (imagePickerLineIndex == null) return;
          const line = lines[imagePickerLineIndex];
          if (!line) return;
          updateLine(imagePickerLineIndex, {
            imageUrls: mergeImageUrls(
              line.imageUrls ?? [],
              items.map((sel) => sel.url),
            ),
          });
          setImagePickerLineIndex(null);
        }}
      />

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
                  <li key={p.id}>
                    <AdminCompactBtn type="button" variant="outline" onClick={() => void initDraft(p.id)}>
                      {t.initCopyBtn(p.versionNumber, p.lineCount)}
                    </AdminCompactBtn>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !needsInit ? (
        <>
          <div className={styles.section}>
            <div className={`${styles.formActions} ${kpStyles.editorActions}`}>
              <AdminCompactBtn type="button" variant="outline" disabled={saving} onClick={() => void saveDraft()}>
                {saving ? t.savingDraft : t.saveDraft}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                variant="accent"
                disabled={publishing || lines.length === 0}
                onClick={() => setPublishConfirmOpen(true)}
              >
                {publishing ? d.kpPublishing : d.kpPublish}
              </AdminCompactBtn>
              <AdminCompactBtn type="button" variant="outline" onClick={addLine}>
                {t.addLine}
              </AdminCompactBtn>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <colgroup>
                  <col className={skStyles.colProductName} />
                  <col className={skStyles.colDescription} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t.thProductName}</th>
                    <th>{t.thDescription}</th>
                    <th>{t.thQty}</th>
                    <th>{t.thPrice}</th>
                    <th>{t.thDelivery}</th>
                    <th>{t.thLineTotal}</th>
                    <th scope="col" style={{ width: 48 }} aria-label={t.thRemove} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <Fragment key={line.id}>
                      <tr>
                        <td>
                          <AdminTextField
                            className={kpStyles.fieldFull}
                            controlClassName={kpStyles.fieldFull}
                            value={line.productName}
                            onChange={(e) => updateLine(i, { productName: e.target.value })}
                            aria-label={t.ariaProductName}
                          />
                        </td>
                        <td>
                          <AdminTextArea
                            className={skStyles.fieldDescription}
                            controlClassName={skStyles.fieldDescription}
                            value={line.description ?? ''}
                            rows={3}
                            onChange={(e) => updateLine(i, { description: e.target.value || null })}
                            aria-label={t.ariaDescription}
                          />
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
                              aria-label={t.ariaQty}
                            />
                            <AdminTextField
                              className={kpStyles.fieldUnit}
                              controlClassName={kpStyles.fieldUnit}
                              value={line.unit}
                              onChange={(e) => updateLine(i, { unit: e.target.value })}
                              aria-label={t.ariaUnit}
                            />
                          </div>
                        </td>
                        <td>
                          <OfferUnitPriceField
                            value={line.offerUnitPrice}
                            numberLocale={numberLocale}
                            ariaLabel={t.ariaPrice}
                            onChange={(n) => updateLine(i, { offerUnitPrice: n })}
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
                        <td>{formatMoney(sourcingKpLineTotalRub(line), numberLocale)}</td>
                        <td>
                          <button
                            type="button"
                            className={kpStyles.iconBtn}
                            aria-label={t.ariaRemoveLine}
                            onClick={() => removeLine(i)}
                          >
                            <img src="/icons/delete.svg" alt="" width={20} height={20} />
                          </button>
                        </td>
                      </tr>
                      <tr className={skStyles.lineImagesRow}>
                        <td colSpan={7}>
                          <SourcingKpLineImagesBlock
                            urls={line.imageUrls ?? []}
                            labels={{
                              heading: t.imagesLabel,
                              add: t.imagePick,
                              remove: t.imageRemove,
                            }}
                            onChange={(imageUrls) => updateLine(i, { imageUrls })}
                            onOpenPicker={() => setImagePickerLineIndex(i)}
                          />
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>
                      {t.footerSumLabel}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(orderTotal, numberLocale)}</td>
                    <td aria-hidden />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <SourcingKpPublishConfirmModal
        open={publishConfirmOpen}
        sourcingRequestId={sourcingRequestId}
        lines={lines}
        lineCount={lines.length}
        totalRub={orderTotal}
        numberLocale={numberLocale}
        labels={publishConfirmLabels}
        publishing={publishing}
        draftOrPublishError={publishConfirmOpen ? error : null}
        onClose={() => {
          if (!publishing) {
            setPublishConfirmOpen(false);
            setError(null);
          }
        }}
        onConfirm={() => void executePublish()}
      />
    </div>
  );
}

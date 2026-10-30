'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import {
  downloadPiExcelImportReport,
  type PiExcelFieldChange,
  type PiExcelImportResult,
} from '@/lib/commercialProposal/piExcelAdmin';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './PiExcelImportDiffModal.module.css';

/** Prefer Excel CNY before converted RUB in the field list. */
const FIELD_ORDER: Record<string, number> = {
  productName: -1,
  quantity: 0,
  unitPriceCny: 1,
  costPriceCny: 1,
  offerUnitPriceRub: 2,
  weightKg: 3,
  grossWeightKg: 3,
  volumeM3: 4,
  dimsMm: 5,
  description: 6,
};

export function sortPiExcelDiffFields(fields: PiExcelFieldChange[]): PiExcelFieldChange[] {
  return [...fields].sort(
    (a, b) => (FIELD_ORDER[a.field] ?? 50) - (FIELD_ORDER[b.field] ?? 50),
  );
}

export type PiExcelImportDiffLabels = {
  title: string;
  apply: string;
  cancel: string;
  downloadReport: string;
  matched: (n: number) => string;
  added: (n: number) => string;
  changed: (n: number) => string;
  unchanged: (n: number) => string;
  unmatched: (n: number) => string;
  emptyMatchKey: (rows: number[]) => string;
  noFieldChanges: string;
  excelRow: (n: number) => string;
  fieldLabel: (field: string) => string;
  formatValue: (v: string | number | null) => string;
  /** Optional sheet-protect / col T reminder */
  sheetProtectHint?: string;
};

type Props = {
  open: boolean;
  preview: PiExcelImportResult | null;
  applying?: boolean;
  labels: PiExcelImportDiffLabels;
  onClose: () => void;
  onApply: () => void | Promise<void>;
};

export function PiExcelImportDiffModal({
  open,
  preview,
  applying = false,
  labels,
  onClose,
  onApply,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !applying) onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = ph;
      body.style.overflow = pb;
    };
  }, [open, applying, onClose]);

  if (!open || !preview || typeof document === 'undefined') return null;

  const changes = preview.changes ?? [];
  const unmatched = preview.unmatched ?? [];
  const added = preview.added ?? [];
  const addedCount = preview.addedCount ?? added.length;
  const emptyRows = preview.emptyMatchKeyRows ?? [];
  const hasReport = unmatched.length > 0 || emptyRows.length > 0 || addedCount > 0;

  return createPortal(
    <div
      className={modalStyles.overlay}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !applying && onClose()}
    >
      <div
        ref={panelRef}
        className={`${modalStyles.panel} ${modalStyles.panelWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={modalStyles.panelHead}>
          <h2 id={titleId} className={modalStyles.panelTitle}>
            {labels.title}
          </h2>
          <AdminModalCloseButton
            label={labels.cancel}
            disabled={applying}
            onClick={() => !applying && onClose()}
          />
        </div>
        <div className={modalStyles.body}>
          <p className={styles.summary}>
            <span className={styles.summaryItem}>
              <strong>{labels.matched(preview.updatedCount)}</strong>
            </span>
            {addedCount > 0 ? (
              <span className={styles.summaryItem}>
                <strong>{labels.added(addedCount)}</strong>
              </span>
            ) : null}
            <span className={styles.summaryItem}>
              {labels.changed(preview.changedLineCount ?? changes.length)}
            </span>
            <span className={styles.summaryItem}>
              {labels.unchanged(preview.unchangedCount)}
            </span>
            <span className={styles.summaryItem}>
              {labels.unmatched(preview.unmatchedCount ?? unmatched.length)}
            </span>
          </p>

          {labels.sheetProtectHint ? (
            <p className={styles.warn}>{labels.sheetProtectHint}</p>
          ) : null}

          {emptyRows.length > 0 ? (
            <p className={styles.warn}>{labels.emptyMatchKey(emptyRows)}</p>
          ) : null}

          {addedCount > 0 ? (
            <>
              <p className={styles.sectionTitle}>{labels.added(addedCount)}</p>
              {added.length > 0 ? (
                <ul className={styles.unmatched}>
                  {added.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {unmatched.length > 0 ? (
            <>
              <p className={styles.sectionTitle}>{labels.unmatched(unmatched.length)}</p>
              <ul className={styles.unmatched}>
                {unmatched.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </>
          ) : null}

          <p className={styles.sectionTitle}>
            {labels.changed(preview.changedLineCount ?? changes.length)}
          </p>
          {changes.length === 0 ? (
            <p className={styles.empty}>{labels.noFieldChanges}</p>
          ) : (
            <ul className={styles.changes}>
              {changes.map((c) => (
                <li key={c.lineId} className={styles.changeCard}>
                  <p className={styles.changeHead}>
                    {c.label}{' '}
                    <span className={styles.changeMeta}>{labels.excelRow(c.excelRow)}</span>
                  </p>
                  <ul className={styles.fieldList}>
                    {sortPiExcelDiffFields(c.fields).map((f) => (
                      <li key={`${c.lineId}-${f.field}`} className={styles.fieldRow}>
                        <span className={styles.fieldName}>{labels.fieldLabel(f.field)}</span>
                        <span>{labels.formatValue(f.before)}</span>
                        <span className={styles.arrow} aria-hidden>
                          →
                        </span>
                        <span>{labels.formatValue(f.after)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={modalStyles.panelFooter}>
          {hasReport ? (
            <span className={styles.footerExtra}>
              <AdminCompactBtn
                type="button"
                variant="outline"
                disabled={applying}
                onClick={() => downloadPiExcelImportReport(preview)}
              >
                {labels.downloadReport}
              </AdminCompactBtn>
            </span>
          ) : null}
          <AdminCompactBtn
            type="button"
            variant="outline"
            disabled={applying}
            onClick={() => !applying && onClose()}
          >
            {labels.cancel}
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="accent"
            disabled={applying}
            onClick={() => void onApply()}
          >
            {applying ? '…' : labels.apply}
          </AdminCompactBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

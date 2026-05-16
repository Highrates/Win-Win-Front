'use client';

import { useEffect, useMemo } from 'react';
import modalStyles from '@/app/(account)/account/projects/components/CreateEditProjectModal.module.css';
import { AdminOrderSideChat } from '../AdminOrderSideChat';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useMergedAdminOrderStatusLabels } from '@/lib/admin-i18n/useMergedAdminOrderStatusLabels';
import { ORDER_STATUS_FLOW } from '@/lib/orders/orderStatus';
import type { CommercialProposalLineApi } from '@/lib/commercialProposal/types';
import type { KpOfferTotals } from '@/lib/commercialProposal/kpOfferTotals';
import catalogStyles from '../../../catalog/catalogAdmin.module.css';
import own from './OrderKpPublishConfirmModal.module.css';

export type NextOrderStatusChoice = Exclude<(typeof ORDER_STATUS_FLOW)[number], 'PENDING_APPROVAL'>;

type Labels = {
  title: string;
  cancel: string;
  submit: string;
  submitting: string;
};

type Props = {
  open: boolean;
  orderId: string;
  lines: CommercialProposalLineApi[];
  lineCount: number;
  totals: KpOfferTotals;
  numberLocale: string;
  labels: Labels;
  publishing: boolean;
  /** Заказ «На согласовании» — выбор следующего статуса по каждой позиции */
  showNextStatus: boolean;
  nextOrderStatus: NextOrderStatusChoice;
  onNextOrderStatus: (s: NextOrderStatusChoice) => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function formatRubInt(n: number, numberLocale: string): string {
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function lineTitle(snap: Record<string, unknown> | null): string {
  if (snap && typeof snap.productName === 'string' && snap.productName.trim()) return snap.productName.trim();
  return '—';
}

const NEXT_STATUS_OPTIONS: NextOrderStatusChoice[] = ORDER_STATUS_FLOW.filter(
  (s) => s !== 'PENDING_APPROVAL',
) as NextOrderStatusChoice[];

export function OrderKpPublishConfirmModal({
  open,
  orderId,
  lines,
  lineCount,
  totals,
  numberLocale,
  labels,
  publishing,
  showNextStatus,
  nextOrderStatus,
  onNextOrderStatus,
  onClose,
  onConfirm,
}: Props) {
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const statusLabels = useMergedAdminOrderStatusLabels();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !publishing) onClose();
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
  }, [open, onClose, publishing]);

  if (!open) return null;

  const pct = Math.round(totals.avgDiscountPercent * 10) / 10;
  const pctLabel = `${pct}%`;
  const oldF = formatRubInt(totals.oldTotalRub, numberLocale);
  const newF = formatRubInt(totals.newTotalRub, numberLocale);

  return (
    <div
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-publish-confirm-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose();
      }}
    >
      <div className={`${modalStyles.panel} ${own.panelWide}`}>
        <div className={modalStyles.panelHead}>
          <h2 id="kp-publish-confirm-title" className={modalStyles.panelTitle}>
            {labels.title}
          </h2>
          <button
            type="button"
            className={modalStyles.closeBtn}
            style={{ fontSize: 28, lineHeight: 1, fontWeight: 300 }}
            aria-label="Закрыть"
            disabled={publishing}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={own.bodySplit}>
          <div className={own.summaryCol}>
            <p className={own.summaryTitle}>{d.kpPublishSummaryHeading}</p>
            <p className={own.summaryMeta}>{d.kpPublishPositions(lineCount)}</p>
            <p className={own.digitsRow}>
              <span style={{ color: 'var(--color-red)' }}>{pctLabel}</span>
              <span className={own.sep} aria-hidden>
                ·
              </span>
              <span>{oldF}</span>
              <span className={own.sep} aria-hidden>
                ·
              </span>
              <span className={own.grandNew}>{newF}</span>
            </p>

            {showNextStatus && lines.length > 0 ? (
              <ul className={own.linesList}>
                {lines.map((line) => {
                  const snap =
                    line.snapshot && typeof line.snapshot === 'object'
                      ? (line.snapshot as Record<string, unknown>)
                      : null;
                  const name = lineTitle(snap);
                  const selectId = `kp-publish-status-${line.id}`;
                  return (
                    <li key={line.id} className={own.lineRow}>
                      <p className={own.lineName}>{name}</p>
                      <label className={own.statusLabel} htmlFor={selectId}>
                        {d.kpPublishNextStatus}
                      </label>
                      <select
                        id={selectId}
                        className={catalogStyles.input}
                        value={nextOrderStatus}
                        disabled={publishing}
                        onChange={(e) => onNextOrderStatus(e.target.value as NextOrderStatusChoice)}
                        style={{ width: '100%', marginTop: 6 }}
                      >
                        {NEXT_STATUS_OPTIONS.map((v) => (
                          <option key={v} value={v}>
                            {statusLabels[v] ?? v}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className={own.footerRow}>
              <button type="button" className={catalogStyles.btn} disabled={publishing} onClick={onClose}>
                {labels.cancel}
              </button>
              <button
                type="button"
                className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
                disabled={publishing}
                onClick={() => void onConfirm()}
              >
                {publishing ? labels.submitting : labels.submit}
              </button>
            </div>
          </div>
          <div className={own.chatCol}>
            <div className={own.chatHost}>
              <AdminOrderSideChat orderId={orderId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

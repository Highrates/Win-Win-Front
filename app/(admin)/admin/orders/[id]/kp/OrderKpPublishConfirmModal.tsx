'use client';

import { useEffect, useMemo } from 'react';
import modalStyles from '@/app/(account)/account/projects/components/CreateEditProjectModal.module.css';
import { AdminOrderSideChat } from '../AdminOrderSideChat';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useMergedAdminOrderStatusLabels } from '@/lib/admin-i18n/useMergedAdminOrderStatusLabels';
import catalogStyles from '../../../catalog/catalogAdmin.module.css';
import own from './OrderKpPublishConfirmModal.module.css';

export type KpOfferTotals = {
  oldTotalRub: number;
  newTotalRub: number;
  avgDiscountPercent: number;
};

export type NextOrderStatusChoice = 'ORDERED' | 'PAID' | 'RECEIVED';

type Labels = {
  title: string;
  cancel: string;
  submit: string;
  submitting: string;
};

type Props = {
  open: boolean;
  orderId: string;
  lineCount: number;
  totals: KpOfferTotals;
  numberLocale: string;
  labels: Labels;
  publishing: boolean;
  /** Заказ «На согласовании» — показать выбор следующего статуса */
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

const NEXT_STATUS_OPTIONS: NextOrderStatusChoice[] = ['ORDERED', 'PAID', 'RECEIVED'];

export function OrderKpPublishConfirmModal({
  open,
  orderId,
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
              <span>{pctLabel}</span>
              <span className={own.sep} aria-hidden>
                ·
              </span>
              <span>{oldF}</span>
              <span className={own.sep} aria-hidden>
                ·
              </span>
              <span className={own.grandNew}>{newF}</span>
            </p>

            {showNextStatus ? (
              <div className={own.statusBlock}>
                <label className={own.statusLabel} htmlFor="kp-publish-next-status">
                  {d.kpPublishNextStatus}
                </label>
                <select
                  id="kp-publish-next-status"
                  className={catalogStyles.input}
                  value={nextOrderStatus}
                  disabled={publishing}
                  onChange={(e) => onNextOrderStatus(e.target.value as NextOrderStatusChoice)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {NEXT_STATUS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {statusLabels[v] ?? v}
                    </option>
                  ))}
                </select>
              </div>
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

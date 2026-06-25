'use client';

import { useEffect, useMemo, useRef } from 'react';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminSourcingKpStrings } from '@/lib/admin-i18n/adminSourcingKpI18n';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import type { SourcingCommercialProposalLineApi } from '@/lib/sourcingCommercialProposal/types';
import { AdminSourcingSideChat } from '../AdminSourcingSideChat';
import orderModalStyles from '../../../[id]/kp/OrderKpPublishConfirmModal.module.css';

type Labels = {
  title: string;
  cancel: string;
  submit: string;
  submitting: string;
};

type Props = {
  open: boolean;
  sourcingRequestId: string;
  lines: SourcingCommercialProposalLineApi[];
  lineCount: number;
  totalRub: number;
  numberLocale: string;
  labels: Labels;
  publishing: boolean;
  draftOrPublishError?: string | null;
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

export function SourcingKpPublishConfirmModal({
  open,
  sourcingRequestId,
  lines,
  lineCount,
  totalRub,
  numberLocale,
  labels,
  publishing,
  draftOrPublishError,
  onClose,
  onConfirm,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminSourcingKpStrings(locale), [locale]);

  useModalFocusTrap(open, panelRef);

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

  const totalFormatted = formatRubInt(totalRub, numberLocale);

  return (
    <div
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sourcing-kp-publish-confirm-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose();
      }}
    >
      <div ref={panelRef} className={`${modalStyles.panel} ${orderModalStyles.publishPanel}`} tabIndex={-1}>
        <div className={modalStyles.panelHead}>
          <h2 id="sourcing-kp-publish-confirm-title" className={modalStyles.panelTitle}>
            {labels.title}
          </h2>
          <AdminModalCloseButton label={t.modalClose} disabled={publishing} onClick={onClose} />
        </div>
        <div className={orderModalStyles.bodySplit}>
          <div className={orderModalStyles.summaryCol}>
            <p className={orderModalStyles.summaryTitle}>{t.kpPublishSummaryHeading}</p>
            <p className={orderModalStyles.summaryMeta}>{t.kpPublishPositions(lineCount)}</p>
            <p className={orderModalStyles.digitsRow}>
              <span className={orderModalStyles.grandNew}>
                {t.kpPublishTotalLabel}: {totalFormatted}
              </span>
            </p>

            {draftOrPublishError?.trim() ? (
              <p className={orderModalStyles.flowError} role="alert" aria-live="polite">
                {draftOrPublishError.trim()}
              </p>
            ) : null}

            {lines.length > 0 ? (
              <ul className={orderModalStyles.linesList} aria-label={t.kpPublishLinesAria}>
                {lines.map((line) => (
                  <li key={line.id} className={orderModalStyles.lineRow}>
                    <p className={orderModalStyles.lineName}>{line.productName.trim() || '—'}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className={orderModalStyles.footerRow}>
              <AdminCompactBtn type="button" variant="outline" disabled={publishing} onClick={onClose}>
                {labels.cancel}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                variant="accent"
                disabled={publishing}
                onClick={() => void onConfirm()}
              >
                {publishing ? labels.submitting : labels.submit}
              </AdminCompactBtn>
            </div>
          </div>
          <div className={orderModalStyles.chatCol}>
            <div className={orderModalStyles.chatHost}>
              <AdminSourcingSideChat sourcingRequestId={sourcingRequestId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

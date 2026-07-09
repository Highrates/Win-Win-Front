'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { adminStaffPage } from '@/lib/admin-i18n/adminStaffI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';

export function StaffPasswordRevealModal({
  open,
  emailSent,
  onClose,
  onRetry,
  retrying = false,
}: {
  open: boolean;
  emailSent?: boolean;
  onClose: () => void;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminStaffPage(locale), [locale]);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={modalStyles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={modalStyles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.panelHead}>
          <h2 id={titleId} className={modalStyles.panelTitle}>
            {t.passwordTitle}
          </h2>
          <AdminModalCloseButton onClick={onClose} label={t.close} />
        </div>
        <div className={modalStyles.body}>
          <p>{t.passwordHint}</p>
          {emailSent ? (
            <p>{t.passwordEmailSent}</p>
          ) : (
            <>
              <p style={{ color: 'var(--color-danger, #c0392b)' }}>{t.passwordEmailFailed}</p>
              <p>{t.passwordRetryHint}</p>
            </>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {!emailSent && onRetry ? (
              <AdminCompactBtn type="button" disabled={retrying} onClick={onRetry}>
                {retrying ? (locale === 'zh' ? '发送中…' : 'Отправка…') : t.passwordRetrySend}
              </AdminCompactBtn>
            ) : null}
            <AdminCompactBtn type="button" onClick={onClose}>
              {t.close}
            </AdminCompactBtn>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

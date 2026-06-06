'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';

type Props = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: 'accent' | 'danger';
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function AdminConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
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
  }, [open, loading, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={modalStyles.overlay}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        ref={panelRef}
        className={modalStyles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? `${titleId}-body` : undefined}
      >
        <div className={modalStyles.panelHead}>
          <h2 id={titleId} className={modalStyles.panelTitle}>
            {title}
          </h2>
          <AdminModalCloseButton
            label={cancelLabel}
            disabled={loading}
            onClick={() => !loading && onClose()}
          />
        </div>
        {children ? (
          <div id={`${titleId}-body`} className={modalStyles.body}>
            {children}
          </div>
        ) : null}
        <div className={modalStyles.panelFooter}>
          <AdminCompactBtn type="button" variant="outline" disabled={loading} onClick={() => !loading && onClose()}>
            {cancelLabel}
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant={confirmVariant}
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? '…' : confirmLabel}
          </AdminCompactBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

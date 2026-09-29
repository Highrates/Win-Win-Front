'use client';

import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/Button';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './AccountConfirmDialog.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type AccountConfirmDialogProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Красная кнопка подтверждения (удаление). */
  danger?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

/** Модалка подтверждения для ЛК (удаление и т.п.). */
export function AccountConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  busy = false,
  onClose,
  onConfirm,
}: AccountConfirmDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => {
    if (busy) return;
    onClose();
  };
  useModalBodyLock(open, close);
  useModalFocusTrap(open, panelRef);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button type="button" className={styles.backdrop} aria-label="Закрыть" onClick={close} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <button type="button" className={styles.closeBtn} onClick={close} aria-label="Закрыть" disabled={busy}>
            <CloseIcon />
          </button>
        </header>
        <div className={styles.body}>
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
          {children ? <div className={styles.content}>{children}</div> : null}
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={close} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              className={danger ? styles.dangerBtn : undefined}
              disabled={busy}
              onClick={() => void onConfirm()}
            >
              {busy ? '…' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

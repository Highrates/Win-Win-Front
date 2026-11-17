'use client';

import { useEffect, useId, useRef } from 'react';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './AdminModal.module.css';

export function AdminModal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
  size,
  keepMounted = false,
  closeLabel = 'Закрыть',
  lockScroll = true,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  size?: 'default' | 'assistant';
  keepMounted?: boolean;
  /** Подпись кнопки закрытия (a11y). */
  closeLabel?: string;
  /** Блокировать scroll html/body, пока модалка открыта. */
  lockScroll?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !lockScroll) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open, lockScroll]);

  if (!open && !keepMounted) return null;

  const panelClass = [
    styles.panel,
    wide || size === 'assistant' ? styles.panelWide : '',
    size === 'assistant' ? styles.panelAssistant : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={styles.overlay}
      role="presentation"
      hidden={!open}
      style={!open ? { display: 'none' } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className={styles.panelHead}>
          <h2 id={titleId} className={styles.panelTitle}>
            {title}
          </h2>
          <AdminModalCloseButton onClick={onClose} label={closeLabel} />
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.panelFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

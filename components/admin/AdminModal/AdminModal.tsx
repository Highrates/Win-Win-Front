'use client';

import { useEffect, useId, useRef } from 'react';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
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
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  size?: 'default' | 'assistant';
  keepMounted?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
      >
        <div className={styles.panelHead}>
          <h2 id={titleId} className={styles.panelTitle}>
            {title}
          </h2>
          <AdminModalCloseButton onClick={onClose} label="Закрыть" />
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.panelFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

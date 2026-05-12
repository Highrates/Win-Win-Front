'use client';

import { useEffect } from 'react';
import modalStyles from '@/app/(account)/account/projects/components/CreateEditProjectModal.module.css';
import styles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import confirmStyles from './AdminOrdersConfirmModal.module.css';

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmClassName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function AdminOrdersConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  confirmClassName,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
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

  if (!open) return null;

  const confirmCls = confirmClassName ?? `${styles.btn} ${styles.btnDanger}`;

  return (
    <div
      className={modalStyles.overlay}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className={modalStyles.panel} role="dialog" aria-modal aria-labelledby="admin-orders-confirm-title">
        <div className={modalStyles.panelHead}>
          <h2 id="admin-orders-confirm-title" className={modalStyles.panelTitle}>
            {title}
          </h2>
          <button
            type="button"
            className={`${modalStyles.closeBtn} ${confirmStyles.closeBtnLarge}`}
            aria-label={cancelLabel}
            disabled={loading}
            onClick={() => !loading && onClose()}
          >
            ×
          </button>
        </div>
        <div className={modalStyles.body}>{children}</div>
        <div className={modalStyles.panelFooter}>
          <button type="button" className={styles.btn} disabled={loading} onClick={() => !loading && onClose()}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmCls} disabled={loading} onClick={() => void onConfirm()}>
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

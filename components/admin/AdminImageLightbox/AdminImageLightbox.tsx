'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './AdminImageLightbox.module.css';

type Props = {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
};

export function AdminImageLightbox({ open, src, alt = '', onClose }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open, onClose]);

  if (!open || !src || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {alt.trim() || 'Изображение'}
          </h2>
          <AdminModalCloseButton label="Закрыть" onClick={onClose} />
        </div>
        <div className={styles.stage}>
          <img className={styles.image} src={src} alt={alt} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

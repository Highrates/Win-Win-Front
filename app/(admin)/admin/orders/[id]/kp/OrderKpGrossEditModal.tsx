'use client';

import { useEffect, useState } from 'react';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import styles from '../../../catalog/catalogAdmin.module.css';
import { KpGrossFieldsEditor } from './KpGrossFieldsEditor';

type Props = {
  open: boolean;
  productName: string;
  snapshot: Record<string, unknown> | null;
  onClose: () => void;
  onSave: (snapshot: Record<string, unknown>) => void;
};

export function OrderKpGrossEditModal({ open, productName, snapshot, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown> | null>(snapshot);

  useEffect(() => {
    if (!open) return;
    setDraft(snapshot && typeof snapshot === 'object' ? { ...snapshot } : {});
  }, [open, snapshot]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
  }, [open, onClose]);

  if (!open) return null;

  const title = productName.trim() || 'Позиция';

  return (
    <div
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-gross-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={modalStyles.panel} style={{ maxWidth: 420, width: '100%' }}>
        <div className={modalStyles.panelHead}>
          <h2 id="kp-gross-edit-title" className={modalStyles.panelTitle}>
            Габариты брутто
          </h2>
          <AdminModalCloseButton label="Закрыть" onClick={onClose} />
        </div>
        <div className={modalStyles.body} style={{ width: '100%', boxSizing: 'border-box' }}>
          <p className={styles.cardNote} style={{ marginTop: 0, marginBottom: 16 }}>
            {title}
          </p>
          <KpGrossFieldsEditor snapshot={draft} onSnapshotChange={setDraft} fullWidth />
        </div>
        <div className={modalStyles.panelFooter}>
          <AdminCompactBtn type="button" variant="outline" onClick={onClose}>
            Отмена
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="accent"
            onClick={() => onSave(draft && typeof draft === 'object' ? draft : {})}
          >
            Сохранить
          </AdminCompactBtn>
        </div>
      </div>
    </div>
  );
}

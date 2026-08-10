'use client';

import { useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { PRODUCT_QA_BODY_MAX_CHARS } from '@/lib/productQa/constants';
import styles from './ChatMessageBodyEdit.module.css';

type Props = {
  initialBody: string;
  busy?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  onSave: (body: string) => void | Promise<void>;
  onCancel: () => void;
};

export function ChatMessageBodyEdit({
  initialBody,
  busy = false,
  saveLabel = 'Сохранить',
  cancelLabel = 'Отмена',
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(initialBody);

  return (
    <div className={styles.root}>
      <textarea
        className={styles.textarea}
        value={draft}
        disabled={busy}
        maxLength={PRODUCT_QA_BODY_MAX_CHARS}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className={styles.actions}>
        <AdminCompactBtn
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void onSave(draft.trim())}
        >
          {busy ? 'Сохранение…' : saveLabel}
        </AdminCompactBtn>
        <AdminCompactBtn type="button" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </AdminCompactBtn>
      </div>
    </div>
  );
}

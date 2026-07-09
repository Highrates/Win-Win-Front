'use client';

import { useRef } from 'react';
import styles from './staffAdmin.module.css';

const DEFAULT_STAFF_AVATAR = '/images/Admin-avatar.jpeg';

export function StaffAvatarField({
  label,
  previewUrl,
  disabled,
  uploading,
  hint,
  onFileSelect,
}: {
  label: string;
  previewUrl: string | null;
  disabled?: boolean;
  uploading?: boolean;
  hint?: string;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = previewUrl?.trim() || DEFAULT_STAFF_AVATAR;

  return (
    <div className={styles.avatarField}>
      <span className={styles.avatarLabel}>{label}</span>
      <label
        className={`${styles.avatarPicker} ${disabled || uploading ? styles.avatarPickerDisabled : ''}`}
      >
        <img src={src} alt="" className={styles.avatarImage} width={96} height={96} />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.avatarInput}
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFileSelect(file);
          }}
        />
      </label>
      {hint ? <p className={styles.avatarHint}>{hint}</p> : null}
    </div>
  );
}

export { DEFAULT_STAFF_AVATAR };

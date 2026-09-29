'use client';

import styles from './CaseCoverUpload.module.css';

type Props = {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
};

/** Обложка кейса: одно вертикальное изображение 9:16, не на всю ширину. */
export function CaseCoverUpload({ file, previewUrl, onChange, onRemove }: Props) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>Обложка кейса</span>
      <p className={styles.hint}>Одно изображение, формат 9:16</p>
      <label
        className={styles.uploadBox}
        style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
      >
        <input
          type="file"
          accept="image/*"
          className={styles.uploadInput}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <span className={styles.uploadCaption}>{file ? file.name : 'Загрузить фото'}</span>
        {file || previewUrl ? (
          <button
            type="button"
            className={styles.uploadRemove}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            Удалить
          </button>
        ) : null}
      </label>
    </div>
  );
}

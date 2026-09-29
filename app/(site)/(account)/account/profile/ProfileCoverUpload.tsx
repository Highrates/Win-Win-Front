'use client';

import coverStyles from '@/components/CoverGridField/CoverGridField.module.css';

type Props = {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
};

/** Только горизонтальная обложка 16:9 (профиль дизайнера). */
export function ProfileCoverUpload({ file, previewUrl, onChange, onRemove }: Props) {
  return (
    <div className={coverStyles.field}>
      <div className={coverStyles.gridOptions}>
        <div className={coverStyles.gridOptionStatic}>
          <label
            className={coverStyles.uploadBox169}
            style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
          >
            <input
              type="file"
              accept="image/*"
              className={coverStyles.uploadInput}
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            <span className={coverStyles.uploadCaption}>{file ? file.name : 'Загрузить фото'}</span>
            {file || previewUrl ? (
              <button
                type="button"
                className={coverStyles.uploadRemove}
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
      </div>
    </div>
  );
}

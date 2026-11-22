'use client';

import styles from './ProfileCollageUpload.module.css';

type SlotProps = {
  label: string;
  hint?: string;
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  /** Слот нельзя очистить до пустого (например, аватар по умолчанию). */
  clearable?: boolean;
};

function CollageSlot({
  label,
  hint,
  file,
  previewUrl,
  onChange,
  onRemove,
  clearable = true,
}: SlotProps) {
  return (
    <div className={styles.slot}>
      <div className={styles.slotHead}>
        <span className={styles.slotLabel}>{label}</span>
        {hint ? <span className={styles.slotHint}>{hint}</span> : null}
      </div>
      <label
        className={styles.uploadBox}
        style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
      >
        <input
          type="file"
          accept="image/*"
          className={styles.uploadInput}
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null;
            onChange(next);
            e.currentTarget.value = '';
          }}
        />
        <span className={styles.uploadCaption}>{file ? file.name : previewUrl ? 'Заменить' : 'Загрузить'}</span>
        {clearable && (file || previewUrl) ? (
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

export type ProfileCollageUploadProps = {
  primaryFile: File | null;
  primaryPreviewUrl: string | null;
  onPrimaryChange: (file: File | null) => void;
  onPrimaryRemove: () => void;
  secondaryFile: File | null;
  secondaryPreviewUrl: string | null;
  onSecondaryChange: (file: File | null) => void;
  onSecondaryRemove: () => void;
  /** Подпись под превью, если primary пуст и на сайте подставится кейс. */
  primaryFallbackHint?: string | null;
};

/** Два кадра обложки в раскладке tours_collage + слоты загрузки. */
export function ProfileCollageUpload({
  primaryFile,
  primaryPreviewUrl,
  onPrimaryChange,
  onPrimaryRemove,
  secondaryFile,
  secondaryPreviewUrl,
  onSecondaryChange,
  onSecondaryRemove,
  primaryFallbackHint,
}: ProfileCollageUploadProps) {
  const showCollage = Boolean(primaryPreviewUrl || secondaryPreviewUrl);

  return (
    <div className={styles.root}>
      {showCollage ? (
        <div className={styles.collage} aria-hidden={!primaryPreviewUrl && !secondaryPreviewUrl}>
          {primaryPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.collagePrimary} src={primaryPreviewUrl} alt="" />
          ) : (
            <div className={styles.collagePlaceholder}>
              {primaryFallbackHint ? <span>{primaryFallbackHint}</span> : null}
            </div>
          )}
          {secondaryPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.collageSecondary} src={secondaryPreviewUrl} alt="" />
          ) : null}
        </div>
      ) : null}

      <div className={styles.slots}>
        <CollageSlot
          label="Основное фото"
          hint="Большой кадр слева"
          file={primaryFile}
          previewUrl={primaryPreviewUrl}
          onChange={onPrimaryChange}
          onRemove={onPrimaryRemove}
        />
        <CollageSlot
          label="Второе фото"
          hint="Наклонённый кадр справа; по умолчанию — аватар"
          file={secondaryFile}
          previewUrl={secondaryPreviewUrl}
          onChange={onSecondaryChange}
          onRemove={onSecondaryRemove}
        />
      </div>
    </div>
  );
}

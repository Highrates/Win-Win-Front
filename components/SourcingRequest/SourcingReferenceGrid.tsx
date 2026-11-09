import { useState } from 'react';
import { SOURCING_REFERENCE_ACCEPT } from './types';
import styles from './SourcingRequestModal.module.css';
import { DeleteIcon, PlusIcon } from './SourcingFormIcons';
import type { SourcingReferenceImage } from './types';

type Props = {
  images: SourcingReferenceImage[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (imageId: string) => void;
  notice?: string;
  processing?: boolean;
};

function hasFiles(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

export function SourcingReferenceGrid({ images, onAdd, onRemove, notice, processing = false }: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className={styles.referenceGridWrap}>
      <div
        className={`${styles.referenceGrid} ${dragOver ? styles.referenceGridDragOver : ''}`}
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
        }}
      >
        {images.map((image) => (
          <div key={image.id} className={styles.referenceThumb}>
            <a
              href={image.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.referenceThumbLink}
              aria-label={`Открыть ${image.file.name}`}
            >
              <img src={image.previewUrl} alt={image.file.name} className={styles.referenceThumbImage} />
            </a>
            <button
              type="button"
              className={`${styles.deleteIconBtn} ${styles.referenceThumbDelete}`}
              aria-label={`Удалить ${image.file.name}`}
              onClick={() => onRemove(image.id)}
            >
              <DeleteIcon size={16} />
            </button>
          </div>
        ))}
        {processing ? (
          <div className={`${styles.referenceThumb} ${styles.referenceProcessing}`} role="status">
            Обработка…
          </div>
        ) : null}
        <label className={styles.referenceAddTile} aria-label="Добавить изображение">
          <input
            type="file"
            accept={SOURCING_REFERENCE_ACCEPT}
            multiple
            className={styles.referenceUploadInput}
            onChange={(e) => {
              if (e.target.files?.length) onAdd(e.target.files);
              e.currentTarget.value = '';
            }}
          />
          <span className={styles.referenceAddIcon}>
            <PlusIcon />
          </span>
        </label>
      </div>
      {notice ? (
        <p className={styles.fileNotice} role="alert">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

import { SOURCING_REFERENCE_ACCEPT } from './types';
import styles from './SourcingRequestModal.module.css';
import { DeleteIcon, PlusIcon } from './SourcingFormIcons';
import type { SourcingReferenceImage } from './types';

type Props = {
  images: SourcingReferenceImage[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (imageId: string) => void;
};

export function SourcingReferenceGrid({ images, onAdd, onRemove }: Props) {
  return (
    <div className={styles.referenceGrid}>
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
  );
}

import { SOURCING_FILES_HINT } from './sourcingLimits';
import { SOURCING_ATTACHMENT_ACCEPT, type SourcingFormAttachment } from './types';
import styles from './SourcingRequestModal.module.css';
import { DeleteIcon } from './SourcingFormIcons';

type Props = {
  attachments: SourcingFormAttachment[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
};

export function SourcingAttachmentsBlock({ attachments, onAdd, onRemove }: Props) {
  return (
    <div className={styles.attachmentsBlock}>
      <h3 className={styles.productsTitle}>Файлы к заявке</h3>
      <p className={styles.attachmentsHint}>{SOURCING_FILES_HINT}</p>
      <label className={styles.attachmentsUpload}>
        <input
          type="file"
          multiple
          accept={SOURCING_ATTACHMENT_ACCEPT}
          className={styles.attachmentsUploadInput}
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files);
            e.currentTarget.value = '';
          }}
        />
        Прикрепить файлы
      </label>
      {attachments.length > 0 ? (
        <ul className={styles.attachmentsList}>
          {attachments.map((attachment) => (
            <li key={attachment.id} className={styles.attachmentItem}>
              <span className={styles.attachmentName} title={attachment.file.name}>
                {attachment.file.name}
              </span>
              <button
                type="button"
                className={`${styles.deleteIconBtn} ${styles.attachmentDelete}`}
                aria-label={`Удалить ${attachment.file.name}`}
                onClick={() => onRemove(attachment.id)}
              >
                <DeleteIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

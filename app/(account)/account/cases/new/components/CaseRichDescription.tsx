'use client';

import { RichBlock } from '@/components/RichBlock/RichBlock';
import styles from '../page.module.css';

type CaseRichDescriptionProps = {
  value: string;
  onChange: (value: string) => void;
  uploadMedia?: (file: File, type: 'image' | 'video') => Promise<string>;
};

export function CaseRichDescription({ value, onChange, uploadMedia }: CaseRichDescriptionProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>Описание</span>
      <RichBlock
        value={value}
        onChange={onChange}
        placeholder="Добавьте подробное описание кейса: заголовки, текст, изображения..."
        uploadMedia={uploadMedia}
      />
    </div>
  );
}

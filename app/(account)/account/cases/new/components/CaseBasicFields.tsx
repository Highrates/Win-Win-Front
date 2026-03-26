'use client';

import { useMemo } from 'react';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import styles from '../page.module.css';

type CaseBasicFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
};

export function CaseBasicFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: CaseBasicFieldsProps) {
  const descriptionCount = useMemo(() => description.trim().length, [description]);

  return (
    <>
      <TextField
        label="Название кейса"
        id="case-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Введите название"
      />

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="case-description">
            Короткое описание кейса
          </label>
          <span className={styles.counter}>{descriptionCount}/220</span>
        </div>
        <textarea
          id="case-description"
          className={`${textFieldStyles.input} ${styles.textarea}`}
          value={description}
          maxLength={220}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Опишите кейс"
        />
      </div>
    </>
  );
}

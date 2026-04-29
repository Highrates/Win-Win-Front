'use client';

import { useMemo } from 'react';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { formatBudgetDigitsGrouped, parseBudgetDigits } from '@/lib/formatBudgetRub';
import styles from '../page.module.css';

type CaseBasicFieldsProps = {
  title: string;
  onTitleChange: (value: string) => void;
  shortDescription: string;
  onShortDescriptionChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  /** Только цифры (состояние родителя). */
  budgetDigits: string;
  onBudgetDigitsChange: (value: string) => void;
};

export function CaseBasicFields({
  title,
  onTitleChange,
  shortDescription,
  onShortDescriptionChange,
  location,
  onLocationChange,
  year,
  onYearChange,
  budgetDigits,
  onBudgetDigitsChange,
}: CaseBasicFieldsProps) {
  const descriptionCount = useMemo(() => shortDescription.trim().length, [shortDescription]);
  const budgetDisplay = formatBudgetDigitsGrouped(budgetDigits);

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
          <span className={styles.counter}>{descriptionCount}/400</span>
        </div>
        <textarea
          id="case-description"
          className={`${textFieldStyles.input} ${styles.textarea}`}
          value={shortDescription}
          maxLength={400}
          onChange={(e) => onShortDescriptionChange(e.target.value)}
          placeholder="Опишите кейс"
        />
      </div>

      <div className={styles.locationYearRow}>
        <TextField
          className={styles.locationYearGrow}
          label="Локация"
          id="case-location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Например: Москва"
        />
        <TextField
          className={styles.locationYearFixed}
          label="Год"
          id="case-year"
          value={year}
          inputMode="numeric"
          onChange={(e) => onYearChange(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
          placeholder="Например: 2025"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="case-budget">
          Бюджет
        </label>
        <div className={styles.budgetWrap}>
          <input
            id="case-budget"
            className={`${textFieldStyles.input} ${styles.budgetInput}`}
            inputMode="numeric"
            autoComplete="off"
            value={budgetDisplay}
            onChange={(e) => onBudgetDigitsChange(parseBudgetDigits(e.target.value))}
            placeholder="Например: 2 500 000"
            aria-describedby="case-budget-suffix"
          />
          <span id="case-budget-suffix" className={styles.budgetRub}>
            ₽
          </span>
        </div>
      </div>
    </>
  );
}

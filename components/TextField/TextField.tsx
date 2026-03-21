'use client';

import { useId } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Строка — показать текст ошибки и aria-invalid; true — только aria-invalid */
  error?: boolean | string;
}

export function TextField({
  label,
  id,
  error,
  disabled,
  readOnly,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? inputProps.name ?? generatedId;
  const errorSuffix = useId();
  const errorId = typeof error === 'string' && error.trim() ? `err-${errorSuffix}` : undefined;
  const invalid = Boolean(
    error === true || (typeof error === 'string' && error.trim().length > 0),
  );

  return (
    <div
      className={`${styles.field} ${disabled ? styles.fieldDisabled : ''} ${className ?? ''}`.trim()}
    >
      <label className={styles.label} htmlFor={inputId}>
        <span className={styles.labelText}>{label}</span>
        <input
          id={inputId}
          className={styles.input}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={errorId}
          {...inputProps}
        />
      </label>
      {typeof error === 'string' && error.trim() ? (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

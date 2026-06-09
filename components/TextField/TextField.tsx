'use client';

import { useId, useState } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Строка — показать текст ошибки и aria-invalid; true — только aria-invalid */
  error?: boolean | string;
}

function PasswordToggleButton({
  visible,
  onToggle,
  inputId,
}: {
  visible: boolean;
  onToggle: () => void;
  inputId: string;
}) {
  return (
    <button
      type="button"
      className={styles.passwordToggle}
      aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      aria-controls={inputId}
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.62 11.62 0 01-4.12 4.97M6.12 6.12A11.35 11.35 0 002 12.5C3.73 16.39 8 19.5 13 19.5c1.55 0 3.03-.3 4.38-.85"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="13" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}

export function TextField({
  label,
  id,
  error,
  disabled,
  readOnly,
  className,
  type,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? inputProps.name ?? generatedId;
  const errorSuffix = useId();
  const errorId = typeof error === 'string' && error.trim() ? `err-${errorSuffix}` : undefined;
  const invalid = Boolean(
    error === true || (typeof error === 'string' && error.trim().length > 0),
  );
  const isPassword = type === 'password';
  const [passwordVisible, setPasswordVisible] = useState(false);
  const resolvedType = isPassword && passwordVisible ? 'text' : type;

  return (
    <div
      className={`${styles.field} ${disabled ? styles.fieldDisabled : ''} ${className ?? ''}`.trim()}
    >
      <label className={styles.label} htmlFor={inputId}>
        <span className={styles.labelText}>{label}</span>
      </label>
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          className={`${styles.input} ${isPassword ? styles.inputWithToggle : ''}`.trim()}
          type={resolvedType}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={errorId}
          {...inputProps}
        />
        {isPassword && !disabled && !readOnly ? (
          <PasswordToggleButton
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((v) => !v)}
            inputId={inputId}
          />
        ) : null}
      </div>
      {typeof error === 'string' && error.trim() ? (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

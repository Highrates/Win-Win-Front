'use client';

import { useId, useMemo, useState } from 'react';
import { PHONE_COUNTRIES, type PhoneCountryOption, buildE164, getPhoneCountry } from '@/lib/validation';
import styles from './PhoneField.module.css';

export interface PhoneFieldProps {
  label?: string;
  name?: string;
  disabled?: boolean;
  error?: boolean | string;
  /** ISO по умолчанию */
  defaultIso?: string;
  /** Сброс ошибки с родителя при изменении номера или страны */
  onPhoneChange?: () => void;
}

function placeholderFor(country: PhoneCountryOption): string {
  if (country.dial === '7') return '9001234567';
  if (country.iso === 'CN') return '1XXXXXXXXXX';
  return '';
}

export function PhoneField({
  label = 'Номер телефона',
  name = 'phone',
  disabled,
  error,
  defaultIso = 'RU',
  onPhoneChange,
}: PhoneFieldProps) {
  const initial = getPhoneCountry(defaultIso) ?? PHONE_COUNTRIES[0];
  const [iso, setIso] = useState(initial.iso);
  const [national, setNational] = useState('');
  const country = getPhoneCountry(iso) ?? PHONE_COUNTRIES[0];
  const fullValue = useMemo(() => buildE164(iso, national), [iso, national]);

  const generatedId = useId();
  const selectId = `${generatedId}-country`;
  const inputId = `${generatedId}-national`;
  const errorSuffix = useId();
  const errorId = typeof error === 'string' && error.trim() ? `err-${errorSuffix}` : undefined;
  const invalid = Boolean(
    error === true || (typeof error === 'string' && error.trim().length > 0),
  );

  const onNationalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setNational(digits);
    onPhoneChange?.();
  };

  return (
    <div className={styles.field}>
      <div className={styles.label}>
        <span className={styles.labelText} id={`${generatedId}-label`}>
          {label}
        </span>
        <div
          className={`${styles.composite} ${invalid ? styles.compositeInvalid : ''} ${disabled ? styles.compositeDisabled : ''}`.trim()}
        >
          <select
            id={selectId}
            className={styles.country}
            value={iso}
            disabled={disabled}
            aria-label="Код страны"
            onChange={(e) => {
              setIso(e.target.value);
              setNational('');
              onPhoneChange?.();
            }}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </select>
          <input
            id={inputId}
            className={styles.input}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={placeholderFor(country)}
            disabled={disabled}
            value={national}
            aria-invalid={invalid ? true : undefined}
            aria-labelledby={`${generatedId}-label`}
            aria-describedby={errorId}
            onChange={(e) => onNationalChange(e.target.value)}
          />
        </div>
      </div>
      <input type="hidden" name={name} value={fullValue} disabled={disabled} />
      {typeof error === 'string' && error.trim() ? (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

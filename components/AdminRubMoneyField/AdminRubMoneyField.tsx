'use client';

import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import {
  formatRubMoneyInputDisplay,
  formatRubMoneyInputTyping,
  parseRubMoneyInput,
} from '@/lib/adminRubMoneyInput';

type AdminRubMoneyFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (displayValue: string) => void;
  autoComplete?: string;
};

/** Поле суммы в ₽ с разделителями тысяч и суффиксом «₽». */
export function AdminRubMoneyField({
  label,
  name,
  value,
  onChange,
  autoComplete = 'off',
}: AdminRubMoneyFieldProps) {
  return (
    <AdminTextField
      label={label}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(formatRubMoneyInputTyping(e.target.value))}
      onBlur={() => {
        const n = parseRubMoneyInput(value);
        onChange(n > 0 || value.replace(/\D/g, '') ? formatRubMoneyInputDisplay(n) : '');
      }}
    />
  );
}

export { parseRubMoneyInput, formatRubMoneyInputDisplay };

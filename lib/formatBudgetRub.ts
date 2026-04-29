/** Только цифры для хранения в состоянии. */
export function parseBudgetDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Группы по 3, без валютного символа (для поля ввода / API). */
export function formatBudgetDigitsGrouped(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (!d) return '';
  const trimmed = d.replace(/^0+/, '') || '0';
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

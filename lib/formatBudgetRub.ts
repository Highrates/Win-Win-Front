import { parseBudgetDigits } from '@win-win/sourcing-request';

/** Группы по 3, без валютного символа (для поля ввода / API). */
export function formatBudgetDigitsGrouped(digits: string): string {
  const d = parseBudgetDigits(digits);
  if (!d) return '';
  const trimmed = d.replace(/^0+/, '') || '0';
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export { parseBudgetDigits } from '@win-win/sourcing-request';

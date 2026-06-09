/** Парсит ввод суммы в ₽: «4 000 000 ₽», «4000000», «4,000,000». */
export function parseRubMoneyInput(raw: string): number {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Отображение в поле админки: «4 000 000 ₽». */
export function formatRubMoneyInputDisplay(rub: number): string {
  if (!Number.isFinite(rub) || rub < 0) return '';
  if (rub === 0) return '0 ₽';
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(rub))} ₽`;
}

/** Форматирует произвольный ввод при наборе (цифры + пробелы + ₽). */
export function formatRubMoneyInputTyping(raw: string): string {
  const n = parseRubMoneyInput(raw);
  if (!String(raw ?? '').replace(/\D/g, '')) return '';
  return formatRubMoneyInputDisplay(n);
}

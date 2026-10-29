import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PiExcelImportDiffModal,
  sortPiExcelDiffFields,
  type PiExcelImportDiffLabels,
} from './PiExcelImportDiffModal';
import type { PiExcelImportResult } from '@/lib/commercialProposal/piExcelAdmin';

vi.mock('@/lib/commercialProposal/piExcelAdmin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/commercialProposal/piExcelAdmin')>();
  return {
    ...actual,
    downloadPiExcelImportReport: vi.fn(),
  };
});

const labels: PiExcelImportDiffLabels = {
  title: 'Превью импорта Excel',
  apply: 'Применить',
  cancel: 'Отмена',
  downloadReport: 'Скачать отчёт',
  matched: (n) => `Сопоставлено: ${n}`,
  changed: (n) => `С изменениями полей: ${n}`,
  unchanged: (n) => `Без изменений: ${n}`,
  unmatched: (n) => `Не сопоставлено: ${n}`,
  emptyMatchKey: (rows) => `Пустой T: ${rows.join(',')}`,
  noFieldChanges: 'Нет отличий',
  excelRow: (n) => `стр. Excel ${n}`,
  fieldLabel: (f) =>
    f === 'unitPriceCny' ? 'Цена ¥ (Excel)' : f === 'offerUnitPriceRub' ? 'Цена ₽ (после)' : f,
  formatValue: (v) => (v == null || v === '' ? '—' : String(v)),
};

const preview: PiExcelImportResult = {
  draft: null,
  dryRun: true,
  mode: 'merged',
  draftCreated: false,
  updatedCount: 1,
  changedLineCount: 1,
  unchangedCount: 0,
  unmatchedCount: 1,
  unmatched: ['строка Excel 13 (T=OI:missing)'],
  emptyMatchKeyRows: [14],
  changes: [
    {
      lineId: 'l1',
      label: 'Chair',
      excelRow: 12,
      fields: [
        { field: 'offerUnitPriceRub', before: null, after: 12500 },
        { field: 'unitPriceCny', before: 80, after: 100 },
        { field: 'quantity', before: 2, after: 3 },
      ],
    },
  ],
};

describe('sortPiExcelDiffFields', () => {
  it('orders CNY before RUB', () => {
    const sorted = sortPiExcelDiffFields([
      { field: 'offerUnitPriceRub', before: null, after: 1 },
      { field: 'unitPriceCny', before: 1, after: 2 },
      { field: 'quantity', before: 1, after: 2 },
    ]);
    expect(sorted.map((f) => f.field)).toEqual([
      'quantity',
      'unitPriceCny',
      'offerUnitPriceRub',
    ]);
  });
});

describe('PiExcelImportDiffModal', () => {
  it('renders summary, CNY/RUB fields, unmatched, and empty-T warn', () => {
    const onClose = vi.fn();
    const onApply = vi.fn();

    render(
      <PiExcelImportDiffModal
        open
        preview={preview}
        labels={labels}
        onClose={onClose}
        onApply={onApply}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Превью импорта Excel' })).toBeTruthy();
    expect(screen.getByText('Сопоставлено: 1')).toBeTruthy();
    expect(screen.getByText('Пустой T: 14')).toBeTruthy();
    expect(screen.getByText(/OI:missing/)).toBeTruthy();
    expect(screen.getByText('Цена ¥ (Excel)')).toBeTruthy();
    expect(screen.getByText('Цена ₽ (после)')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('12500')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    expect(onApply).toHaveBeenCalled();

    const cancelButtons = screen.getAllByRole('button', { name: 'Отмена' });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]!);
    expect(onClose).toHaveBeenCalled();
  });
});

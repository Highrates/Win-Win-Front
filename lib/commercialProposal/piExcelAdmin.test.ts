/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadPiExcelImportReport,
  withDryRunQuery,
  withImportExcelQuery,
} from './piExcelAdmin';

describe('withImportExcelQuery', () => {
  it('appends dryRun=1 when requested', () => {
    expect(
      withImportExcelQuery('orders/admin/1/commercial-proposals/draft/import-excel', {
        dryRun: true,
      }),
    ).toBe('orders/admin/1/commercial-proposals/draft/import-excel?dryRun=1');
  });

  it('appends expectedUpdatedAt for apply', () => {
    expect(
      withImportExcelQuery('path', {
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('path?expectedUpdatedAt=2026-01-01T00%3A00%3A00.000Z');
  });

  it('uses & when path already has query', () => {
    expect(withImportExcelQuery('path?foo=1', { dryRun: true })).toBe('path?foo=1&dryRun=1');
  });

  it('leaves path unchanged when no opts', () => {
    expect(withImportExcelQuery('path?foo=1')).toBe('path?foo=1');
  });

  it('withDryRunQuery stays compatible', () => {
    expect(withDryRunQuery('path', true)).toBe('path?dryRun=1');
  });
});

describe('downloadPiExcelImportReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a text report with unmatched and empty T rows', () => {
    const createObjectURL = vi.fn(() => 'blob:report');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        Object.defineProperty(node, 'click', { value: click });
        Object.defineProperty(node, 'remove', { value: remove });
      }
      return node;
    });

    downloadPiExcelImportReport({
      updatedCount: 2,
      unchangedCount: 1,
      unmatched: ['строка Excel 13'],
      emptyMatchKeyRows: [14],
    });

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0]![0] as Blob;
    expect(blob.type).toContain('text/plain');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');

    appendChild.mockRestore();
  });
});

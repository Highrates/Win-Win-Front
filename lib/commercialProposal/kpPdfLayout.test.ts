import { describe, expect, it } from 'vitest';
import {
  adaptiveImageRowHeight,
  chunkImagesIntoRows,
  estimateLineContentHeight,
  estimateLineTextBlockHeight,
  fitContain,
  formatKpDateTime,
  formatKpRub,
  imageCellWidth,
  kpPriceBlockHeight,
  layoutLogoBox,
  pageBreakIfNeeded,
  KP_PDF_CONTENT_W,
  KP_PDF_FOOTER_Y,
  KP_PDF_IMG_GAP,
  KP_PDF_IMG_INSET,
  KP_PDF_IMG_ROW_H_MAX,
  KP_PDF_IMG_ROW_H_MIN,
} from './kpPdfLayout';

describe('kpPdfLayout (pure)', () => {
  it('fitContain сохраняет отношение сторон и центрирует', () => {
    const fitted = fitContain(180, 110, 800, 600);
    expect(fitted.w / fitted.h).toBeCloseTo(800 / 600, 5);
    expect(fitted.w).toBeLessThanOrEqual(180);
    expect(fitted.h).toBeLessThanOrEqual(110);
    expect(fitted.x).toBeCloseTo((180 - fitted.w) / 2, 5);
    expect(fitted.y).toBeCloseTo((110 - fitted.h) / 2, 5);
  });

  it('fitContain при нулевом источнике отдаёт бокс', () => {
    expect(fitContain(100, 50, 0, 10)).toEqual({ w: 100, h: 50, x: 0, y: 0 });
  });

  it('pageBreakIfNeeded: не ломает страницу, если место есть', () => {
    expect(pageBreakIfNeeded(40, 20, KP_PDF_FOOTER_Y)).toEqual({ y: 40, newPage: false });
  });

  it('pageBreakIfNeeded: новая страница у футера', () => {
    const nearFooter = KP_PDF_FOOTER_Y - 5;
    expect(pageBreakIfNeeded(nearFooter, 20)).toEqual({ y: 16, newPage: true });
  });

  it('estimateLineTextBlockHeight учитывает price vs content', () => {
    const contentH = estimateLineContentHeight({ titleLines: 1, metaLineCount: 0, extrasLines: 0 });
    expect(estimateLineTextBlockHeight(contentH, kpPriceBlockHeight(false))).toBeGreaterThan(contentH);
    expect(kpPriceBlockHeight(true)).toBeGreaterThan(kpPriceBlockHeight(false));
  });

  it('formatKpRub / formatKpDateTime', () => {
    expect(formatKpRub(1500)).toMatch(/1.?500/);
    expect(formatKpDateTime(null)).toBe('—');
    expect(formatKpDateTime('not-a-date')).toBe('not-a-date');
  });

  it('imageCellWidth: 2 cols учитывает gap', () => {
    expect(imageCellWidth(2)).toBeCloseTo((KP_PDF_CONTENT_W - KP_PDF_IMG_GAP) / 2, 5);
    expect(imageCellWidth(1)).toBe(KP_PDF_CONTENT_W);
  });

  it('adaptiveImageRowHeight: portrait выше landscape, clamp max', () => {
    const cellW = imageCellWidth(2);
    const landscape = adaptiveImageRowHeight([{ w: 1600, h: 900 }], cellW);
    const portrait = adaptiveImageRowHeight([{ w: 900, h: 1600 }], cellW);
    expect(portrait).toBeGreaterThan(landscape);
    expect(portrait).toBeLessThanOrEqual(KP_PDF_IMG_ROW_H_MAX);
    expect(landscape).toBeGreaterThanOrEqual(KP_PDF_IMG_ROW_H_MIN);
    const wideOnly = adaptiveImageRowHeight([{ w: 4000, h: 100 }], cellW);
    expect(wideOnly).toBe(KP_PDF_IMG_ROW_H_MIN);
  });

  it('adaptiveImageRowHeight: inset входит в расчёт', () => {
    const cellW = 100;
    const h = adaptiveImageRowHeight([{ w: 100, h: 100 }], cellW, {
      inset: KP_PDF_IMG_INSET,
      minH: 1,
      maxH: 200,
    });
    // inner 98mm square + 2×inset → 100mm
    expect(h).toBe(100);
  });

  it('chunkImagesIntoRows: max rows × cols', () => {
    const imgs = [1, 2, 3, 4, 5, 6];
    expect(chunkImagesIntoRows(imgs, 2, 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(chunkImagesIntoRows([1], 2, 2)).toEqual([[1]]);
  });

  it('layoutLogoBox: natural aspect, не форсит 888×120', () => {
    const wide = layoutLogoBox(888, 120, 52, 18);
    expect(wide.w / wide.h).toBeCloseTo(888 / 120, 4);
    const square = layoutLogoBox(200, 200, 52, 18);
    expect(square.w).toBeCloseTo(square.h, 4);
    expect(square.w).toBeLessThanOrEqual(52);
    expect(square.h).toBeLessThanOrEqual(18);
  });
});

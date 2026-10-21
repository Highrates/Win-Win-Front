/** Геометрия и pure-helpers раскладки КП PDF (без jsPDF / сети). */

export const KP_PDF_INK = '#1D1C1B';
export const KP_PDF_GRAY = '#9D9D9D';
export const KP_PDF_SNOW = '#F6F6F6';
export const KP_PDF_RED = '#FF0000';
export const KP_PDF_WHITE = '#FFFFFF';

export const KP_PDF_MARGIN_X = 14;
export const KP_PDF_PAGE_W = 210;
export const KP_PDF_PAGE_H = 297;
export const KP_PDF_CONTENT_W = KP_PDF_PAGE_W - KP_PDF_MARGIN_X * 2;
export const KP_PDF_FOOTER_Y = KP_PDF_PAGE_H - 12;

/** Сетка фото позиции: 2 колонки, до 2 рядов (cap 4). */
export const KP_PDF_IMG_GAP = 4;
export const KP_PDF_IMG_COLS = 2;
export const KP_PDF_IMG_MAX_ROWS = 2;
export const KP_PDF_IMG_INSET = 1;
export const KP_PDF_IMG_ROW_H_MIN = 40;
export const KP_PDF_IMG_ROW_H_MAX = 88;

export const KP_PDF_LOGO_MAX_W = 52;
export const KP_PDF_LOGO_MAX_H = 18;

export const KP_PDF_TEXT_PAD_X = 4;
export const KP_PDF_TEXT_PAD_TOP = 5.5;
export const KP_PDF_TEXT_PAD_BOTTOM = 4;
export const KP_PDF_PRICE_COL_W = 42;

/** Вписать изображение в бокс без искажения (contain), по центру. */
export function fitContain(
  boxW: number,
  boxH: number,
  imgW: number,
  imgH: number,
): { w: number; h: number; x: number; y: number } {
  if (imgW <= 0 || imgH <= 0) return { w: boxW, h: boxH, x: 0, y: 0 };
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}

/**
 * Нужна ли новая страница: если `y + need` не помещается до футера.
 * Pure — вызывающий делает `doc.addPage()` при `newPage: true`.
 */
export function pageBreakIfNeeded(
  y: number,
  need: number,
  footerY = KP_PDF_FOOTER_Y,
  afterBreakY = 16,
): { y: number; newPage: boolean } {
  if (y + need <= footerY - 6) return { y, newPage: false };
  return { y: afterBreakY, newPage: true };
}

export function formatKpRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatKpDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Высота блока цены справа (мм). */
export function kpPriceBlockHeight(hasDiscount: boolean): number {
  return hasDiscount ? 18 : 12;
}

/** Оценка высоты текстовой колонки позиции (мм) до паддингов. */
export function estimateLineContentHeight(opts: {
  titleLines: number;
  metaLineCount: number;
  extrasLines: number;
}): number {
  const titleH = opts.titleLines * 4.6;
  const metaH = opts.metaLineCount * 3.8;
  const extrasH = opts.extrasLines * 3.4;
  return titleH + (metaH ? 2 + metaH : 0) + (extrasH ? 1.5 + extrasH : 0);
}

export function estimateLineTextBlockHeight(contentH: number, priceBlockH: number): number {
  return Math.max(priceBlockH, KP_PDF_TEXT_PAD_TOP + contentH + KP_PDF_TEXT_PAD_BOTTOM);
}

export type ImageAspect = { w: number; h: number };

export function imageCellWidth(
  cols: number,
  contentW = KP_PDF_CONTENT_W,
  gap = KP_PDF_IMG_GAP,
): number {
  const c = Math.max(1, cols);
  return (contentW - gap * (c - 1)) / c;
}

/**
 * Высота ряда под contain: от самого «высокого» aspect в ряду, clamp [min, max].
 * Один helper для 1 и N фото (единый inset).
 */
export function adaptiveImageRowHeight(
  aspects: ImageAspect[],
  cellW: number,
  opts?: { minH?: number; maxH?: number; inset?: number },
): number {
  const minH = opts?.minH ?? KP_PDF_IMG_ROW_H_MIN;
  const maxH = opts?.maxH ?? KP_PDF_IMG_ROW_H_MAX;
  const inset = opts?.inset ?? KP_PDF_IMG_INSET;
  const innerW = Math.max(1, cellW - inset * 2);
  let needed = minH;
  for (const a of aspects) {
    if (a.w <= 0 || a.h <= 0) continue;
    needed = Math.max(needed, (a.h / a.w) * innerW + inset * 2);
  }
  return Math.min(maxH, Math.max(minH, needed));
}

/** Нарезать изображения на ряды (cols × maxRows). */
export function chunkImagesIntoRows<T>(
  images: T[],
  cols = KP_PDF_IMG_COLS,
  maxRows = KP_PDF_IMG_MAX_ROWS,
): T[][] {
  const capped = images.slice(0, Math.max(0, cols) * Math.max(0, maxRows));
  const rows: T[][] = [];
  for (let i = 0; i < capped.length; i += cols) {
    rows.push(capped.slice(i, i + cols));
  }
  return rows;
}

/** Логотип в шапке: natural aspect, clamp в maxW×maxH. */
export function layoutLogoBox(
  naturalW: number,
  naturalH: number,
  maxW = KP_PDF_LOGO_MAX_W,
  maxH = KP_PDF_LOGO_MAX_H,
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) return { w: maxW, h: maxH * 0.55 };
  const fitted = fitContain(maxW, maxH, naturalW, naturalH);
  return { w: fitted.w, h: fitted.h };
}

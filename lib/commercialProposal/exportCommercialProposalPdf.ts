import { jsPDF } from 'jspdf';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { kpLineTotalRub, kpLineUnitAfterDiscount, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import type { CommercialProposalApi, CommercialProposalLineApi } from '@/lib/commercialProposal/types';

const INK = '#1D1C1B';
const GRAY = '#9D9D9D';
const SNOW = '#F6F6F6';
const RED = '#FF0000';
const WHITE = '#FFFFFF';

const MARGIN_X = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FOOTER_Y = PAGE_H - 12;
/** Две картинки в ряду под блоком позиции */
const IMG_GAP = 4;
const IMG_CELL_W = (CONTENT_W - IMG_GAP) / 2;
const IMG_CELL_H = 72;

export type ExportKpPdfInput = {
  orderId: string;
  proposal: CommercialProposalApi;
  /** Подпись сущности в шапке/футере PDF. По умолчанию — заказ. */
  entityKind?: 'order' | 'sourcing';
};

type RasterImage = {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
  /** Пиксельные размеры растра — для contain без растягивания */
  width: number;
  height: number;
};

let fontCache: { regular: string; medium: string } | null = null;
let logoCache: RasterImage | null = null;

async function loadFontsBase64(): Promise<{ regular: string; medium: string } | null> {
  if (fontCache) return fontCache;
  try {
    const [regularBuf, mediumBuf] = await Promise.all([
      fetch('/fonts/NotoSans-Regular.ttf').then((r) => {
        if (!r.ok) throw new Error('Не удалось загрузить шрифт');
        return r.arrayBuffer();
      }),
      fetch('/fonts/NotoSans-Medium.ttf').then((r) => {
        if (!r.ok) throw new Error('Не удалось загрузить шрифт');
        return r.arrayBuffer();
      }),
    ]);
    fontCache = { regular: arrayBufferToBase64(regularBuf), medium: arrayBufferToBase64(mediumBuf) };
    return fontCache;
  } catch {
    /** Soft fallback: PDF всё равно соберётся на Helvetica (кириллица может отобразиться некорректно). */
    return null;
  }
}

/** Абсолютные URL картинок — через same-origin proxy, чтобы canvas/jsPDF не ловили CORS. */
export function mediaUrlForPdf(url: string): string {
  if (!url) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (typeof window !== 'undefined' && url.startsWith(window.location.origin + '/')) {
    return url.slice(window.location.origin.length) || '/';
  }
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return btoa(binary);
}

async function loadLogo(): Promise<RasterImage | null> {
  if (logoCache) return logoCache;
  try {
    const res = await fetch('/email/wupapa-logo.png');
    if (!res.ok) throw new Error('logo fetch failed');
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    logoCache = { dataUrl, format: 'PNG', width: 888, height: 120 };
    return logoCache;
  } catch {
    try {
      const img = await loadImageElement('/images/wupapa-logo.svg');
      const canvas = document.createElement('canvas');
      canvas.width = 888;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      logoCache = { dataUrl: canvas.toDataURL('image/png'), format: 'PNG', width: 888, height: 120 };
      return logoCache;
    } catch {
      return null;
    }
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

async function loadProductImage(url: string | null): Promise<RasterImage | null> {
  if (!url) return null;
  try {
    const img = await loadImageElement(mediaUrlForPdf(url));
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const outW = Math.max(1, Math.round(img.naturalWidth * scale));
    const outH = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, outW, outH);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      format: 'JPEG',
      width: outW,
      height: outH,
    };
  } catch {
    return null;
  }
}

/** Вписать изображение в бокс без искажения (contain), по центру. */
function fitContain(
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

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function snapshotRecord(line: CommercialProposalLineApi): Record<string, unknown> | null {
  const s = line.snapshot;
  if (s && typeof s === 'object' && !Array.isArray(s)) return s as Record<string, unknown>;
  return null;
}

function lineTitle(line: CommercialProposalLineApi): string {
  const s = snapshotRecord(line);
  const n = s && typeof s.productName === 'string' ? s.productName.trim() : '';
  return n || 'Позиция';
}

function lineImageUrls(line: CommercialProposalLineApi): string[] {
  const s = snapshotRecord(line);
  const raw: string[] = [];
  if (s && typeof s.imageUrl === 'string' && s.imageUrl.trim()) {
    raw.push(s.imageUrl.trim());
  }
  if (s && Array.isArray(s.imageUrls)) {
    for (const u of s.imageUrls) {
      if (typeof u === 'string' && u.trim()) raw.push(u.trim());
    }
  }
  return Array.from(new Set(raw.map((u) => resolveMediaUrlForClient(u)).filter(Boolean)));
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/**
 * Фирменный PDF коммерческого предложения (программная вёрстка, не скриншот UI).
 */
export async function downloadCommercialProposalPdf(input: ExportKpPdfInput): Promise<void> {
  const { orderId, proposal, entityKind = 'order' } = input;
  const lines = proposal.lines ?? [];
  if (!lines.length) throw new Error('В коммерческом предложении нет позиций');

  const entityNoun = entityKind === 'sourcing' ? 'Заявка' : 'Заказ';
  const entityNounShort = entityKind === 'sourcing' ? 'заявка' : 'заказ';
  const filePrefix = entityKind === 'sourcing' ? 'WUPAPA-KP-SRC' : 'WUPAPA-KP';

  const [fonts, logo] = await Promise.all([loadFontsBase64(), loadLogo()]);
  const productImages = await Promise.all(
    lines.map(async (line) => {
      const urls = lineImageUrls(line);
      const loaded = await Promise.all(urls.map((u) => loadProductImage(u)));
      return loaded.filter((x): x is RasterImage => Boolean(x));
    }),
  );

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const fontFamily = fonts ? 'NotoSans' : 'helvetica';
  if (fonts) {
    doc.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
    doc.addFileToVFS('NotoSans-Medium.ttf', fonts.medium);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFont('NotoSans-Medium.ttf', 'NotoSans', 'medium');
  }

  const setFont = (weight: 'normal' | 'medium' = 'normal') => {
    if (fontFamily === 'NotoSans') {
      doc.setFont('NotoSans', weight === 'medium' ? 'medium' : 'normal');
    } else {
      doc.setFont('helvetica', weight === 'medium' ? 'bold' : 'normal');
    }
  };

  const shortNo = formatOrderDisplayId(orderId);
  const totals = kpOfferAggregates(lines);
  const hasDiscount = totals.oldTotalRub !== totals.newTotalRub || totals.avgDiscountPercent > 0;

  let y = 0;

  const ensureSpace = (need: number) => {
    if (y + need <= FOOTER_Y - 6) return;
    doc.addPage();
    y = 16;
  };

  // Header: logo + meta
  doc.setFillColor(WHITE);
  doc.rect(0, 0, PAGE_W, 36, 'F');
  if (logo) {
    const logoW = 52;
    const logoH = (120 / 888) * logoW;
    doc.addImage(logo.dataUrl, logo.format, MARGIN_X, 10, logoW, logoH);
  } else {
    doc.setTextColor(INK);
    setFont('medium');
    doc.setFontSize(16);
    doc.text('WUPAPA', MARGIN_X, 18);
  }
  setFont('normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text('Коммерческое предложение', PAGE_W - MARGIN_X, 14, { align: 'right' });
  doc.setTextColor(INK);
  setFont('medium');
  doc.setFontSize(9);
  doc.text(`${entityNoun} ${shortNo}`, PAGE_W - MARGIN_X, 20, { align: 'right' });
  if (proposal.versionNumber) {
    setFont('normal');
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text(`Версия ${proposal.versionNumber}`, PAGE_W - MARGIN_X, 25, { align: 'right' });
  }
  doc.setDrawColor(INK);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, 32, MARGIN_X + CONTENT_W, 32);

  y = 40;
  doc.setTextColor(INK);
  setFont('medium');
  doc.setFontSize(13);
  doc.text('Коммерческое предложение', MARGIN_X, y);
  y += 6;
  setFont('normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text(`Дата публикации: ${formatDateTime(proposal.publishedAt)}`, MARGIN_X, y);
  y += 8;

  const priceColW = 40;
  const mainTextW = CONTENT_W - priceColW - 4;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const title = lineTitle(line);
    const titleWrapped = wrapText(doc, title, mainTextW, 11);
    const metaRows = orderItemSnapshotMetaRows(line.snapshot);
    const unit = kpLineUnitAfterDiscount(line);
    const lineTotal = kpLineTotalRub(line);
    const disc =
      line.discountPercent != null && Number.isFinite(line.discountPercent) ? line.discountPercent : 0;
    const eta = line.deliveryEta?.trim();
    const note = line.lineNote?.trim();
    const images = productImages[index] ?? [];
    const gallery: Array<RasterImage | null> = images.length > 0 ? images : [null];

    const extras: string[] = [];
    if (eta) extras.push(`Срок доставки: ${eta}`);
    if (note) extras.push(note);
    const extrasWrapped = extras.flatMap((t) => wrapText(doc, t, mainTextW, 7.5));

    const titleH = titleWrapped.length * 4.6;
    const metaH = metaRows.reduce((acc, row) => {
      const labelWApprox = Math.min(40, row.label.length * 1.8);
      return acc + 3.8 * Math.max(1, wrapText(doc, row.value, mainTextW - labelWApprox, 8).length);
    }, 0);
    const extrasH = extrasWrapped.length * 3.4;
    const priceBlockH = disc > 0 ? 16 : 10;
    const textH = Math.max(priceBlockH, 6 + titleH + (metaH ? 2 + metaH : 0) + (extrasH ? 2 + extrasH : 0));

    ensureSpace(textH + 8);

    const textTop = y;
    doc.setFillColor(SNOW);
    doc.roundedRect(MARGIN_X, textTop, CONTENT_W, textH, 1.5, 1.5, 'F');

    let ty = textTop + 6;
    const textStartY = ty;
    doc.setTextColor(INK);
    setFont('medium');
    doc.setFontSize(11);
    for (const t of titleWrapped) {
      doc.text(t, MARGIN_X + 3, ty);
      ty += 4.6;
    }

    if (metaRows.length) {
      ty += 1.5;
      setFont('normal');
      doc.setFontSize(8);
      for (const row of metaRows) {
        doc.setTextColor(GRAY);
        const label = `${row.label}: `;
        const labelW = doc.getTextWidth(label);
        doc.text(label, MARGIN_X + 3, ty);
        doc.setTextColor(INK);
        const valueLines = wrapText(doc, row.value, mainTextW - labelW, 8);
        doc.text(valueLines[0] ?? '—', MARGIN_X + 3 + labelW, ty);
        ty += 3.8;
        for (let vi = 1; vi < valueLines.length; vi++) {
          doc.text(valueLines[vi]!, MARGIN_X + 3 + labelW, ty);
          ty += 3.8;
        }
      }
    }

    if (extrasWrapped.length) {
      ty += 1;
      setFont('normal');
      doc.setFontSize(7.5);
      doc.setTextColor(GRAY);
      for (const t of extrasWrapped) {
        doc.text(t, MARGIN_X + 3, ty);
        ty += 3.4;
      }
    }

    const priceX = MARGIN_X + CONTENT_W - 3;
    let py = textStartY;
    setFont('normal');
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text(`${line.quantity} ${line.unit || 'шт.'}`, priceX, py, { align: 'right' });
    py += 4.2;
    if (disc > 0) {
      doc.setTextColor(RED);
      doc.setFontSize(7.5);
      doc.text(`−${disc}%`, priceX, py, { align: 'right' });
      py += 3.4;
      doc.setTextColor(GRAY);
      doc.text(formatRub(line.offerUnitPrice), priceX, py, { align: 'right' });
      py += 3.4;
    }
    doc.setTextColor(INK);
    setFont('medium');
    doc.setFontSize(9);
    doc.text(formatRub(unit), priceX, py, { align: 'right' });
    py += 4.8;
    doc.setFontSize(11);
    doc.text(formatRub(lineTotal), priceX, py, { align: 'right' });

    y = textTop + textH + 3;

    const drawImageCell = (img: RasterImage | null, x: number, rowY: number, boxW: number, boxH: number) => {
      doc.setFillColor(SNOW);
      doc.roundedRect(x, rowY, boxW, boxH, 1.5, 1.5, 'F');
      if (!img) {
        doc.setDrawColor(GRAY);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, rowY, boxW, boxH, 1.5, 1.5, 'S');
        doc.setTextColor(GRAY);
        setFont('normal');
        doc.setFontSize(8);
        doc.text('Нет фото', x + boxW / 2, rowY + boxH / 2, { align: 'center' });
        return;
      }
      const fitted = fitContain(boxW, boxH, img.width, img.height);
      doc.addImage(img.dataUrl, img.format, x + fitted.x, rowY + fitted.y, fitted.w, fitted.h);
    };

    // Крупные фото под позицией: одно — по натуральному ratio; несколько — сетка 2 в ряд
    if (gallery.length === 1) {
      const only = gallery[0];
      if (only) {
        const fitted = fitContain(CONTENT_W, 110, only.width, only.height);
        ensureSpace(fitted.h + 2);
        const x = MARGIN_X + (CONTENT_W - fitted.w) / 2;
        doc.setFillColor(SNOW);
        doc.roundedRect(x, y, fitted.w, fitted.h, 1.5, 1.5, 'F');
        doc.addImage(only.dataUrl, only.format, x, y, fitted.w, fitted.h);
        y += fitted.h + IMG_GAP;
      } else {
        ensureSpace(IMG_CELL_H + 2);
        drawImageCell(null, MARGIN_X, y, CONTENT_W, IMG_CELL_H);
        y += IMG_CELL_H + IMG_GAP;
      }
    } else {
      for (let i = 0; i < gallery.length; i += 2) {
        ensureSpace(IMG_CELL_H + 2);
        const rowY = y;
        for (let col = 0; col < 2; col++) {
          const img = gallery[i + col];
          if (img === undefined) break;
          const imgX = MARGIN_X + col * (IMG_CELL_W + IMG_GAP);
          drawImageCell(img, imgX, rowY, IMG_CELL_W, IMG_CELL_H);
        }
        y += IMG_CELL_H + IMG_GAP;
      }
    }

    y += 5;
  }

  y += 2;
  ensureSpace(30);
  doc.setDrawColor(INK);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, y, MARGIN_X + CONTENT_W, y);
  y += 8;

  setFont('normal');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  if (hasDiscount) {
    doc.text('Сумма без скидки', MARGIN_X, y);
    doc.text(formatRub(totals.oldTotalRub), MARGIN_X + CONTENT_W, y, { align: 'right' });
    y += 5;
    doc.setTextColor(RED);
    doc.text(`Средняя скидка ${Math.round(totals.avgDiscountPercent * 10) / 10}%`, MARGIN_X, y);
    y += 6;
  }

  doc.setTextColor(INK);
  setFont('medium');
  doc.setFontSize(12);
  doc.text('Итого', MARGIN_X, y);
  doc.text(formatRub(totals.newTotalRub), MARGIN_X + CONTENT_W, y, { align: 'right' });
  y += 10;

  ensureSpace(16);
  setFont('normal');
  doc.setFontSize(7.5);
  doc.setTextColor(GRAY);
  const disclaimer = wrapText(
    doc,
    'Документ сформирован автоматически в личном кабинете WUPAPA. Не является счётом на оплату. Условия поставки и оплаты согласовываются отдельно.',
    CONTENT_W,
    7.5,
  );
  doc.text(disclaimer, MARGIN_X, y);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFont('normal');
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    doc.text('wupapa.ru', MARGIN_X, FOOTER_Y);
    doc.text(`КП · ${entityNounShort} ${shortNo}`, PAGE_W / 2, FOOTER_Y, { align: 'center' });
    doc.text(`${i} / ${pageCount}`, PAGE_W - MARGIN_X, FOOTER_Y, { align: 'right' });
  }

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`${filePrefix}-${shortNo}-v${proposal.versionNumber || 1}-${fileDate}.pdf`);
}

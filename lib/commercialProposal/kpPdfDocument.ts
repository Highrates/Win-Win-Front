import { jsPDF } from 'jspdf';
import { orderItemSnapshotMetaRows } from '@win-win/order-item-snapshot';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import {
  type KpPdfFontsBase64,
  type KpPdfRasterImage,
  lineTitle,
} from '@/lib/commercialProposal/kpPdfAssets';
import {
  KP_PDF_CONTENT_W,
  KP_PDF_FOOTER_Y,
  KP_PDF_GRAY,
  KP_PDF_IMG_COLS,
  KP_PDF_IMG_GAP,
  KP_PDF_IMG_INSET,
  KP_PDF_IMG_MAX_ROWS,
  KP_PDF_INK,
  KP_PDF_MARGIN_X,
  KP_PDF_PAGE_W,
  KP_PDF_PRICE_COL_W,
  KP_PDF_RED,
  KP_PDF_SNOW,
  KP_PDF_TEXT_PAD_BOTTOM,
  KP_PDF_TEXT_PAD_TOP,
  KP_PDF_TEXT_PAD_X,
  KP_PDF_WHITE,
  adaptiveImageRowHeight,
  chunkImagesIntoRows,
  fitContain,
  formatKpDateTime,
  formatKpRub,
  imageCellWidth,
  layoutLogoBox,
  pageBreakIfNeeded,
} from '@/lib/commercialProposal/kpPdfLayout';
import { kpLineTotalRub, kpLineUnitAfterDiscount, kpOfferAggregates } from '@/lib/commercialProposal/kpOfferTotals';
import type { CommercialProposalApi } from '@/lib/commercialProposal/types';

export type DrawKpPdfInput = {
  orderId: string;
  proposal: CommercialProposalApi;
  entityKind: 'order' | 'sourcing';
  fonts: KpPdfFontsBase64;
  logo: KpPdfRasterImage | null;
  productImages: KpPdfRasterImage[][];
};

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/** Рисует КП в уже созданный jsPDF (шрифты NotoSans обязательны). */
export function drawCommercialProposalPdf(input: DrawKpPdfInput): jsPDF {
  const { orderId, proposal, entityKind, fonts, logo, productImages } = input;
  const lines = proposal.lines ?? [];
  const entityNoun = entityKind === 'sourcing' ? 'Заявка' : 'Заказ';
  const entityNounShort = entityKind === 'sourcing' ? 'заявка' : 'заказ';

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
  doc.addFileToVFS('NotoSans-Medium.ttf', fonts.medium);
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  doc.addFont('NotoSans-Medium.ttf', 'NotoSans', 'medium');

  const setFont = (weight: 'normal' | 'medium' = 'normal') => {
    doc.setFont('NotoSans', weight === 'medium' ? 'medium' : 'normal');
  };

  const shortNo = formatOrderDisplayId(orderId);
  const totals = kpOfferAggregates(lines);
  const hasDiscount = totals.oldTotalRub !== totals.newTotalRub || totals.avgDiscountPercent > 0;

  let y = 0;
  const ensureSpace = (need: number) => {
    const next = pageBreakIfNeeded(y, need);
    if (next.newPage) doc.addPage();
    y = next.y;
  };

  doc.setFillColor(KP_PDF_WHITE);
  doc.rect(0, 0, KP_PDF_PAGE_W, 36, 'F');
  if (logo) {
    const box = layoutLogoBox(logo.width, logo.height);
    doc.addImage(logo.dataUrl, logo.format, KP_PDF_MARGIN_X, 10, box.w, box.h);
  } else {
    doc.setTextColor(KP_PDF_INK);
    setFont('medium');
    doc.setFontSize(16);
    doc.text('WUPAPA', KP_PDF_MARGIN_X, 18);
  }
  setFont('normal');
  doc.setFontSize(8);
  doc.setTextColor(KP_PDF_GRAY);
  doc.text('Коммерческое предложение', KP_PDF_PAGE_W - KP_PDF_MARGIN_X, 14, { align: 'right' });
  doc.setTextColor(KP_PDF_INK);
  setFont('medium');
  doc.setFontSize(9);
  doc.text(`${entityNoun} ${shortNo}`, KP_PDF_PAGE_W - KP_PDF_MARGIN_X, 20, { align: 'right' });
  {
    setFont('normal');
    doc.setFontSize(8);
    doc.setTextColor(KP_PDF_GRAY);
    const versionBit = proposal.versionNumber ? ` · v${proposal.versionNumber}` : '';
    doc.text(`${formatKpDateTime(proposal.publishedAt)}${versionBit}`, KP_PDF_PAGE_W - KP_PDF_MARGIN_X, 25, {
      align: 'right',
    });
  }
  doc.setDrawColor(KP_PDF_INK);
  doc.setLineWidth(0.4);
  doc.line(KP_PDF_MARGIN_X, 32, KP_PDF_MARGIN_X + KP_PDF_CONTENT_W, 32);

  y = 40;

  const mainTextW = KP_PDF_CONTENT_W - KP_PDF_PRICE_COL_W - 6;

  const rasterSize = (img: KpPdfRasterImage): { w: number; h: number } => {
    try {
      const props = doc.getImageProperties(img.dataUrl);
      if (props.width > 0 && props.height > 0) return { w: props.width, h: props.height };
    } catch {
      /* fall through */
    }
    return { w: img.width, h: img.height };
  };

  /** Единая ячейка для 1 и N: snow + contain с одинаковым inset. */
  const drawImageCell = (img: KpPdfRasterImage, x: number, rowY: number, boxW: number, boxH: number) => {
    const inset = KP_PDF_IMG_INSET;
    doc.setFillColor(KP_PDF_SNOW);
    doc.roundedRect(x, rowY, boxW, boxH, 1.5, 1.5, 'F');
    const size = rasterSize(img);
    const fitted = fitContain(boxW - inset * 2, boxH - inset * 2, size.w, size.h);
    doc.addImage(
      img.dataUrl,
      img.format,
      x + inset + fitted.x,
      rowY + inset + fitted.y,
      fitted.w,
      fitted.h,
    );
  };

  const drawImageRows = (images: KpPdfRasterImage[]) => {
    if (!images.length) return;
    const single = images.length === 1;
    const rows = single
      ? [images]
      : chunkImagesIntoRows(images, KP_PDF_IMG_COLS, KP_PDF_IMG_MAX_ROWS);
    for (const row of rows) {
      const cols = single ? 1 : KP_PDF_IMG_COLS;
      const cellW = single ? KP_PDF_CONTENT_W * 0.62 : imageCellWidth(cols);
      const aspects = row.map(rasterSize);
      const rowH = adaptiveImageRowHeight(aspects, cellW);
      ensureSpace(rowH + KP_PDF_IMG_GAP);
      const rowY = y;
      if (single) {
        const x = KP_PDF_MARGIN_X + (KP_PDF_CONTENT_W - cellW) / 2;
        drawImageCell(row[0]!, x, rowY, cellW, rowH);
      } else {
        for (let col = 0; col < row.length; col++) {
          const imgX = KP_PDF_MARGIN_X + col * (cellW + KP_PDF_IMG_GAP);
          drawImageCell(row[col]!, imgX, rowY, cellW, rowH);
        }
      }
      y += rowH + KP_PDF_IMG_GAP;
    }
  };

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

    const extras: string[] = [];
    if (eta) extras.push(`Срок доставки: ${eta}`);
    if (note) extras.push(note);
    const extrasWrapped = extras.flatMap((t) => wrapText(doc, t, mainTextW, 7.5));

    setFont('normal');
    doc.setFontSize(8);
    const metaH = metaRows.reduce((acc, row) => {
      const label = `${row.label}: `;
      const labelW = doc.getTextWidth(label);
      const valueLines = wrapText(doc, row.value, Math.max(24, mainTextW - labelW), 8);
      return acc + 3.8 * Math.max(1, valueLines.length);
    }, 0);

    const titleH = titleWrapped.length * 4.6;
    const extrasH = extrasWrapped.length * 3.4;
    const priceBlockH = disc > 0 ? 18 : 12;
    const contentH = titleH + (metaH ? 2 + metaH : 0) + (extrasH ? 1.5 + extrasH : 0);
    const textH = Math.max(priceBlockH, KP_PDF_TEXT_PAD_TOP + contentH + KP_PDF_TEXT_PAD_BOTTOM);

    ensureSpace(textH + 10);

    const textTop = y;
    doc.setFillColor(KP_PDF_SNOW);
    doc.roundedRect(KP_PDF_MARGIN_X, textTop, KP_PDF_CONTENT_W, textH, 1.5, 1.5, 'F');

    let ty = textTop + KP_PDF_TEXT_PAD_TOP;
    const textStartY = ty;
    doc.setTextColor(KP_PDF_INK);
    setFont('medium');
    doc.setFontSize(11);
    for (const t of titleWrapped) {
      doc.text(t, KP_PDF_MARGIN_X + KP_PDF_TEXT_PAD_X, ty);
      ty += 4.6;
    }

    if (metaRows.length) {
      ty += 1.5;
      setFont('normal');
      doc.setFontSize(8);
      for (const row of metaRows) {
        doc.setTextColor(KP_PDF_GRAY);
        const label = `${row.label}: `;
        const labelW = doc.getTextWidth(label);
        doc.text(label, KP_PDF_MARGIN_X + KP_PDF_TEXT_PAD_X, ty);
        doc.setTextColor(KP_PDF_INK);
        const valueLines = wrapText(doc, row.value, Math.max(24, mainTextW - labelW), 8);
        doc.text(valueLines[0] ?? '—', KP_PDF_MARGIN_X + KP_PDF_TEXT_PAD_X + labelW, ty);
        ty += 3.8;
        for (let vi = 1; vi < valueLines.length; vi++) {
          doc.text(valueLines[vi]!, KP_PDF_MARGIN_X + KP_PDF_TEXT_PAD_X + labelW, ty);
          ty += 3.8;
        }
      }
    }

    if (extrasWrapped.length) {
      ty += 1;
      setFont('normal');
      doc.setFontSize(7.5);
      doc.setTextColor(KP_PDF_GRAY);
      for (const t of extrasWrapped) {
        doc.text(t, KP_PDF_MARGIN_X + KP_PDF_TEXT_PAD_X, ty);
        ty += 3.4;
      }
    }

    const priceX = KP_PDF_MARGIN_X + KP_PDF_CONTENT_W - KP_PDF_TEXT_PAD_X;
    let py = textStartY;
    setFont('normal');
    doc.setFontSize(8);
    doc.setTextColor(KP_PDF_GRAY);
    doc.text(`${line.quantity} ${line.unit || 'шт.'}`, priceX, py, { align: 'right' });
    py += 4.2;
    if (disc > 0) {
      doc.setTextColor(KP_PDF_RED);
      doc.setFontSize(7.5);
      doc.text(`−${disc}%`, priceX, py, { align: 'right' });
      py += 3.4;
      doc.setTextColor(KP_PDF_GRAY);
      doc.text(formatKpRub(line.offerUnitPrice), priceX, py, { align: 'right' });
      py += 3.4;
    }
    doc.setTextColor(KP_PDF_INK);
    setFont('medium');
    doc.setFontSize(9);
    doc.text(formatKpRub(unit), priceX, py, { align: 'right' });
    py += 4.8;
    doc.setFontSize(11);
    doc.text(formatKpRub(lineTotal), priceX, py, { align: 'right' });

    y = textTop + textH + 3;
    drawImageRows(images);
    y += 6;
  }

  y += 2;
  ensureSpace(34);
  doc.setDrawColor(KP_PDF_INK);
  doc.setLineWidth(0.35);
  doc.line(KP_PDF_MARGIN_X, y, KP_PDF_MARGIN_X + KP_PDF_CONTENT_W, y);
  y += 8;

  setFont('normal');
  doc.setFontSize(9);
  doc.setTextColor(KP_PDF_GRAY);
  if (hasDiscount) {
    doc.text('Сумма без скидки', KP_PDF_MARGIN_X, y);
    doc.text(formatKpRub(totals.oldTotalRub), KP_PDF_MARGIN_X + KP_PDF_CONTENT_W, y, { align: 'right' });
    y += 5;
    doc.setTextColor(KP_PDF_RED);
    doc.text(`Средняя скидка ${Math.round(totals.avgDiscountPercent * 10) / 10}%`, KP_PDF_MARGIN_X, y);
    y += 6;
  }

  doc.setTextColor(KP_PDF_INK);
  setFont('medium');
  doc.setFontSize(12);
  doc.text('Итого', KP_PDF_MARGIN_X, y);
  doc.text(formatKpRub(totals.newTotalRub), KP_PDF_MARGIN_X + KP_PDF_CONTENT_W, y, { align: 'right' });
  y += 10;

  ensureSpace(18);
  setFont('normal');
  doc.setFontSize(7.5);
  doc.setTextColor(KP_PDF_GRAY);
  const disclaimer = wrapText(
    doc,
    'Документ сформирован автоматически в личном кабинете WUPAPA. Не является счётом на оплату. Условия поставки и оплаты согласовываются отдельно.',
    KP_PDF_CONTENT_W,
    7.5,
  );
  doc.text(disclaimer, KP_PDF_MARGIN_X, y);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFont('normal');
    doc.setFontSize(7);
    doc.setTextColor(KP_PDF_GRAY);
    doc.text('wupapa.ru', KP_PDF_MARGIN_X, KP_PDF_FOOTER_Y);
    doc.text(`КП · ${entityNounShort} ${shortNo}`, KP_PDF_PAGE_W / 2, KP_PDF_FOOTER_Y, { align: 'center' });
    doc.text(`${i} / ${pageCount}`, KP_PDF_PAGE_W - KP_PDF_MARGIN_X, KP_PDF_FOOTER_Y, { align: 'right' });
  }

  return doc;
}

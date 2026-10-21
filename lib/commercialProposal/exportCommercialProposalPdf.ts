import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import {
  KP_PDF_IMAGE_LOAD_CONCURRENCY,
  KP_PDF_MAX_IMAGES_PER_LINE,
  type KpPdfRasterImage,
  lineImageUrls,
  loadFontsBase64,
  loadLogo,
  loadProductImage,
  mapPool,
  throwIfAborted,
} from '@/lib/commercialProposal/kpPdfAssets';
import { drawCommercialProposalPdf } from '@/lib/commercialProposal/kpPdfDocument';
import type { CommercialProposalApi } from '@/lib/commercialProposal/types';

export {
  KP_PDF_FONT_ERROR_MESSAGE,
  KP_PDF_MAX_IMAGES_PER_LINE,
  KpPdfFontError,
  fetchImageBlob,
  imageFetchCandidates,
  isPlaceholderMediaUrl,
  lineImageUrls,
  loadProductImage,
  mediaUrlForPdf,
  preferPngRaster,
  __resetKpPdfAssetCachesForTests,
} from '@/lib/commercialProposal/kpPdfAssets';
export {
  adaptiveImageRowHeight,
  chunkImagesIntoRows,
  fitContain,
  imageCellWidth,
  layoutLogoBox,
} from '@/lib/commercialProposal/kpPdfLayout';

export type ExportKpPdfProgress = {
  /** fonts → images → save (build = сборка doc; done после save). */
  phase: 'fonts' | 'images' | 'build' | 'save' | 'done';
  /** 0–100 */
  percent: number;
  label: string;
  failedImageCount?: number;
};

export type ExportKpPdfInput = {
  orderId: string;
  proposal: CommercialProposalApi;
  /** Подпись сущности в шапке/футере PDF. По умолчанию — заказ. */
  entityKind?: 'order' | 'sourcing';
  onProgress?: (p: ExportKpPdfProgress) => void;
  signal?: AbortSignal;
};

export type ExportKpPdfResult = {
  failedImageCount: number;
  /** Сколько URL пытались загрузить (после placeholder skip / cap). */
  imageAttemptCount: number;
};

/** Текст для UI: «N фото не загрузились». */
export function kpPdfFailedImagesMessage(failedImageCount: number): string {
  const n = Math.max(0, Math.floor(failedImageCount));
  if (n <= 0) return '';
  if (n === 1) return '1 фото не загрузилось';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${n} фото не загрузились`;
  }
  return `${n} фото не загрузились`;
}

/**
 * Фирменный PDF коммерческого предложения (программная вёрстка, не скриншот UI).
 * Без Noto Sans сохранение блокируется — Helvetica ломает кириллицу.
 * Если все запрошенные фото упали — save не вызывается.
 */
export async function downloadCommercialProposalPdf(
  input: ExportKpPdfInput,
): Promise<ExportKpPdfResult> {
  const { orderId, proposal, entityKind = 'order', onProgress, signal } = input;
  const lines = proposal.lines ?? [];
  if (!lines.length) throw new Error('В коммерческом предложении нет позиций');

  const report = (p: ExportKpPdfProgress) => {
    try {
      onProgress?.(p);
    } catch {
      /* ignore UI errors */
    }
  };

  const filePrefix = entityKind === 'sourcing' ? 'WUPAPA-KP-SRC' : 'WUPAPA-KP';

  throwIfAborted(signal);
  report({ phase: 'fonts', percent: 2, label: 'Шрифты…' });
  const [fonts, logo] = await Promise.all([loadFontsBase64(), loadLogo()]);
  throwIfAborted(signal);

  type ImgJob = { lineIdx: number; url: string; slot: number };
  const jobs: ImgJob[] = [];
  const urlsPerLine = lines.map((line) => lineImageUrls(line, KP_PDF_MAX_IMAGES_PER_LINE));
  urlsPerLine.forEach((urls, lineIdx) => {
    urls.forEach((url, slot) => jobs.push({ lineIdx, url, slot }));
  });

  const productImages: KpPdfRasterImage[][] = lines.map(() => []);
  let failedImageCount = 0;
  let doneJobs = 0;
  const imageAttemptCount = jobs.length;

  if (jobs.length === 0) {
    report({ phase: 'images', percent: 55, label: 'Фото…', failedImageCount: 0 });
  } else {
    report({
      phase: 'images',
      percent: 8,
      label: `Фото… 0/${jobs.length}`,
      failedImageCount: 0,
    });
    const loaded = await mapPool(
      jobs,
      KP_PDF_IMAGE_LOAD_CONCURRENCY,
      async (job) => {
        const img = await loadProductImage(job.url, signal);
        doneJobs += 1;
        if (!img) failedImageCount += 1;
        const percent = Math.min(54, Math.round(8 + (doneJobs / jobs.length) * 46));
        report({
          phase: 'images',
          percent,
          label: `Фото… ${doneJobs}/${jobs.length}`,
          failedImageCount,
        });
        return { job, img };
      },
      signal,
    );
    for (const { job, img } of loaded) {
      if (img) productImages[job.lineIdx]![job.slot] = img;
    }
    for (let i = 0; i < productImages.length; i++) {
      productImages[i] = (productImages[i] ?? []).filter(Boolean);
    }
    if (failedImageCount > 0) {
      console.warn(`[kp-pdf] ${failedImageCount} image(s) failed to load`);
    }
    report({
      phase: 'images',
      percent: 55,
      label: `Фото… ${jobs.length}/${jobs.length}`,
      failedImageCount,
    });
  }

  if (imageAttemptCount > 0 && failedImageCount === imageAttemptCount) {
    throw new Error('Не удалось загрузить фото для PDF');
  }

  throwIfAborted(signal);
  report({ phase: 'build', percent: 60, label: 'Сборка…', failedImageCount });

  const doc = drawCommercialProposalPdf({
    orderId,
    proposal,
    entityKind,
    fonts,
    logo,
    productImages,
  });

  throwIfAborted(signal);
  report({ phase: 'save', percent: 92, label: 'Сохранение…', failedImageCount });
  const shortNo = formatOrderDisplayId(orderId);
  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`${filePrefix}-${shortNo}-v${proposal.versionNumber || 1}-${fileDate}.pdf`);
  report({ phase: 'done', percent: 100, label: 'Готово', failedImageCount });
  return { failedImageCount, imageAttemptCount };
}

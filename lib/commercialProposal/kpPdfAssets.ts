import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { KP_PDF_WHITE } from '@/lib/commercialProposal/kpPdfLayout';
import type { CommercialProposalLineApi } from '@/lib/commercialProposal/types';

/** Max фото на позицию — 2×2 как UI-сетка; без cap пик RAM на большом КП. */
export const KP_PDF_MAX_IMAGES_PER_LINE = 4;
export const KP_PDF_IMAGE_LOAD_CONCURRENCY = 3;
const PDF_IMAGE_MAX_SIDE = 1200;

export const KP_PDF_FONT_ERROR_MESSAGE =
  'Не удалось загрузить шрифт — PDF без кириллицы. Обновите страницу и попробуйте снова.';

export class KpPdfFontError extends Error {
  constructor(message = KP_PDF_FONT_ERROR_MESSAGE) {
    super(message);
    this.name = 'KpPdfFontError';
  }
}

export type KpPdfRasterImage = {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
  width: number;
  height: number;
};

export type KpPdfFontsBase64 = { regular: string; medium: string };

let fontCache: KpPdfFontsBase64 | null = null;
let logoCache: KpPdfRasterImage | null = null;

const PLACEHOLDER_HINTS = ['placeholder.svg', '/images/placeholder'];

export function isPlaceholderMediaUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  return PLACEHOLDER_HINTS.some((h) => u.includes(h));
}

/**
 * URL для загрузки в PDF:
 * - same-origin `/uploads|/images|/api/...` — как есть (через rewrite Next);
 * - абсолютные — через `/api/media-proxy` (без CORS/tainted canvas).
 */
export function mediaUrlForPdf(url: string): string {
  if (!url) return url;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (typeof window !== 'undefined' && url.startsWith(`${window.location.origin}/`)) {
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

async function fetchFontArrayBuffer(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path, { cache: 'force-cache', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`font fetch ${path}: ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Noto Sans обязателен для кириллицы. Soft Helvetica fallback запрещён —
 * иначе PDF сохранится с кракозябрами без явной ошибки.
 */
export async function loadFontsBase64(): Promise<KpPdfFontsBase64> {
  if (fontCache) return fontCache;
  try {
    const [regularBuf, mediumBuf] = await Promise.all([
      fetchFontArrayBuffer('/fonts/NotoSans-Regular.ttf'),
      fetchFontArrayBuffer('/fonts/NotoSans-Medium.ttf'),
    ]);
    fontCache = {
      regular: arrayBufferToBase64(regularBuf),
      medium: arrayBufferToBase64(mediumBuf),
    };
    return fontCache;
  } catch (e) {
    console.warn('[kp-pdf] font load failed', e);
    throw new KpPdfFontError();
  }
}

/** @internal tests */
export function __resetKpPdfAssetCachesForTests(): void {
  fontCache = null;
  logoCache = null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(
  src: string,
  opts?: { crossOrigin?: boolean; timeoutMs?: number },
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (opts?.crossOrigin) img.crossOrigin = 'anonymous';
    const timeoutMs = opts?.timeoutMs ?? 4000;
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error(`image load timeout: ${src}`));
    }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`image load failed: ${src}`));
    };
    img.src = src;
  });
}

async function rasterLogoFromDrawable(
  source: CanvasImageSource,
  natW: number,
  natH: number,
): Promise<KpPdfRasterImage | null> {
  if (natW < 1 || natH < 1) return null;
  const maxPx = 1200;
  const scale = Math.min(1, maxPx / Math.max(natW, natH));
  const outW = Math.max(1, Math.round(natW * scale));
  const outH = Math.max(1, Math.round(natH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Белый фон только для SVG→PNG в шапке (лого на прозрачном).
  ctx.fillStyle = KP_PDF_WHITE;
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(source, 0, 0, outW, outH);
  return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG', width: outW, height: outH };
}

/** Логотип с natural aspect (SVG не форсим в canvas 888×120). */
export async function loadLogo(): Promise<KpPdfRasterImage | null> {
  if (logoCache) return logoCache;
  try {
    const res = await fetch('/email/wupapa-logo.png', { cache: 'force-cache' });
    if (!res.ok) throw new Error('logo fetch failed');
    const blob = await res.blob();
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(blob);
        try {
          const raster = await rasterLogoFromDrawable(bitmap, bitmap.width, bitmap.height);
          if (raster) {
            logoCache = raster;
            return logoCache;
          }
        } finally {
          bitmap.close();
        }
      } catch {
        /* fall through */
      }
    }
    // Пиксели без ресайза; метаданные 888×120 — фактический asset, не canvas-force.
    const dataUrl = await blobToDataUrl(blob);
    logoCache = { dataUrl, format: 'PNG', width: 888, height: 120 };
    return logoCache;
  } catch {
    /* SVG fallback */
  }
  try {
    const img = await loadImageElement('/images/wupapa-logo.svg', { timeoutMs: 1500 });
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    if (natW > 0 && natH > 0) {
      const raster = await rasterLogoFromDrawable(img, natW, natH);
      if (raster) {
        logoCache = raster;
        return logoCache;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Кандидаты fetch для PDF-картинки (/uploads → + media-proxy). */
export function imageFetchCandidates(src: string): string[] {
  const candidates = [src];
  if (src.startsWith('/uploads/')) {
    candidates.push(`/api/media-proxy?url=${encodeURIComponent(src)}`);
  }
  return candidates;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('PDF export aborted');
    err.name = 'AbortError';
    throw err;
  }
}

function isGifMagic(magic?: Uint8Array | null): boolean {
  if (!magic || magic.length < 6) return false;
  // GIF87a / GIF89a
  return (
    magic[0] === 0x47 &&
    magic[1] === 0x49 &&
    magic[2] === 0x46 &&
    magic[3] === 0x38 &&
    (magic[4] === 0x37 || magic[4] === 0x39) &&
    magic[5] === 0x61
  );
}

/** PNG/WebP/SVG → PNG (альфа); GIF/JPEG и прочие → JPEG (GIF без анимации, белый фон). */
export function preferPngRaster(mimeType: string, magic?: Uint8Array | null): boolean {
  const t = (mimeType || '').toLowerCase();
  if (t.includes('gif') || isGifMagic(magic)) return false;
  if (t.includes('png') || t.includes('webp') || t.includes('svg')) return true;
  if (magic && magic.length >= 4) {
    if (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47) return true;
  }
  return false;
}

function rasterFromDrawable(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  format: 'PNG' | 'JPEG',
): KpPdfRasterImage | null {
  if (srcW < 1 || srcH < 1) return null;
  const scale = Math.min(1, PDF_IMAGE_MAX_SIDE / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (format === 'JPEG') {
    // GIF/прозрачность → белый, иначе JPEG даёт чёрный фон.
    ctx.fillStyle = KP_PDF_WHITE;
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(source, 0, 0, outW, outH);
  if (format === 'PNG') {
    return { dataUrl: canvas.toDataURL('image/png'), format: 'PNG', width: outW, height: outH };
  }
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), format: 'JPEG', width: outW, height: outH };
}

async function rasterFromBlob(blob: Blob): Promise<KpPdfRasterImage | null> {
  const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const format: 'PNG' | 'JPEG' = preferPngRaster(blob.type, head) ? 'PNG' : 'JPEG';
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      try {
        return rasterFromDrawable(bitmap, bitmap.width, bitmap.height, format);
      } finally {
        bitmap.close();
      }
    } catch {
      /* fall through */
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(objectUrl);
    return rasterFromDrawable(img, img.naturalWidth || img.width, img.naturalHeight || img.height, format);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function fetchImageBlob(src: string, signal?: AbortSignal): Promise<Blob | null> {
  const candidates = imageFetchCandidates(src);
  for (const candidate of candidates) {
    throwIfAborted(signal);
    try {
      const res = await fetch(candidate, {
        credentials: 'same-origin',
        cache: 'force-cache',
        signal,
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.warn('[kp-pdf] media-proxy denied or forbidden', candidate);
        }
        continue;
      }
      const blob = await res.blob();
      if (blob.size > 0) return blob;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
    }
  }
  return null;
}

export async function loadProductImage(
  url: string | null,
  signal?: AbortSignal,
): Promise<KpPdfRasterImage | null> {
  if (!url || isPlaceholderMediaUrl(url)) return null;
  const src = mediaUrlForPdf(url);
  try {
    const blob = await fetchImageBlob(src, signal);
    if (blob) return rasterFromBlob(blob);
    console.warn('[kp-pdf] image load failed', url);
    return null;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw e;
    console.warn('[kp-pdf] image load failed', url, e);
    return null;
  }
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, async () => {
    while (true) {
      throwIfAborted(signal);
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

function snapshotRecord(line: CommercialProposalLineApi): Record<string, unknown> | null {
  const s = line.snapshot;
  if (s && typeof s === 'object' && !Array.isArray(s)) return s as Record<string, unknown>;
  return null;
}

export function lineTitle(line: CommercialProposalLineApi): string {
  const s = snapshotRecord(line);
  const n = s && typeof s.productName === 'string' ? s.productName.trim() : '';
  return n || 'Позиция';
}

/** URL фото позиции для PDF; dedupe + cap (как UI-сетка). */
export function lineImageUrls(
  line: CommercialProposalLineApi,
  max = KP_PDF_MAX_IMAGES_PER_LINE,
): string[] {
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
  const unique = Array.from(
    new Set(
      raw
        .map((u) => resolveMediaUrlForClient(u))
        .filter((u): u is string => Boolean(u) && !isPlaceholderMediaUrl(u)),
    ),
  );
  return unique.slice(0, Math.max(0, max));
}

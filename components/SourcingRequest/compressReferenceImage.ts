import {
  isHeicLike,
  isSourcingReferenceImageMime,
  SOURCING_REFERENCE_FORMATS_LABEL,
  SOURCING_REFERENCE_JPEG_QUALITY,
  SOURCING_REFERENCE_MAX_EDGE_PX,
} from '@win-win/sourcing-request';

export type PreparedReferenceImage = { ok: true; file: File } | { ok: false; error: string };

type DecodedImage = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decodeImage(file: Blob): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      /* пробуем через <img> */
    }
  }
  if (typeof Image === 'undefined' || typeof URL === 'undefined') return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function jpegName(name: string): string {
  const base = name.replace(/\.[a-z0-9]{1,8}$/i, '') || 'photo';
  return `${base}.jpg`;
}

/**
 * Перекодирует фото в JPEG ≤ 2560 px: меньше вес, без EXIF/GPS, HEIC → JPEG там, где браузер его читает.
 * GIF не трогаем (анимация). Если браузер не умеет canvas — отдаём исходник поддерживаемого формата.
 */
export async function prepareSourcingReferenceImage(file: File): Promise<PreparedReferenceImage> {
  const heic = isHeicLike(file.type, file.name);
  if (!heic && !isSourcingReferenceImageMime(file.type)) {
    return { ok: false, error: `«${file.name}» не подходит: нужны ${SOURCING_REFERENCE_FORMATS_LABEL}` };
  }
  if (file.type === 'image/gif') return { ok: true, file };

  const decoded = await decodeImage(file);
  if (!decoded) {
    return heic
      ? {
          ok: false,
          error: `«${file.name}»: этот браузер не открывает HEIC. Сохраните фото как JPEG или отправьте с iPhone через Safari.`,
        }
      : { ok: false, error: `«${file.name}» не удалось прочитать как изображение` };
  }

  try {
    const scale = Math.min(1, SOURCING_REFERENCE_MAX_EDGE_PX / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return heic ? { ok: false, error: `«${file.name}» не удалось конвертировать` } : { ok: true, file };
    /** Прозрачность PNG-скриншотов → белый фон, а не чёрный в JPEG. */
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', SOURCING_REFERENCE_JPEG_QUALITY),
    );
    if (!blob) return heic ? { ok: false, error: `«${file.name}» не удалось конвертировать` } : { ok: true, file };
    return {
      ok: true,
      file: new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: file.lastModified }),
    };
  } finally {
    decoded.close();
  }
}

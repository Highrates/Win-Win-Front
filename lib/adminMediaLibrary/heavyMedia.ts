import type { MediaObjectRow } from '@/lib/adminMediaLibraryTypes';

const KB = 1024;
const MB = 1024 * KB;

/** Пороги «тяжёлого» файла по category из бэкенда (byteSize строго больше). */
export const HEAVY_MEDIA_BYTE_THRESHOLDS = {
  IMAGE: 500 * KB,
  VIDEO: 15 * MB,
  DOCUMENT: 2 * MB,
  MODEL: 8 * MB,
  OTHER: 1 * MB,
} as const;

export function isHeavyMediaObject(
  row: Pick<MediaObjectRow, 'category' | 'byteSize'>
): boolean {
  const threshold =
    HEAVY_MEDIA_BYTE_THRESHOLDS[
      row.category as keyof typeof HEAVY_MEDIA_BYTE_THRESHOLDS
    ] ?? HEAVY_MEDIA_BYTE_THRESHOLDS.OTHER;
  return row.byteSize > threshold;
}

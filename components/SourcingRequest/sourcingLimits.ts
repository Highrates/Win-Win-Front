import type { SourcingFormAttachment, SourcingProductItem } from './types';
import {
  SOURCING_FILE_MAX_BYTES,
  SOURCING_MAX_FILES,
  SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT,
  SOURCING_UPLOAD_TOTAL_MAX_BYTES,
} from '@win-win/sourcing-request';

export {
  SOURCING_CITY_MAX,
  SOURCING_FILE_MAX_BYTES,
  SOURCING_MAX_FILES,
  SOURCING_MAX_PRODUCTS,
  SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT,
  SOURCING_PRODUCT_DESCRIPTION_MAX,
  SOURCING_PRODUCT_FIELD_MAX,
  SOURCING_PRODUCT_NAME_MAX,
  SOURCING_TITLE_MAX,
  SOURCING_UPLOAD_TOTAL_MAX_BYTES,
} from '@win-win/sourcing-request';

/** Алиас фронтового имени — то же значение, что `SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT`. */
export { SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT as SOURCING_MAX_REFERENCE_IMAGES_PER_PRODUCT } from '@win-win/sourcing-request';

export function sourcingFileMaxMb(): number {
  return Math.floor(SOURCING_FILE_MAX_BYTES / (1024 * 1024));
}

export function sourcingUploadTotalMaxMb(): number {
  return Math.floor(SOURCING_UPLOAD_TOTAL_MAX_BYTES / (1024 * 1024));
}

export const SOURCING_FILES_HINT = `До ${SOURCING_MAX_FILES} файлов: каждый до ${sourcingFileMaxMb()} МБ, суммарно до ${sourcingUploadTotalMaxMb()} МБ`;

export function countSourcingUploadFiles(
  products: SourcingProductItem[],
  formAttachments: SourcingFormAttachment[],
): number {
  return (
    formAttachments.length + products.reduce((n, product) => n + product.referenceImages.length, 0)
  );
}

export function totalSourcingUploadBytes(
  products: SourcingProductItem[],
  formAttachments: SourcingFormAttachment[],
): number {
  let total = 0;
  for (const attachment of formAttachments) total += attachment.file.size;
  for (const product of products) {
    for (const image of product.referenceImages) total += image.file.size;
  }
  return total;
}

export function validateSourcingIncomingFiles(
  files: File[],
  products: SourcingProductItem[],
  formAttachments: SourcingFormAttachment[],
  opts?: { productId?: string },
): string | null {
  if (!files.length) return null;

  const existingCount = countSourcingUploadFiles(products, formAttachments);
  if (existingCount + files.length > SOURCING_MAX_FILES) {
    return `Не больше ${SOURCING_MAX_FILES} файлов на заявку`;
  }

  if (opts?.productId) {
    const product = products.find((p) => p.id === opts.productId);
    const refs = product?.referenceImages.length ?? 0;
    if (refs + files.length > SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT) {
      return `Не больше ${SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT} изображений на товар`;
    }
  }

  let incomingBytes = 0;
  for (const file of files) {
    if (file.size > SOURCING_FILE_MAX_BYTES) {
      return `Файл «${file.name}» больше ${sourcingFileMaxMb()} МБ`;
    }
    incomingBytes += file.size;
  }

  const total = totalSourcingUploadBytes(products, formAttachments) + incomingBytes;
  if (total > SOURCING_UPLOAD_TOTAL_MAX_BYTES) {
    return `Суммарный размер файлов не больше ${sourcingUploadTotalMaxMb()} МБ`;
  }

  return null;
}

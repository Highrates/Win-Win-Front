import type { SourcingFormAttachment, SourcingProductItem } from './types';
import { isSourcingUnit } from './types';
import {
  isProductMinimallyFilled as isProductMinimallyFilledShared,
  isSoftValidProductLink,
} from '@win-win/sourcing-request';
import {
  SOURCING_MAX_PRODUCTS,
  SOURCING_PRODUCT_DESCRIPTION_MAX,
  SOURCING_PRODUCT_NAME_MAX,
  SOURCING_TITLE_MAX,
  countSourcingUploadFiles,
  validateSourcingIncomingFiles,
} from './sourcingLimits';

export type SourcingProductFieldErrors = {
  productLink?: string;
  unit?: string;
};

export type SourcingFormErrors = {
  requestTitle?: string;
  productsGeneral?: string;
  filesGeneral?: string;
  productErrors?: Record<string, SourcingProductFieldErrors>;
};

export function isProductMinimallyFilled(product: SourcingProductItem): boolean {
  return isProductMinimallyFilledShared({
    name: product.name,
    description: product.description,
    productLink: product.productLink,
    referenceCount: product.referenceImages.length,
  });
}

export { isSoftValidProductLink };

export function validateSourcingForm(
  requestTitle: string,
  products: SourcingProductItem[],
  formAttachments: SourcingFormAttachment[] = [],
): SourcingFormErrors {
  const errors: SourcingFormErrors = {};

  if (!requestTitle.trim()) {
    errors.requestTitle = 'Укажите название заявки';
  } else if (requestTitle.trim().length > SOURCING_TITLE_MAX) {
    errors.requestTitle = `Название не длиннее ${SOURCING_TITLE_MAX} символов`;
  }

  if (products.length > SOURCING_MAX_PRODUCTS) {
    errors.productsGeneral = `Не больше ${SOURCING_MAX_PRODUCTS} товаров в заявке`;
  } else if (!products.some(isProductMinimallyFilled)) {
    errors.productsGeneral =
      'Укажите хотя бы у одного товара наименование, описание, референс или ссылку';
  }

  const productErrors: Record<string, SourcingProductFieldErrors> = {};
  for (const product of products) {
    const fieldErrors: SourcingProductFieldErrors = {};
    if (product.name.trim().length > SOURCING_PRODUCT_NAME_MAX) {
      errors.productsGeneral =
        errors.productsGeneral ??
        `Наименование товара не длиннее ${SOURCING_PRODUCT_NAME_MAX} символов`;
    }
    if (product.description.trim().length > SOURCING_PRODUCT_DESCRIPTION_MAX) {
      errors.productsGeneral =
        errors.productsGeneral ??
        `Описание товара не длиннее ${SOURCING_PRODUCT_DESCRIPTION_MAX} символов`;
    }
    if (product.productLink.trim() && !isSoftValidProductLink(product.productLink)) {
      fieldErrors.productLink = 'Проверьте адрес ссылки';
    }
    if (!isSourcingUnit(product.unit)) {
      fieldErrors.unit = 'Выберите единицу измерения из списка';
    }
    if (Object.keys(fieldErrors).length > 0) {
      productErrors[product.id] = fieldErrors;
    }
  }

  if (Object.keys(productErrors).length > 0) {
    errors.productErrors = productErrors;
  }

  if (countSourcingUploadFiles(products, formAttachments) > 0) {
    const filesError = validateSourcingIncomingFiles([], products, formAttachments);
    if (filesError) errors.filesGeneral = filesError;
  }

  return errors;
}

export function hasSourcingFormErrors(errors: SourcingFormErrors): boolean {
  return Boolean(
    errors.requestTitle ||
      errors.productsGeneral ||
      errors.filesGeneral ||
      (errors.productErrors && Object.keys(errors.productErrors).length > 0),
  );
}

export function productsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

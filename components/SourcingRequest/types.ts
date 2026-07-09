export type SourcingReferenceImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export type SourcingFormAttachment = {
  id: string;
  file: File;
};

export const SOURCING_UNIT_OPTIONS = [
  'шт',
  'комплект',
  'м²',
  'м.п.',
  'кг',
  'упак.',
  'пара',
  'лист',
  'м³',
  'т',
] as const;

export type SourcingUnit = (typeof SOURCING_UNIT_OPTIONS)[number];

export const SOURCING_REFERENCE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export const SOURCING_ATTACHMENT_ACCEPT =
  '.pdf,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.doc,.docx,.zip,.obj,.fbx,.stl,application/pdf';

export type SourcingProductItem = {
  id: string;
  name: string;
  referenceImages: SourcingReferenceImage[];
  productLink: string;
  material: string;
  color: string;
  size: string;
  description: string;
  quantity: string;
  unit: SourcingUnit;
  /** Пользователь включил поле «Ожидаемый бюджет». */
  showExpectedBudget: boolean;
  expectedBudget: string;
};

export function isSourcingUnit(value: string): value is SourcingUnit {
  return (SOURCING_UNIT_OPTIONS as readonly string[]).includes(value);
}

export function normalizeSourcingUnit(value: string): SourcingUnit {
  return isSourcingUnit(value) ? value : 'шт';
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptySourcingProduct(): SourcingProductItem {
  return {
    id: newId(),
    name: '',
    referenceImages: [],
    productLink: '',
    material: '',
    color: '',
    size: '',
    description: '',
    quantity: '1',
    unit: 'шт',
    showExpectedBudget: false,
    expectedBudget: '',
  };
}

export function revokeSourcingReferenceImages(images: SourcingReferenceImage[]) {
  for (const image of images) {
    if (image.previewUrl.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
  }
}

export function revokeSourcingProducts(products: SourcingProductItem[]) {
  for (const product of products) {
    revokeSourcingReferenceImages(product.referenceImages);
  }
}

function isProductDirty(product: SourcingProductItem, empty: SourcingProductItem): boolean {
  return (
    product.name.trim() !== '' ||
    product.referenceImages.length > 0 ||
    product.productLink.trim() !== '' ||
    product.material.trim() !== '' ||
    product.color.trim() !== '' ||
    product.size.trim() !== '' ||
    product.description.trim() !== '' ||
    product.quantity !== empty.quantity ||
    product.unit !== empty.unit ||
    product.showExpectedBudget !== empty.showExpectedBudget ||
    product.expectedBudget.trim() !== ''
  );
}

export function isSourcingFormDirty(
  requestTitle: string,
  deliveryCity: string,
  products: SourcingProductItem[],
  formAttachments: SourcingFormAttachment[],
): boolean {
  if (requestTitle.trim()) return true;
  if (deliveryCity.trim()) return true;
  if (formAttachments.length > 0) return true;
  if (products.length > 1) return true;
  const empty = createEmptySourcingProduct();
  return products.some((product) => isProductDirty(product, empty));
}

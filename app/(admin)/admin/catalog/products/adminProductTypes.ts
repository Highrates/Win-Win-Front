/** Строка списка GET catalog/admin/products */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string;
  currency: string;
  isActive: boolean;
  category: { id: string; name: string };
  /** Полный путь в дереве категорий */
  categoryPath: string;
  /** Число дополнительных категорий (не основная) */
  additionalCategoryCount?: number;
  /** Первое изображение галереи */
  thumbUrl: string | null;
};

export type AdminProductVariantSummary = {
  id: string;
  displayName: string;
  price: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  /** Название размера из опции товара */
  sizeLabel?: string | null;
  /** «Цвет — материал» из опций и/или optionAttributes */
  colorMaterialLabel?: string | null;
};

/** Материал и цвета на карточке товара (админка / витрина). */
export type ProductMaterialColorShell = {
  id: string;
  name: string;
  sortOrder: number;
  colors: {
    id: string;
    name: string;
    imageUrl: string;
    sortOrder: number;
  }[];
};

export type ProductMaterialShell = {
  id: string;
  name: string;
  sortOrder: number;
};

/** Цвет в размере с привязкой к одному или нескольким материалам. */
export type ProductColorShell = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  materialIds: string[];
};

/** Размер и вложенные материалы/цвета (GET/PATCH товара). */
export type ProductSizeOptionShell = {
  id: string;
  name: string;
  sizeSlug: string | null;
  sortOrder: number;
  /** Плоский список материалов (предпочтительно). */
  materials?: ProductMaterialShell[];
  /** Плоский список цветов с materialIds (предпочтительно). */
  colorOptions?: ProductColorShell[];
  /** Вычисляемое: материалы с вложенными цветами (вариант SKU, PDP). */
  materialColorOptions: ProductMaterialColorShell[];
};

/** Ответ GET catalog/admin/products/:id — оболочка товара + список вариантов */
export type ProductAdminDetail = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  additionalCategoryIds: string[];
  curatedCollectionIds: string[];
  curatedProductSetIds: string[];
  brandId: string | null;
  shortDescription: string | null;
  isActive: boolean;
  images: { id?: string; url: string; alt: string | null; sortOrder: number }[];
  /** Размеры; внутри — материалы и цвета */
  sizeOptions?: ProductSizeOptionShell[];
  /** @deprecated Используйте sizeOptions */
  materialColorOptions?: ProductMaterialColorShell[];
  additionalInfoHtml: string | null;
  deliveryText: string | null;
  technicalSpecs: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  variants: AdminProductVariantSummary[];
};

/** GET catalog/admin/products/:productId/variants/:variantId */
export type ProductVariantAdminDetail = {
  id: string;
  productId: string;
  productName: string;
  displayName: string;
  variantLabel?: string | null;
  variantSlug?: string | null;
  sizeOptionId?: string | null;
  materialOptionId?: string | null;
  colorOptionId?: string | null;
  sizeOptions?: ProductSizeOptionShell[];
  materialColorOptions?: ProductMaterialColorShell[];
  productGalleryImages?: { id: string; url: string; alt: string | null; sortOrder: number }[];
  galleryProductImageIds?: string[];
  optionAttributes: Record<string, string> | null;
  priceMode: 'manual' | 'formula';
  costPriceCny: string | null;
  price: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  images: { url: string; alt: string | null; sortOrder: number }[];
  specsJson: unknown;
  sku: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  volumeLiters: string | null;
  weightKg: string | null;
  netLengthMm: number | null;
  netWidthMm: number | null;
  netHeightMm: number | null;
  netVolumeLiters: string | null;
  netWeightKg: string | null;
  model3dUrl: string | null;
  drawingUrl: string | null;
  categoryIdForPricing: string;
  additionalCategoryIds: string[];
};

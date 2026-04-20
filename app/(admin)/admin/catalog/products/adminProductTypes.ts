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

/** Один «материал-цвет» (доступность) внутри элемента модификации. */
export type AdminProductElementAvailability = {
  brandMaterialColorId: string;
  sortOrder: number;
  materialName: string;
  colorName: string;
  imageUrl: string | null;
};

/** Элемент модификации товара — напр. «Обивка», «Ножки». */
export type AdminProductElement = {
  id: string;
  name: string;
  sortOrder: number;
  /** Пул «материал-цветов» бренда, доступных для выбора в варианте. */
  availabilities: AdminProductElementAvailability[];
};

/** Модификация товара — напр. «2000×800 — угловой левый». */
export type AdminProductModification = {
  id: string;
  name: string;
  modificationSlug: string | null;
  sortOrder: number;
};

/** Краткая карточка варианта в таблице товара. */
export type AdminProductVariantSummary = {
  id: string;
  displayName: string;
  price: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  modificationId: string;
  modificationLabel: string;
  /** «Обивка: Ткань/Серый · Ножки: Металл/Чёрный» */
  selectionsLabel: string | null;
};

/** Ответ GET catalog/admin/products/:id */
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
  images: { id: string; url: string; alt: string | null; sortOrder: number }[];
  modifications: AdminProductModification[];
  /** Общий пул настраиваемых элементов товара (Обивка, Ножки…), доступных во всех модификациях. */
  elements: AdminProductElement[];
  additionalInfoHtml: string | null;
  deliveryText: string | null;
  technicalSpecs: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  variants: AdminProductVariantSummary[];
};

/** Элемент модификации с доступными «материал-цветами» (в карточке варианта). */
export type ProductVariantElementForPick = {
  id: string;
  name: string;
  sortOrder: number;
  availableMaterialColors: {
    brandMaterialColorId: string;
    materialId: string;
    materialName: string;
    colorName: string;
    imageUrl: string | null;
    sortOrder: number;
  }[];
};

/** GET catalog/admin/products/:productId/variants/:variantId */
export type ProductVariantAdminDetail = {
  id: string;
  productId: string;
  productName: string;
  variantLabel: string | null;
  variantSlug: string | null;
  modificationId: string;
  /** Все модификации товара — для переключения. */
  modificationsForProduct: {
    id: string;
    name: string;
    modificationSlug: string | null;
    sortOrder: number;
  }[];
  /** Общий пул элементов товара с доступными «материал-цветами». */
  productElements: ProductVariantElementForPick[];
  /** Фактически выбранные «материал-цвета» по элементам. */
  selections: {
    productElementId: string;
    brandMaterialColorId: string;
  }[];
  productGalleryImages: { id: string; url: string; alt: string | null; sortOrder: number }[];
  galleryProductImageIds: string[];
  priceMode: 'manual' | 'formula';
  costPriceCny: string | null;
  price: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
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

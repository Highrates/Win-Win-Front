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

/** Ответ GET catalog/admin/products/:id */
export type ProductAdminDetail = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  /** Категории кроме основной (categoryId) */
  additionalCategoryIds: string[];
  /** Коллекции типа «товары», в которых состоит товар */
  curatedCollectionIds: string[];
  /** Наборы, в которых состоит товар */
  curatedProductSetIds: string[];
  brandId: string | null;
  shortDescription: string | null;
  price: string;
  currency: string;
  isActive: boolean;
  images: { url: string; alt: string | null; sortOrder: number }[];
  specsJson: unknown;
  additionalInfoHtml: string | null;
  /** 3D-модель (GLB и т.п.) */
  model3dUrl: string | null;
  /** Чертёж (PDF и т.п.) */
  drawingUrl: string | null;
  deliveryText: string | null;
  technicalSpecs: string | null;
  sku: string | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  /** Объём брутто в м³ (поле API volumeLiters) */
  volumeLiters: string | null;
  weightKg: string | null;
  netLengthMm: number | null;
  netWidthMm: number | null;
  netHeightMm: number | null;
  netVolumeLiters: string | null;
  netWeightKg: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
};

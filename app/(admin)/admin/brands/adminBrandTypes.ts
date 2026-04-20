export type AdminBrandRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
};

export type BrandAdminDetail = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  shortDescription: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  galleryImageUrls: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  _count: { products: number };
};

/** Цвет внутри материала бренда (библиотечный). */
export type AdminBrandMaterialColor = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
};

/** Материал бренда со вложенными цветами (GET/PATCH /catalog/admin/brands/:id/materials). */
export type AdminBrandMaterial = {
  id: string;
  name: string;
  sortOrder: number;
  colors: AdminBrandMaterialColor[];
};

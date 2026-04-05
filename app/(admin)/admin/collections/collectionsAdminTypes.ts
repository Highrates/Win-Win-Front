/** GET catalog/admin/curated-collections */
export type AdminCuratedCollectionRow = {
  id: string;
  name: string;
  slug: string;
  kind: 'PRODUCT' | 'BRAND';
  isActive: boolean;
  itemCount: number;
};

/** GET catalog/admin/curated-collections/:id */
export type CuratedCollectionDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  coverMediaObjectId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  kind: 'PRODUCT' | 'BRAND';
  isActive: boolean;
  sortOrder: number;
  productItems: {
    id: string;
    productId: string;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
  brandItems: {
    id: string;
    brandId: string;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
};

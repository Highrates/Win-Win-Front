/** GET catalog/admin/product-sets */
export type AdminProductSetRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  itemCount: number;
};

/** GET catalog/admin/product-sets/:id */
export type ProductSetDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandId: string | null;
  brand: { id: string; name: string } | null;
  coverImageUrl: string | null;
  coverMediaObjectId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  sortOrder: number;
  productItems: {
    id: string;
    productId: string;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
};

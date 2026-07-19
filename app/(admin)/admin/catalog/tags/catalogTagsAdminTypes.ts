/** GET catalog/admin/catalog-tags (paginated list) */
export type AdminCatalogTagListRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
};

/** GET catalog/admin/catalog-tags?all=1 */
export type AdminCatalogTagOption = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

/** GET catalog/admin/catalog-tags/:id */
export type CatalogTagAdminDetail = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productItems: {
    productId: string;
    name: string;
    slug: string;
  }[];
};

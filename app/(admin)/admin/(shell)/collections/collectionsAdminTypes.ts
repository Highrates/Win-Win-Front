export type CuratedHomeGridSize = 'FOUR' | 'EIGHT' | 'UNLIMITED';
export type CuratedHomeOrderMode = 'FIXED' | 'RANDOM';

/** GET catalog/admin/curated-collections */
export type AdminCuratedCollectionRow = {
  id: string;
  name: string;
  slug: string;
  kind: 'PRODUCT' | 'BRAND';
  isActive: boolean;
  sortOrder: number;
  showOnHome: boolean;
  homeOrder: number | null;
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
  showOnHome: boolean;
  homeOrder: number | null;
  homeGridSize: CuratedHomeGridSize;
  homeOrderMode: CuratedHomeOrderMode;
  homePriceMin: number | null;
  homePriceMax: number | null;
  /** Товаров на главной после фильтра/лимита (0 → warn). Только GET :id. */
  homePreviewCount?: number;
  productItems: {
    id: string;
    productId: string;
    name: string;
    slug: string;
    sortOrder: number;
    isActive?: boolean;
    /** Base variant price без tier — для live preview. */
    price?: number | null;
  }[];
  brandItems: {
    id: string;
    brandId: string;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
};

export type RecommendationsStaticItem = {
  slug: string;
  name: string;
  price: number;
  /** Первое превью; если задано вместе с `imageUrls` — поведение как у витрины бренда */
  imageUrl?: string;
  imageUrls?: string[];
  variantId?: string;
  productId?: string;
  collections?: number;
  likes?: number;
  likedByMe?: boolean;
};

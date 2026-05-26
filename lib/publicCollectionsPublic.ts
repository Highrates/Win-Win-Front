import type { PublicBrandProductRow } from '@/lib/brandsPublic';
import { productPriceToNumber } from '@/lib/brandsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';

/** Карточки главной / PDP из строк товара как на странице бренда. */
export function mapBrandProductRowsToRecommendationItems(
  rows: PublicBrandProductRow[],
): RecommendationsStaticItem[] {
  return rows.map((p) => {
    const ordered = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const galleryUrls = ordered.map((im) => resolveMediaUrlForServer(im.url));
    const useGallery = galleryUrls.length > 1;
    const title = (p.displayName ?? p.name).trim() || p.name;
    return {
      slug: p.slug,
      name: title,
      price: productPriceToNumber(p.price),
      variantId: p.variantId ?? undefined,
      imageUrl: galleryUrls[0] ?? '/images/placeholder.svg',
      imageUrls: useGallery ? galleryUrls : undefined,
      productId: p.id,
      collections: typeof p.casesLinkedCount === 'number' ? p.casesLinkedCount : 0,
      likes: typeof p.likesDisplayCount === 'number' ? p.likesDisplayCount : 0,
      likedByMe: p.likedByMe,
    };
  });
}

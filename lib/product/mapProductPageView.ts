import type { Metadata } from 'next';
import type { PublicProductFromApi } from '@/lib/publicProductFromApi';
import { pickPublicProductVariant } from '@/lib/publicProductFromApi';
import { parseProductPriceFromApi } from '@/lib/productSpecsFromApi';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { PublicSetSiblingProduct } from '@/lib/catalogPublic';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';
import type { ProductPageQuery } from './loadProductPageData';

export type ProductBreadcrumb = {
  label: string;
  href: string;
  current: boolean;
};

export type ProductPageBrandView = {
  name: string;
  href: string;
  shortDescription: string | null;
  logoUrl: string | null;
};

export type ProductPageViewModel = {
  productTitleText: string;
  breadcrumbs: ProductBreadcrumb[];
  productImages: string[];
  variantImagesMap: Record<string, string[]>;
  priceMinNum: number;
  priceMaxNum: number;
  bodyText: string;
  initialModificationId: string | null;
  selectedVariantId: string | null;
  brand: ProductPageBrandView | null;
  interactiveProps: {
    productId: string;
    productSlug: string;
    productName: string;
    modifications: PublicProductFromApi['modifications'];
    elements: PublicProductFromApi['elements'];
    variants: PublicProductFromApi['variants'];
    defaultVariantId: string | null;
    deliveryText: string | null;
    technicalSpecs: string | null;
    additionalInfoHtml: string | null;
  };
  socialProps: {
    productId: string;
    casesLinkedCount: number;
    likesDisplayCount: number;
  };
};

/**
 * Начальная модификация только из `?m=<slug|id>` или якорного варианта (`?v=` / `?vs=`).
 * Без query — без выбранной модификации (галерея и цена уровня товара).
 */
export function pickInitialModificationId(
  product: PublicProductFromApi,
  mQuery: string | undefined,
  selectedVariantModificationId: string | null | undefined,
): string | null {
  if (selectedVariantModificationId) return selectedVariantModificationId;
  const q = mQuery?.trim();
  if (!q) return null;
  const bySlug = product.modifications.find((m) => m.modificationSlug === q);
  if (bySlug) return bySlug.id;
  const byId = product.modifications.find((m) => m.id === q);
  return byId?.id ?? null;
}

export function buildProductBreadcrumbs(
  product: PublicProductFromApi,
  productTitleText: string,
): ProductBreadcrumb[] {
  const breadcrumbs: ProductBreadcrumb[] = [{ label: 'Главная', href: '/', current: false }];
  const category = product.category;
  if (category) {
    breadcrumbs.push({ label: 'Каталог', href: '/catalog', current: false });
    if (category.parent) {
      breadcrumbs.push({
        label: category.parent.name,
        href: `/catalog/${category.parent.slug}`,
        current: false,
      });
    }
    breadcrumbs.push({
      label: category.name,
      href: `/catalog/${category.slug}`,
      current: false,
    });
  }
  breadcrumbs.push({ label: productTitleText, href: '', current: true });
  return breadcrumbs;
}

export function mapSetSiblingCards(items: PublicSetSiblingProduct[]): RecommendationsStaticItem[] {
  if (!items.length) return [];
  return items.map((it) => {
    const imageUrls = it.imageUrls.map((u) => resolveMediaUrlForServer(u));
    const useGallery = imageUrls.length > 1;
    return {
      slug: it.slug,
      name: it.name,
      price: parseProductPriceFromApi(it.price),
      productId: it.productId,
      variantId: it.id,
      imageUrl: imageUrls[0],
      imageUrls: useGallery ? imageUrls : undefined,
      likedByMe: it.likedByMe,
    };
  });
}

export function mapProductPageView(
  slug: string,
  product: PublicProductFromApi,
  query: ProductPageQuery,
): ProductPageViewModel {
  const { variant: selectedVariant } = pickPublicProductVariant(product, query.v, query.vs);
  const initialModificationId = pickInitialModificationId(
    product,
    query.m,
    selectedVariant?.modificationId,
  );

  const variantLabel = selectedVariant?.variantLabel?.trim() ?? '';
  const productTitleText = variantLabel || product.name;

  const productImages =
    product.images.length > 0
      ? product.images.map((im) => resolveMediaUrlForServer(im.url))
      : [resolveMediaUrlForServer(null)];

  const variantImagesMap: Record<string, string[]> = {};
  for (const variant of product.variants) {
    if (variant.images.length === 0) continue;
    variantImagesMap[variant.id] = variant.images.map((im) => resolveMediaUrlForServer(im.url));
  }

  const brand = product.brand;
  const brandHref = brand ? `/brands/${brand.slug}` : null;

  return {
    productTitleText,
    breadcrumbs: buildProductBreadcrumbs(product, productTitleText),
    productImages,
    variantImagesMap,
    priceMinNum: parseProductPriceFromApi(product.priceMin),
    priceMaxNum: parseProductPriceFromApi(product.priceMax),
    bodyText:
      product.shortDescription?.trim() ||
      product.description?.trim() ||
      'Описание появится позже.',
    initialModificationId,
    selectedVariantId: selectedVariant?.id ?? null,
    brand:
      brand && brandHref
        ? {
            name: brand.name,
            href: brandHref,
            shortDescription: brand.shortDescription,
            logoUrl: brand.logoUrl ? resolveMediaUrlForServer(brand.logoUrl) : null,
          }
        : null,
    interactiveProps: {
      productId: product.id,
      productSlug: slug,
      productName: productTitleText,
      modifications: product.modifications,
      elements: product.elements,
      variants: product.variants,
      defaultVariantId: product.defaultVariantId,
      deliveryText: product.deliveryText,
      technicalSpecs: product.technicalSpecs,
      additionalInfoHtml: product.additionalInfoHtml,
    },
    socialProps: {
      productId: product.id,
      casesLinkedCount: product.casesLinkedCount,
      likesDisplayCount: product.likesDisplayCount,
    },
  };
}

export function buildProductPageMetadata(product: PublicProductFromApi, query: ProductPageQuery) {
  const { variant } = pickPublicProductVariant(product, query.v, query.vs);
  const label = variant?.variantLabel?.trim() || product.name;
  const title = product.seoTitle?.trim() || `${label} — 588est`;
  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `Товар: ${label}`;
  return { title, description };
}

export function productPageMetadataFromData(data: {
  product: PublicProductFromApi;
  query: ProductPageQuery;
}): Metadata {
  return buildProductPageMetadata(data.product, data.query);
}

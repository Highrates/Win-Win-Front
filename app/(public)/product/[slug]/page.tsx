import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/ProductGallery';
import { Button } from '@/components/Button';
import { Recommendations } from '@/sections/home';
import { fetchProductSetSiblingsBySlug, fetchPublicProductBySlug } from '@/lib/catalogPublic';
import { parsePublicProduct, pickPublicProductVariant } from '@/lib/publicProductFromApi';
import {
  formatProductPriceRub,
  parseProductPriceFromApi,
  parseProductSpecsFromApi,
} from '@/lib/productSpecsFromApi';
import { buildMaterialChoiceGroups } from '@/lib/productMaterialChoiceGroups';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import ProductAccordions from './ProductAccordions';
import ProductSizeOptions from './ProductSizeOptions';
import ProductMaterialsOptions from './ProductMaterialsOptions';
import ProductColorOptions from './ProductColorOptions';
import ProductMaterialChoice from './ProductMaterialChoice';
import { ProductDetailsStickyBar } from './ProductDetailsStickyBar';
import styles from './ProductPage.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const raw = await fetchPublicProductBySlug(slug);
  const product = parsePublicProduct(raw);
  if (!product) {
    return { title: 'Товар — Win-Win' };
  }
  const title = product.seoTitle?.trim() || `${product.name} — Win-Win`;
  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `Товар: ${product.name}`;
  return { title, description };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; vs?: string }>;
}) {
  const { slug } = await params;
  const { v: variantQuery, vs: variantSlugQuery } = await searchParams;
  const [raw, siblingsRes] = await Promise.all([
    fetchPublicProductBySlug(slug),
    fetchProductSetSiblingsBySlug(slug),
  ]);
  const product = parsePublicProduct(raw);
  if (!product) {
    notFound();
  }

  const { variant: selectedVariant } = pickPublicProductVariant(
    product,
    variantQuery,
    variantSlugQuery,
  );
  const displayPrice = selectedVariant?.price ?? product.price;
  const displaySpecsJson = selectedVariant?.specsJson ?? product.specsJson;
  const displayImages =
    selectedVariant && selectedVariant.images.length > 0
      ? selectedVariant.images
      : product.images;

  const setSiblingCards =
    siblingsRes.items.length > 0
      ? siblingsRes.items.map((it) => ({
          slug: it.slug,
          name: it.name,
          price: parseProductPriceFromApi(it.price),
          imageUrls: it.imageUrls.map((u) => resolveMediaUrlForServer(u)),
          variantId: it.id,
        }))
      : [];

  const priceNum = parseProductPriceFromApi(displayPrice);
  const priceText = priceNum > 0 ? formatProductPriceRub(priceNum) : '—';
  const specs = parseProductSpecsFromApi(displaySpecsJson);
  const materialChoiceGroups = buildMaterialChoiceGroups(product, resolveMediaUrlForServer);
  const colorItems = specs.colors.map((c) => ({
    name: c.name,
    imageUrl: resolveMediaUrlForServer(c.imageUrl),
  }));
  const gallerySrcs =
    displayImages.length > 0
      ? displayImages.map((im) => resolveMediaUrlForServer(im.url))
      : [resolveMediaUrlForServer(null)];

  const category = product.category;
  const breadcrumbs: { label: string; href: string; current: boolean }[] = [
    { label: 'Главная', href: '/', current: false },
  ];
  if (category) {
    if (category.parent) {
      breadcrumbs.push({
        label: category.parent.name,
        href: `/categories/${category.parent.slug}`,
        current: false,
      });
    }
    breadcrumbs.push({
      label: category.name,
      href: `/categories/${category.slug}`,
      current: false,
    });
  }
  breadcrumbs.push({ label: product.name, href: '', current: true });

  const brand = product.brand;
  const brandHref = brand ? `/brands/${brand.slug}` : null;
  const brandDesc =
    brand?.shortDescription?.trim() ||
    'Продукция бренда представлена в нашем каталоге.';

  const bodyText =
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    'Описание появится позже.';

  const variantLabel = selectedVariant?.variantLabel?.trim() ?? '';
  /** В заголовке карточки — только название варианта; без подписи остаётся название товара. */
  const productTitleText = variantLabel || product.name;

  return (
    <main>
      <section className={styles.productSection}>
        <div className="padding-global">
          <div className={styles.productPageFlow}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              {breadcrumbs.map((item, i) => (
                <Fragment key={`${item.label}-${i}`}>
                  {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
                  {item.current ? (
                    <span className={styles.breadcrumbsCurrent}>{item.label}</span>
                  ) : (
                    <Link href={item.href} className={styles.breadcrumbsLink}>
                      {item.label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </nav>
            <div className={styles.productImgsWrapper}>
              <ProductGallery images={gallerySrcs} productName={productTitleText} />
            </div>

            <div className={styles.productDetails}>
              <div className={styles.productDetailsLeft}>
                <div className={styles.productDetailsInner}>
                  <div className={styles.productTitles}>
                    {brand ? (
                      <Link href={brandHref!} className={styles.productBrandName}>
                        {brand.name}
                      </Link>
                    ) : (
                      <span className={styles.productBrandName}>Бренд не указан</span>
                    )}
                    <h1 className={styles.productName}>{productTitleText}</h1>
                  </div>
                  <div className={styles.productDetailsInteract}>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>0</span>
                    </div>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>0</span>
                    </div>
                    <div className={styles.productDetailsInteractItem}>
                      <img src="/icons/message.svg" alt="" width={20} height={20} className={styles.productDetailsInteractIcon} />
                      <span className={styles.productDetailsInteractValue}>0</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.productDetailsRight}>
                <div className={styles.productDetailsRightRow}>
                  <span className={styles.productDetailsPrice}>{priceText}</span>
                  <div className={styles.productDetailsBtnsWrapper}>
                    <div className={styles.productDetailsBtnsSecondary}>
                      <Button
                        variant="secondary"
                        iconLeft="/icons/ruler&pen.svg"
                        iconRightChevron
                        aria-label="Скачать чертеж"
                      />
                      <Button
                        variant="secondary"
                        iconLeft="/icons/3dcube.svg"
                        iconRightChevron
                        aria-label="Скачать 3D модель"
                      />
                    </div>
                    <Button variant="primary" className={styles.productDetailsBtnPrimary}>
                      Добавить к заказу
                    </Button>
                  </div>
                </div>
                <ProductDetailsStickyBar priceText={priceText} />

                <div className={styles.descriptionWrapper}>
                  <p className={styles.descriptionText}>{bodyText}</p>
                </div>

                {materialChoiceGroups ? (
                  <ProductMaterialChoice
                    productPath={`/product/${slug}`}
                    groups={materialChoiceGroups}
                    selectedVariantId={selectedVariant?.id ?? null}
                  />
                ) : (
                  <>
                    {colorItems.length > 0 ? (
                      <div className={styles.productColorWrapper}>
                        <span className={styles.productColorTitle}>Цвет</span>
                        <ProductColorOptions items={colorItems} />
                      </div>
                    ) : null}

                    <div className={styles.productMaterialsSelect}>
                      <span className={styles.productMaterialsTitle}>Материалы</span>
                      <ProductMaterialsOptions items={specs.materials.length ? specs.materials : undefined} />
                    </div>
                  </>
                )}

                <div className={styles.productSizeSelect}>
                  <span className={styles.productSizeTitle}>Размеры</span>
                  <ProductSizeOptions items={specs.sizes.length ? specs.sizes : undefined} />
                </div>

                <div className={styles.accordionsWrapper}>
                  <ProductAccordions
                    deliveryText={product.deliveryText}
                    technicalSpecs={product.technicalSpecs}
                    additionalInfoHtml={product.additionalInfoHtml}
                  />
                </div>

                {brand && brandHref ? (
                  <div className={styles.brandWrapper}>
                    <h2 className={styles.brandTitle}>Бренд</h2>
                    <Link
                      href={brandHref}
                      className={styles.brandContent}
                      aria-label={`Перейти на страницу бренда ${brand.name}`}
                    >
                      <div className={styles.brandContentInner}>
                        <div
                          className={styles.brandLogo}
                          style={
                            brand.logoUrl
                              ? {
                                  backgroundImage: `url(${resolveMediaUrlForServer(brand.logoUrl)})`,
                                  backgroundSize: 'contain',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'center',
                                }
                              : undefined
                          }
                          aria-hidden
                        />
                        <div className={styles.brandShortDescription}>
                          <span className={styles.brandName}>{brand.name}</span>
                          <p className={styles.brandDescription}>{brandDesc}</p>
                        </div>
                      </div>
                      <img src="/icons/arrow.svg" alt="" width={22} height={22} className={styles.brandArrow} aria-hidden />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      {setSiblingCards.length > 0 ? (
        <Recommendations
          id="product-recommendations"
          title="Наборы"
          staticItems={setSiblingCards}
        />
      ) : null}
    </main>
  );
}

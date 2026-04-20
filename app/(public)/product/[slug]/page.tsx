import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Recommendations } from '@/sections/home';
import { fetchProductSetSiblingsBySlug, fetchPublicProductBySlug } from '@/lib/catalogPublic';
import { parsePublicProduct, pickPublicProductVariant } from '@/lib/publicProductFromApi';
import { parseProductPriceFromApi } from '@/lib/productSpecsFromApi';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import ProductInteractive from './ProductInteractive';
import styles from './ProductPage.module.css';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; vs?: string; m?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { v, vs } = await searchParams;
  const raw = await fetchPublicProductBySlug(slug, { v, vs });
  const product = parsePublicProduct(raw);
  if (!product) {
    return { title: 'Товар — Win-Win' };
  }
  const { variant } = pickPublicProductVariant(product, v, vs);
  const label = variant?.variantLabel?.trim() || product.name;
  const title = product.seoTitle?.trim() || `${label} — Win-Win`;
  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `Товар: ${label}`;
  return { title, description };
}

/**
 * Начальная модификация: из `?m=<slug|id>`, иначе `defaultModificationId`,
 * иначе первая. Дальше переключение — клиентское, чтобы не сбрасывать selections.
 */
function pickModificationId(
  product: ReturnType<typeof parsePublicProduct>,
  mQuery: string | undefined,
): string | null {
  if (!product) return null;
  const q = mQuery?.trim();
  if (q) {
    const bySlug = product.modifications.find((m) => m.modificationSlug === q);
    if (bySlug) return bySlug.id;
    const byId = product.modifications.find((m) => m.id === q);
    if (byId) return byId.id;
  }
  return product.defaultModificationId ?? product.modifications[0]?.id ?? null;
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; vs?: string; m?: string }>;
}) {
  const { slug } = await params;
  const { v: variantQuery, vs: variantSlugQuery, m: modificationQuery } = await searchParams;
  const [raw, siblingsRes] = await Promise.all([
    fetchPublicProductBySlug(slug, {
      v: variantQuery,
      vs: variantSlugQuery,
    }),
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
  const initialModificationId = selectedVariant?.modificationId
    ?? pickModificationId(product, modificationQuery);

  const variantLabel = selectedVariant?.variantLabel?.trim() ?? '';
  const productTitleText = variantLabel || product.name;

  const setSiblingCards =
    siblingsRes.items.length > 0
      ? siblingsRes.items.map((it) => ({
          slug: it.slug,
          name: it.name,
          price: parseProductPriceFromApi(it.price),
          imageUrls: it.imageUrls.map((u) => resolveMediaUrlForServer(u)),
        }))
      : [];

  const priceMinNum = parseProductPriceFromApi(product.priceMin);
  const priceMaxNum = parseProductPriceFromApi(product.priceMax);

  const productImages =
    product.images.length > 0
      ? product.images.map((im) => resolveMediaUrlForServer(im.url))
      : [resolveMediaUrlForServer(null)];

  const variantImagesMap: Record<string, string[]> = {};
  for (const v of product.variants) {
    if (v.images.length === 0) continue;
    variantImagesMap[v.id] = v.images.map((im) => resolveMediaUrlForServer(im.url));
  }

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
  breadcrumbs.push({ label: productTitleText, href: '', current: true });

  const brand = product.brand;
  const brandHref = brand ? `/brands/${brand.slug}` : null;

  const bodyText =
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    'Описание появится позже.';

  const leftColumn = (
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
  );

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

            <ProductInteractive
              productName={productTitleText}
              productImages={productImages}
              variantImagesMap={variantImagesMap}
              leftColumn={leftColumn}
              modifications={product.modifications}
              elements={product.elements}
              variants={product.variants}
              initialModificationId={initialModificationId}
              selectedVariantId={selectedVariant?.id ?? null}
              defaultVariantId={product.defaultVariantId}
              priceMin={priceMinNum}
              priceMax={priceMaxNum}
              bodyText={bodyText}
              deliveryText={product.deliveryText}
              technicalSpecs={product.technicalSpecs}
              additionalInfoHtml={product.additionalInfoHtml}
              brand={
                brand && brandHref
                  ? {
                      name: brand.name,
                      href: brandHref,
                      shortDescription: brand.shortDescription,
                      logoUrl: brand.logoUrl
                        ? resolveMediaUrlForServer(brand.logoUrl)
                        : null,
                    }
                  : null
              }
            />
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

import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadProductCoreData } from '@/lib/product/loadProductPageData';
import { fetchProductQaMetaBySlug } from '@/lib/server/productQaFetch';
import {
  mapProductPageView,
  productPageMetadataFromData,
} from '@/lib/product/mapProductPageView';
import ProductInteractive from './ProductInteractive';
import { ProductSetSiblingsRail } from './ProductSetSiblingsRail';
import { ProductSetSiblingsSkeleton } from './ProductSetSiblingsSkeleton';
import styles from './ProductPageLayout.module.css';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; vs?: string; m?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const data = await loadProductCoreData(slug, query);
  if (!data) {
    return { title: 'Товар — Wupapa' };
  }
  return productPageMetadataFromData(data);
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; vs?: string; m?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const [data, qaMeta] = await Promise.all([
    loadProductCoreData(slug, query),
    fetchProductQaMetaBySlug(slug),
  ]);
  if (!data) {
    notFound();
  }

  const view = mapProductPageView(data.slug, data.product, data.query);

  return (
    <main>
      <section className={styles.productSection}>
        <div className="padding-global">
          <div className={styles.productPageFlow}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              {view.breadcrumbs.map((item, i) => (
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
              productImages={view.productImages}
              variantImagesMap={view.variantImagesMap}
              productTitleText={view.productTitleText}
              socialProps={view.socialProps}
              initialQaMessageCount={qaMeta.messageCount}
              initialModificationId={view.initialModificationId}
              selectedVariantId={view.selectedVariantId}
              priceMin={view.priceMinNum}
              priceMax={view.priceMaxNum}
              bodyText={view.bodyText}
              brand={view.brand}
              {...view.interactiveProps}
            />
          </div>
        </div>
      </section>
      <Suspense fallback={<ProductSetSiblingsSkeleton />}>
        <ProductSetSiblingsRail slug={slug} />
      </Suspense>
    </main>
  );
}

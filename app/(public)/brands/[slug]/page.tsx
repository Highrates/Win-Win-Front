import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import { brandCoverImageUrl, plainTextExcerptFromHtml } from '@/lib/brandsPublic';
import { fetchPublicBrandBySlug } from '@/lib/server/brandAuthFetch';
import { brandProductRowToProductGridItem } from '@/lib/productGridItem';
import { BrandPageMarketClient } from './BrandPageMarketClient';
import { MoreAboutBrandModal } from './MoreAboutBrandModal';
import styles from './BrandPage.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchPublicBrandBySlug(slug);
  if (!row) {
    return { title: 'Бренд — Win-Win' };
  }
  const title = row.seoTitle?.trim() || `${row.name} — Бренд — Win-Win`;
  const desc =
    row.seoDescription?.trim() ||
    row.shortDescription?.trim() ||
    plainTextExcerptFromHtml(row.description, 200) ||
    `Страница бренда ${row.name}`;
  return { title, description: desc };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category: categoryParam } = await searchParams;
  const catalogRoots = await fetchHomeCatalogRoots();
  const initialCategoryId =
    categoryParam?.trim() && catalogRoots.some((r) => r.id === categoryParam.trim())
      ? categoryParam.trim()
      : null;

  const row = await fetchPublicBrandBySlug(slug, { categoryId: initialCategoryId });
  if (!row) notFound();

  const name = row.name;
  const short = row.shortDescription?.trim() ?? '';
  const excerpt = short || plainTextExcerptFromHtml(row.description, 280);
  const heroSrc = brandCoverImageUrl(row) ?? '/images/placeholder.svg';
  const richHtml = row.description?.trim() || '';

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Бренды', href: '/brands', current: false },
    { label: name, href: '', current: true },
  ];

  const brandProducts = row.products.map(brandProductRowToProductGridItem);

  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
              <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={i}>
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
              <div className={styles.previewPageTitlesBody}>
                <div className={styles.previewPageTitlesOuter}>
                  <div className={styles.previewPageTitlesInner}>
                    <span className={styles.previewParentName}>БРЕНД</span>
                    <h1 className={styles.previewCurrentName}>{name}</h1>
                  </div>
                  {excerpt ? (
                    <div className={styles.shortBrandDescriptionWrapper}>
                      <p>{excerpt}</p>
                    </div>
                  ) : null}
                  <MoreAboutBrandModal
                    linkClassName={styles.moreAboutBrandLink}
                    textClassName={styles.moreAboutBrandText}
                    arrowClassName={styles.moreAboutBrandArrow}
                    bodyHtml={richHtml}
                  />
                </div>
              </div>
            </div>
            <img
              src={heroSrc}
              alt=""
              width={768}
              height={393}
              className={styles.previewImage}
            />
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BrandPageMarketClient
          slug={slug}
          catalogRoots={catalogRoots}
          initialCategoryId={initialCategoryId}
          initialProducts={brandProducts}
        />
      </Suspense>
    </main>
  );
}

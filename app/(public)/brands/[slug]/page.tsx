import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import {
  BRAND_CATEGORY_TABS,
} from '@/lib/public/brands';
import {
  brandCoverImageUrl,
  fetchPublicBrandBySlug,
  plainTextExcerptFromHtml,
  productPriceToNumber,
} from '@/lib/brandsPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
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
  const currentCategory =
    categoryParam && BRAND_CATEGORY_TABS.some((t) => t.id === categoryParam) ? categoryParam : 'living';

  const row = await fetchPublicBrandBySlug(slug);
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

  const brandProducts = row.products.map((p) => {
    const ordered = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const galleryUrls = ordered.map((im) => resolveMediaUrlForServer(im.url));
    const useGallery = galleryUrls.length > 1;
    const title = (p.displayName ?? p.name).trim() || p.name;
    return {
      key: p.slug,
      slug: p.slug,
      name: title,
      price: productPriceToNumber(p.price),
      imageUrl: galleryUrls[0] ?? '/images/placeholder.svg',
      imageUrls: useGallery ? galleryUrls : undefined,
    };
  });

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

      <section className={styles.marketSection} aria-label="Товары бренда">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <nav className={styles.tabsWrapper} aria-label="Категории товаров бренда">
              {BRAND_CATEGORY_TABS.map((tab) => {
                const isActive = tab.id === currentCategory;
                const href = `/brands/${slug}?category=${tab.id}`;
                return (
                  <Link
                    key={tab.id}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={isActive ? styles.tabActive : styles.tab}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
            <div className={styles.marketSectionRow}>
              <div className={styles.marketSectionRowLeft}>
                <div className={styles.marketFilterGroup}>
                  <button type="button" aria-label="Фильтр">
                    <img src="/icons/filter.svg" alt="" width={20} height={20} />
                    <span>Фильтр</span>
                  </button>
                </div>
                <div className={styles.marketSortGroup}>
                  <button type="button" aria-label="Сортировка">
                    <img src="/icons/sort.svg" alt="" width={20} height={20} />
                    <span>Самые популярные</span>
                  </button>
                </div>
              </div>
              <div className={styles.marketSectionRowResult}>
                <span className={styles.marketSectionRowResultLabel}>Результат: </span>
                <span className={styles.marketSectionRowResultValue}>{brandProducts.length}</span>
              </div>
            </div>
            <div className={styles.marketGrid}>
              {brandProducts.map((p) => (
                <ProductCard
                  key={p.key}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  imageUrl={p.imageUrl}
                  imageUrls={p.imageUrls}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

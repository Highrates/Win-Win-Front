import Link from 'next/link';
import { CategoryCatalogGridClient } from '@/app/(site)/(public)/categories/CategoryCatalogGridClient';
import { CATEGORY_PER_PAGE } from '@/app/(site)/(public)/categories/categoryCatalogData';
import { fetchProductsSearch } from '@/lib/server/catalogAuthFetch';
import styles from './CategoryPage.module.css';

type Props = {
  categoryId: string;
  categorySlug: string;
  tagSlug?: string;
  activeTag?: { slug: string; name: string } | null;
};

export async function CategoryCatalogProductSection({
  categoryId,
  categorySlug,
  tagSlug,
  activeTag,
}: Props) {
  const search = await fetchProductsSearch({
    categoryId,
    tag: tagSlug,
    page: 1,
    limit: CATEGORY_PER_PAGE,
  });

  return (
    <>
      {activeTag ? (
        <div className={styles.activeTagRow}>
          <span className={styles.activeTagLabel}>Зона:</span>
          <span className={styles.activeTagChip}>{activeTag.name}</span>
          <Link href={`/catalog/${categorySlug}`} className={styles.activeTagClear}>
            Сбросить
          </Link>
        </div>
      ) : null}
      <div className={styles.marketSectionRowResult}>
        <span className={styles.marketSectionRowResultLabel}>Результат: </span>
        <span className={styles.marketSectionRowResultValue}>{search.total}</span>
      </div>
      <CategoryCatalogGridClient
        categoryId={categoryId}
        tagSlug={tagSlug}
        initialHits={search.hits}
        initialTotal={search.total}
      />
    </>
  );
}

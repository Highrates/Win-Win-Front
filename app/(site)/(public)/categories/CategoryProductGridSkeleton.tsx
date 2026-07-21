import catStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';
import skeletonStyles from '@/app/(site)/(public)/catalog/CatalogPageSkeleton.module.css';

const PRODUCT_GRID_PLACEHOLDERS = 12;

export function CategoryProductGridSkeleton() {
  return (
    <>
      <div className={skeletonStyles.marketToolbar}>
        <div className={`${skeletonStyles.shimmer} ${skeletonStyles.toolbarCount}`} aria-hidden />
      </div>
      <div className={catStyles.marketGrid}>
        {Array.from({ length: PRODUCT_GRID_PLACEHOLDERS }, (_, i) => (
          <div key={i} className={skeletonStyles.productSkeleton}>
            <div className={`${skeletonStyles.shimmer} ${skeletonStyles.productThumb}`} aria-hidden />
            <div className={`${skeletonStyles.shimmer} ${skeletonStyles.productTitle}`} aria-hidden />
            <div className={`${skeletonStyles.shimmer} ${skeletonStyles.productPrice}`} aria-hidden />
          </div>
        ))}
      </div>
    </>
  );
}

import recStyles from '@/sections/home/Recommendations/Recommendations.module.css';
import skeletonStyles from '@/sections/home/homeSkeleton.module.css';
import styles from './ProductPageSkeleton.module.css';

const CARD_PLACEHOLDERS = 4;

export function ProductSetSiblingsSkeleton() {
  return (
    <section className={recStyles.section} aria-hidden>
      <div className="padding-global">
        <div className={`${skeletonStyles.shimmer} ${styles.setsTitle}`} />
        <div className={recStyles.grid}>
          {Array.from({ length: CARD_PLACEHOLDERS }, (_, i) => (
            <div key={i} className={styles.setCard}>
              <div className={`${skeletonStyles.shimmer} ${styles.setCardThumb}`} />
              <div className={`${skeletonStyles.shimmer} ${styles.setCardLine}`} />
              <div className={`${skeletonStyles.shimmer} ${styles.setCardPrice}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

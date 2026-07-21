import pageStyles from './page.module.css';
import styles from './AccountProjectsPageSkeleton.module.css';

export function AccountProjectsPageSkeleton() {
  const sh = styles.shimmer;
  return (
    <div className={pageStyles.page} aria-busy="true" aria-label="Загрузка проектов">
      <div className={styles.toolbar}>
        <div className={styles.tabsStrip}>
          <div className={`${styles.tabPill} ${sh}`} />
          <div className={`${styles.tabPill} ${styles.tabPillWide} ${sh}`} />
          <div className={`${styles.tabPill} ${sh}`} />
        </div>
        <div className={`${styles.createBtn} ${sh}`} />
      </div>

      <div className={styles.headerBlock}>
        <div className={`${styles.titleLine} ${sh}`} />
        <div className={`${styles.addressLine} ${sh}`} />
      </div>

      <div className={`${styles.ctaBlock} ${sh}`} />

      <div className={styles.cards}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.card}>
            <div className={`${styles.cardThumb} ${sh}`} />
            <div className={styles.cardBody}>
              <div className={`${styles.cardTitle} ${sh}`} />
              <div className={`${styles.cardMeta} ${sh}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

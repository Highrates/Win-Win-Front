import pageStyles from './page.module.css';
import styles from './AccountDocsListSkeleton.module.css';

const GROUPS = 2;
const ROWS = 3;

/** Скелетон ленты документов: 2 группы × 3 строки (разметка как у AccountDocRow). */
export function AccountDocsListSkeleton() {
  const sh = styles.shimmer;
  return (
    <div className={pageStyles.list} aria-busy="true" aria-label="Загрузка документов">
      {Array.from({ length: GROUPS }, (_, g) => (
        <div key={g} className={pageStyles.dateBlock}>
          <div className={pageStyles.dateWrapper}>
            <span className={`${styles.dateLabel} ${sh}`} />
            <span className={pageStyles.dateLine} aria-hidden />
          </div>
          <div className={pageStyles.docsWrapper}>
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} className={styles.row}>
                <span className={`${styles.icon} ${sh}`} />
                <span className={styles.text}>
                  <span className={`${styles.title} ${sh}`} style={{ width: `${72 - r * 14}%` }} />
                  <span className={`${styles.meta} ${sh}`} />
                </span>
                <span className={`${styles.badge} ${sh}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

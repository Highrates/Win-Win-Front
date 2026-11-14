import pageStyles from './page.module.css';
import styles from './AccountToursPageSkeleton.module.css';

export function AccountToursPageSkeleton() {
  const sh = styles.shimmer;
  return (
    <div className={pageStyles.page} aria-busy="true" aria-label="Загрузка заявок на туры">
      <div className={`${styles.titleLine} ${sh}`} />
      <ul className={pageStyles.list}>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className={styles.card}>
              <div className={`${styles.thumb} ${sh}`} />
              <div className={styles.body}>
                <div className={`${styles.lineWide} ${sh}`} />
                <div className={`${styles.line} ${sh}`} />
                <div className={`${styles.lineShort} ${sh}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

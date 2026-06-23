import Link from 'next/link';
import newsStyles from '../News/News.module.css';
import styles from './ProjectSourcing.module.css';

const CONTAINER_IMAGE_SRC = '/images/container%20win-win.png';
const UNPACKING_VIDEO_SRC = '/win-win%20unpacking.mp4';

const TITLE = 'Индивидуальный подбор мебели под проект';
const DESCRIPTION =
  'Не нашли нужную модель в каталоге? Опишите задачу — подберём варианты по вашему ТЗ, референсам, чертежам или аналогам. Работаем с фабриками, проверяем соответствие бюджету и срокам, подготовим предложение для согласования';

export function ProjectSourcing() {
  return (
    <section className={styles.section} aria-labelledby="project-sourcing-title">
      <div className="padding-global">
        <div className={styles.promoGrid}>
          <div className={styles.infoPanel}>
            <h2 id="project-sourcing-title" className={styles.titleLarge}>
              {TITLE}
            </h2>
            <div className={styles.visualWrap}>
              <img
                className={styles.containerImage}
                src={CONTAINER_IMAGE_SRC}
                alt=""
                width={480}
                height={320}
                decoding="async"
              />
            </div>
            <div className={styles.detailsFooter}>
              <p className={styles.description}>{DESCRIPTION}</p>
              <Link href="#" className={newsStyles.allNewsLink}>
                <span className={newsStyles.allNewsText}>Заказать подбор</span>
                <img
                  src="/icons/arrow-right.svg"
                  alt=""
                  width={12}
                  height={7}
                  className={newsStyles.arrow}
                />
              </Link>
            </div>
          </div>
          <div className={styles.mediaPanel}>
            <video
              className={styles.mediaVideo}
              src={UNPACKING_VIDEO_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Распаковка мебели Win-Win"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

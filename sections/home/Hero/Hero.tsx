import Image from 'next/image';
import styles from './Hero.module.css';

function heroImageUnoptimized(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/uploads/');
}

export function Hero({
  imageUrl,
  fillFold = false,
}: {
  imageUrl?: string | null;
  /** Hero + ScrollCatalog в fold: hero растягивается на оставшееся место */
  fillFold?: boolean;
}) {
  const bgUrl = imageUrl?.trim() ? imageUrl.trim() : '/images/hero-img.png';
  return (
    <section
      id="hero-section"
      className={fillFold ? `${styles.section} ${styles.sectionFold}` : styles.section}
      aria-label="Главный экран"
    >
      <div className={fillFold ? `${styles.heroBg} ${styles.heroBgFold}` : styles.heroBg}>
        <Image
          src={bgUrl}
          alt=""
          fill
          className={styles.heroImage}
          sizes="100vw"
          priority
          fetchPriority="high"
          unoptimized={heroImageUnoptimized(bgUrl)}
        />
        <div className={styles.heroBetaRow} aria-hidden="true">
          <div className="padding-global">
            <p className={styles.heroBeta}>Beta 2.1 · 2026</p>
          </div>
        </div>
      </div>
    </section>
  );
}

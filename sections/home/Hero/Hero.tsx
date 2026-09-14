import type { ReactNode } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';

function heroImageUnoptimized(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/uploads/');
}

export function Hero({
  imageUrl,
  fillFold = false,
  cornerLabel,
  cornerAlign = 'right',
  cornerAriaHidden = true,
}: {
  imageUrl?: string | null;
  /** Hero + ScrollCatalog в fold: hero растягивается на оставшееся место */
  fillFold?: boolean;
  /**
   * Нижний угол обложки. `undefined` — Beta 2.1 (home/catalog);
   * `null` — скрыть; иначе кастомная подпись (напр. «О нас»).
   */
  cornerLabel?: ReactNode | null;
  cornerAlign?: 'left' | 'right';
  cornerAriaHidden?: boolean;
}) {
  const bgUrl = imageUrl?.trim() ? imageUrl.trim() : '/images/hero-img.png';
  const showDefaultBeta = cornerLabel === undefined;
  const showCorner = showDefaultBeta || cornerLabel != null;

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
        {showCorner ? (
          <div
            className={styles.heroBetaRow}
            aria-hidden={cornerAriaHidden ? true : undefined}
          >
            <div className="padding-global">
              {showDefaultBeta ? (
                <p className={styles.heroBeta}>Beta 2.1 · 2026</p>
              ) : (
                <div
                  className={
                    cornerAlign === 'left' ? styles.heroCornerLeft : styles.heroBeta
                  }
                >
                  {cornerLabel}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

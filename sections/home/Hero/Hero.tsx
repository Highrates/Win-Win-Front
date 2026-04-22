import styles from './Hero.module.css';
import headerStyles from '@/components/Header/Header.module.css';

export function Hero({ imageUrl }: { imageUrl?: string | null }) {
  const bgUrl = imageUrl?.trim() ? imageUrl.trim() : '/images/hero-img.png';
  return (
    <section id="hero-section" className={styles.section} aria-label="Главный экран">
      <div
        className={styles.heroBg}
        style={{
          backgroundImage: `url("${bgUrl.replace(/"/g, '%22')}")`,
        }}
      >
        <div className={styles.heroSloganWrap} aria-hidden="true">
          <div className={headerStyles.heroLogoBadge}>
            <p className={headerStyles.heroLogoBadgeText}>Качественный, стильный интерьер из Китая</p>
            <span className={headerStyles.heroLogoBadgeBottomRow} aria-hidden="true">
              <span className={headerStyles.heroLogoBadgeLogoSlot}>
                <img className={headerStyles.heroLogoBadgeLogo} src="/images/logo.svg" alt="" />
              </span>
              <span className={headerStyles.heroLogoBadgeTm}>TM</span>
            </span>
          </div>
        </div>
        <div className={styles.heroBetaRow} aria-hidden="true">
          <div className="padding-global">
            <p className={styles.heroBeta}>Beta 1.0 · 2026</p>
          </div>
        </div>
      </div>
    </section>
  );
}

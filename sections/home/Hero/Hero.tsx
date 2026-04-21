import styles from './Hero.module.css';

export function Hero({ imageUrl }: { imageUrl?: string | null }) {
  const bgUrl = imageUrl?.trim() ? imageUrl.trim() : '/images/hero-img.png';
  return (
    <section id="hero-section" className={styles.section} aria-label="Главный экран">
      <div
        className={styles.heroBg}
        style={{
          backgroundImage: `url("${bgUrl.replace(/"/g, '%22')}")`,
        }}
      />
    </section>
  );
}

import Image from 'next/image';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="hero-section" className={styles.section} aria-label="Главный экран">
      <div className={styles.heroBg}>
        <div className="padding-global">
          <Image
            src="/images/hero-img.png"
            alt=""
            width={1536}
            height={520}
            className={styles.heroImg}
            priority
          />
        </div>
      </div>
    </section>
  );
}

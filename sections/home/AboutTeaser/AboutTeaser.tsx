import Link from 'next/link';
import Image from 'next/image';
import styles from './AboutTeaser.module.css';

export function AboutTeaser() {
  return (
    <section className={styles.section} aria-label="О нас">
      <div className={`padding-global ${styles.inner}`}>
        <Image
          src="/images/logo.svg"
          alt="588est"
          width={190}
          height={28}
          className={styles.logo}
          priority={false}
        />
        <p className={`text-card-16-300 ${styles.tagline}`}>
          Качественный и стильный интерьер из Китая
        </p>
        <Link href="/about" className={styles.aboutLink}>
          <span className={styles.aboutLinkText}>О нас</span>
          <img
            src="/icons/arrow-right.svg"
            alt=""
            width={12}
            height={7}
            className={styles.arrow}
          />
        </Link>
      </div>
    </section>
  );
}

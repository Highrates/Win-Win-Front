import Link from 'next/link';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  collections?: number;
  likes?: number;
  comments?: number;
  /** Иконка избранного с обводкой --color-red (например, страница «Избранное» в ЛК) */
  heartActive?: boolean;
}

function formatPrice(value: number): string {
  const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `~${formatted} ₽`;
}

export function ProductCard({
  slug,
  name,
  price,
  imageUrl = '/images/placeholder.svg',
  collections = 5,
  likes = 180,
  comments = 180,
  heartActive = false,
}: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className={styles.productCard}>
      <div className={styles.productContent}>
        <div className={styles.productImgWrapper}>
          <img className={styles.productImg} src={imageUrl} alt="" />
        </div>
        <div className={styles.productTitles}>
          <span className={styles.productName}>{name}</span>
          <span className={styles.productPrice}>{formatPrice(price)}</span>
        </div>
      </div>
      <div className={styles.productInteract}>
        <div className={styles.interactWrapper}>
          <div className={styles.interactItem}>
            <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.interactIcon} />
            <span className={styles.interactValue}>{collections}</span>
          </div>
          <div className={styles.interactItem}>
            {heartActive ? (
              <svg
                className={styles.heartIconActive}
                width={20}
                height={20}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
            )}
            <span className={styles.interactValue}>{likes}</span>
          </div>
          <div className={styles.interactItem}>
            <img src="/icons/message.svg" alt="" width={20} height={20} className={styles.interactIcon} />
            <span className={styles.interactValue}>{comments}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

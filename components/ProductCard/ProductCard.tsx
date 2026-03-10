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
            <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
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

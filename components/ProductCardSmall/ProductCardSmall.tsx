import Link from 'next/link';
import styles from './ProductCardSmall.module.css';

export interface ProductCardSmallProps {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  collections?: number;
  likes?: number;
  comments?: number;
  /** Режим выбора в модалке: без перехода по ссылке, подсветка выбранного. */
  pickMode?: boolean;
  selected?: boolean;
  onPickToggle?: () => void;
}

function formatPrice(value: number): string {
  const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `~${formatted} ₽`;
}

export function ProductCardSmall({
  slug,
  name,
  price,
  imageUrl = '/images/placeholder.svg',
  collections = 5,
  likes = 180,
  comments = 180,
  pickMode,
  selected,
  onPickToggle,
}: ProductCardSmallProps) {
  const inner = (
    <>
      <img
        className={styles.productImg}
        src={imageUrl}
        alt=""
        width={130}
        height={140}
      />
      <div className={styles.productDetails}>
        <div className={styles.productTitles}>
          <span className={styles.productName}>{name}</span>
          <span className={styles.productPrice}>{formatPrice(price)}</span>
        </div>
        <div className={styles.productInteract}>
          <div className={styles.interactWrapper}>
            <div className={styles.interactItem}>
              <img
                src="/icons/collections.svg"
                alt=""
                width={20}
                height={20}
                className={styles.interactIcon}
              />
              <span className={styles.interactValue}>{collections}</span>
            </div>
            <div className={styles.interactItem}>
              <img
                src="/icons/heart.svg"
                alt=""
                width={20}
                height={20}
                className={styles.interactIcon}
              />
              <span className={styles.interactValue}>{likes}</span>
            </div>
            <div className={styles.interactItem}>
              <img
                src="/icons/message.svg"
                alt=""
                width={20}
                height={20}
                className={styles.interactIcon}
              />
              <span className={styles.interactValue}>{comments}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (pickMode) {
    return (
      <button
        type="button"
        className={`${styles.productCardSmall} ${styles.productCardPick} ${selected ? styles.productCardPickSelected : ''}`}
        onClick={onPickToggle}
        aria-pressed={selected}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/product/${slug}`} className={styles.productCardSmall}>
      {inner}
    </Link>
  );
}

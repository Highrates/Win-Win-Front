'use client';

import Link from 'next/link';
import { ProductPdpHeartInteract } from './ProductPdpSocialRow';
import styles from './ProductPageLeftColumn.module.css';

type Props = {
  productId: string;
  productTitleText: string;
  casesLinkedCount: number;
  likesDisplayCount: number;
  qaMessageCount: number;
  onQaClick?: () => void;
  brand: { name: string; href: string } | null;
};

export function ProductPageLeftColumn({
  productId,
  productTitleText,
  casesLinkedCount,
  likesDisplayCount,
  qaMessageCount,
  onQaClick,
  brand,
}: Props) {
  return (
    <div className={styles.productDetailsLeft}>
      <div className={styles.productDetailsInner}>
        <div className={styles.productTitles}>
          {brand ? (
            <Link href={brand.href} className={styles.productBrandName}>
              {brand.name}
            </Link>
          ) : (
            <span className={styles.productBrandName}>Бренд не указан</span>
          )}
          <h1 className={styles.productName}>{productTitleText}</h1>
        </div>
        <div className={styles.productDetailsInteract}>
          {casesLinkedCount > 0 ? (
            <Link
              href={`/projects?product=${encodeURIComponent(productId)}`}
              className={styles.productDetailsInteractItem}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <img
                src="/icons/collections.svg"
                alt=""
                width={20}
                height={20}
                className={styles.productDetailsInteractIcon}
              />
              <span className={styles.productDetailsInteractValue}>{casesLinkedCount}</span>
            </Link>
          ) : (
            <div className={styles.productDetailsInteractItem}>
              <img
                src="/icons/collections.svg"
                alt=""
                width={20}
                height={20}
                className={styles.productDetailsInteractIcon}
              />
              <span className={styles.productDetailsInteractValue}>0</span>
            </div>
          )}
          <ProductPdpHeartInteract productId={productId} likesDisplayCount={likesDisplayCount} />
          <button
            type="button"
            className={styles.productDetailsInteractItem}
            aria-label={
              qaMessageCount > 0
                ? `Задать вопрос по товару, ${qaMessageCount} сообщений`
                : 'Задать вопрос по товару'
            }
            onClick={() => onQaClick?.()}
          >
            <img
              src="/icons/message.svg"
              alt=""
              width={20}
              height={20}
              className={styles.productDetailsInteractIcon}
            />
            {qaMessageCount > 0 ? (
              <span className={styles.productDetailsInteractValue}>{qaMessageCount}</span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}

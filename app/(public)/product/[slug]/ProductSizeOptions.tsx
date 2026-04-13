'use client';

import Link from 'next/link';
import styles from './ProductPage.module.css';

export type ProductSizeOptionItem = {
  id: string;
  name: string;
  sizeSlug: string | null;
};

type Props = {
  productPath: string;
  sizes: ProductSizeOptionItem[];
  /** Выбранный размер (`?sz=`) */
  selectedSizeOptionId: string | null;
};

/** Кнопки размеров с `?sz=`; при одном размере блок не показывается на странице-родителе. */
export default function ProductSizeOptions({ productPath, sizes, selectedSizeOptionId }: Props) {
  if (sizes.length <= 1) return null;

  return (
    <div className={styles.productSizeSelect}>
      <span className={styles.productSizeTitle}>Размеры</span>
      <div className={styles.productSizeOptions} role="list">
        {sizes.map((s) => {
          const param = encodeURIComponent(s.sizeSlug?.trim() || s.id);
          const href = `${productPath}?sz=${param}`;
          const selected = selectedSizeOptionId === s.id;
          return (
            <Link
              key={s.id}
              href={href}
              scroll={false}
              role="listitem"
              className={`${styles.productSizeOption} ${selected ? styles.productSizeOptionSelected : ''}`}
              aria-current={selected ? 'true' : undefined}
            >
              {s.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ProductOrderSplit } from './ProductOrderSplit';
import styles from './ProductPdpPurchaseBlock.module.css';

const RECOMMENDATIONS_SECTION_ID = 'product-recommendations';

type ProductOrderSplitProps = React.ComponentProps<typeof ProductOrderSplit>;

type Props = {
  priceText: string;
  orderSplitProps: ProductOrderSplitProps;
  /** Доп. кнопки (чертёж / 3D) — только в desktop/mobile row, не в sticky. */
  secondaryActions?: ReactNode;
};

/** Одна сплит-кнопка заказа: inline на desktop, fixed sticky на mobile. */
export function ProductPdpPurchaseBlock({ priceText, orderSplitProps, secondaryActions }: Props) {
  const [recommendationsInView, setRecommendationsInView] = useState(false);

  useEffect(() => {
    const section = document.getElementById(RECOMMENDATIONS_SECTION_ID);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setRecommendationsInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.rightRow}>
      <span className={styles.price}>{priceText}</span>
      <div className={styles.btnsWrapper}>
        {secondaryActions}
        <div
          className={styles.stickyBar}
          data-hidden={recommendationsInView || undefined}
        >
          <span className={styles.stickyPrice}>{priceText}</span>
          <ProductOrderSplit {...orderSplitProps} inStickyBar menuOpensAbove />
        </div>
      </div>
    </div>
  );
}

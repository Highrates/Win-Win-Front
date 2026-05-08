'use client';

import { useEffect, useState, type ReactNode } from 'react';
import styles from './ProductPage.module.css';

type ProductDetailsStickyBarProps = {
  priceText: string;
  /** Сплит-кнопка «К заказу» + меню (мобильный sticky). */
  orderSplit: ReactNode;
};

const RECOMMENDATIONS_SECTION_ID = 'product-recommendations';

export function ProductDetailsStickyBar({ priceText, orderSplit }: ProductDetailsStickyBarProps) {
  const [recommendationsInView, setRecommendationsInView] = useState(false);

  useEffect(() => {
    const section = document.getElementById(RECOMMENDATIONS_SECTION_ID);
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setRecommendationsInView(entry.isIntersecting),
      { rootMargin: '0px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={styles.productDetailsStickyBar}
      data-hidden={recommendationsInView || undefined}
    >
      <span className={styles.productDetailsStickyPrice}>{priceText}</span>
      {orderSplit}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import styles from './ProductPage.module.css';

type ProductDetailsStickyBarProps = {
  priceText: string;
};

const RECOMMENDATIONS_SECTION_ID = 'product-recommendations';

export function ProductDetailsStickyBar({ priceText }: ProductDetailsStickyBarProps) {
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
      <Button variant="primary">Добавить к заказу</Button>
    </div>
  );
}

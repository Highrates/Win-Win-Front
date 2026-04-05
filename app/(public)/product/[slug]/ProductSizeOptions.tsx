'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';

const DEFAULT_SIZES = ['200 × 90 × 80 см', '220 × 95 × 85 см', '240 × 100 × 90 см'] as const;

export default function ProductSizeOptions({ items }: { items?: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const list = items?.length ? items : [...DEFAULT_SIZES];

  return (
    <div className={styles.productSizeOptions}>
      {list.map((label, index) => (
        <button
          type="button"
          key={`${label}-${index}`}
          className={`${styles.productSizeOption} ${selectedIndex === index ? styles.productSizeOptionSelected : ''}`}
          aria-pressed={selectedIndex === index}
          onClick={() => setSelectedIndex(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

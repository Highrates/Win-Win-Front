'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';

const SIZES = ['200 × 90 × 80 см', '220 × 95 × 85 см', '240 × 100 × 90 см'] as const;

export default function ProductSizeOptions() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className={styles.productSizeOptions}>
      {SIZES.map((label, index) => (
        <button
          type="button"
          key={label}
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

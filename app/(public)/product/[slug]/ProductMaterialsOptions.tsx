'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';

const MATERIALS = [
  'Натуральная кожа S-класса',
  'Ткань премиум',
  'Экокожа',
  'Велюр',
] as const;

export default function ProductMaterialsOptions() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className={styles.productMaterialsOptions}>
      {MATERIALS.map((label, index) => (
        <button
          type="button"
          key={label}
          className={`${styles.productMaterialsOption} ${selectedIndex === index ? styles.productMaterialsOptionSelected : ''}`}
          aria-pressed={selectedIndex === index}
          onClick={() => setSelectedIndex(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

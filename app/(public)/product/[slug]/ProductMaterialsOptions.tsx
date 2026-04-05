'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';

const DEFAULT_MATERIALS = [
  'Натуральная кожа S-класса',
  'Ткань премиум',
  'Экокожа',
  'Велюр',
] as const;

export default function ProductMaterialsOptions({ items }: { items?: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const list = items?.length ? items : [...DEFAULT_MATERIALS];

  return (
    <div className={styles.productMaterialsOptions}>
      {list.map((label, index) => (
        <button
          type="button"
          key={`${label}-${index}`}
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

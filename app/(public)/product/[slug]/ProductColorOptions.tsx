'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProductPage.module.css';

export type ProductColorItem = { name: string; imageUrl: string };

export default function ProductColorOptions({ items }: { items: ProductColorItem[] }) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = items[selectedIndex] ?? items[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(0);
    }
  }, [items.length, selectedIndex]);

  if (!items.length || !selected) return null;

  return (
    <div ref={rootRef} className={styles.productColorSelectRoot}>
      <button
        type="button"
        className={styles.productColorSelect}
        aria-expanded={open}
        aria-controls="product-color-listbox"
        aria-haspopup="listbox"
        id="product-color-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={styles.productColorSelectInner}>
          <img
            src={selected.imageUrl}
            alt=""
            width={70}
            height={70}
            className={styles.productColorSwatch}
          />
          <span className={styles.productColorName}>{selected.name}</span>
        </div>
        <span className={styles.productColorChevron} data-open={open || undefined} aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="5" viewBox="0 0 9 5" fill="none">
            <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          id="product-color-listbox"
          role="listbox"
          aria-labelledby="product-color-trigger"
          className={styles.productColorDropdown}
        >
          {items.map((item, index) => (
            <button
              type="button"
              key={`${item.name}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`${styles.productColorListOption} ${index === selectedIndex ? styles.productColorListOptionSelected : ''}`}
              onClick={() => {
                setSelectedIndex(index);
                setOpen(false);
              }}
            >
              <img
                src={item.imageUrl}
                alt=""
                width={48}
                height={48}
                className={styles.productColorListSwatch}
              />
              <span className={styles.productColorListName}>{item.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

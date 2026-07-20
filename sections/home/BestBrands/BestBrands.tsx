'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import Link from 'next/link';
import scrollStyles from '../ScrollCatalog/ScrollCatalog.module.css';
import styles from './BestBrands.module.css';

export type BestBrandsBrandItem = {
  slug: string;
  name: string;
  description: string;
  /** Превью товара (левая колонка) */
  productPreview: string;
  /** Lifestyle / обложка (правая колонка) */
  lifestyleImage: string;
};

export type BestBrandsProps = {
  brands: BestBrandsBrandItem[];
  activeBrandSlug?: string | null;
};

const FALLBACK_DESCRIPTION =
  'Продукция бренда представлена в нашем каталоге. Перейдите на страницу бренда, чтобы увидеть ассортимент.';

const MAX_VISIBLE_DOTS = 6;
const SWIPE_THRESHOLD_PX = 52;

function getVisibleDotIndices(total: number, activeIndex: number): number[] {
  if (total <= MAX_VISIBLE_DOTS) {
    return Array.from({ length: total }, (_, i) => i);
  }
  let start = activeIndex - Math.floor(MAX_VISIBLE_DOTS / 2);
  if (start < 0) start = 0;
  if (start + MAX_VISIBLE_DOTS > total) start = total - MAX_VISIBLE_DOTS;
  return Array.from({ length: MAX_VISIBLE_DOTS }, (_, i) => start + i);
}

export function BestBrands({ brands, activeBrandSlug }: BestBrandsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragAxisRef = useRef<'x' | 'y' | null>(null);

  useEffect(() => {
    if (activeBrandSlug == null) return;
    const idx = brands.findIndex((b) => b.slug === activeBrandSlug);
    if (idx >= 0) setActiveIndex(idx);
  }, [activeBrandSlug, brands]);

  const canNavigate = brands.length > 1;
  const brand = brands[activeIndex];
  const visibleDotIndices = getVisibleDotIndices(brands.length, activeIndex);

  useEffect(() => {
    if (!brand) return;
    for (const url of [brand.productPreview, brand.lifestyleImage]) {
      if (!url) continue;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  }, [brand]);

  function goPrev() {
    if (!canNavigate) return;
    setActiveIndex((i) => (i - 1 + brands.length) % brands.length);
  }

  function goNext() {
    if (!canNavigate) return;
    setActiveIndex((i) => (i + 1) % brands.length);
  }

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    if (!canNavigate) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragAxisRef.current = null;
    setDragX(0);
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (!canNavigate || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (dragAxisRef.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      dragAxisRef.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (dragAxisRef.current !== 'x') return;
    e.preventDefault();
    setDragX(dx);
  }

  function onTouchEnd() {
    if (!canNavigate) return;
    if (dragAxisRef.current === 'x') {
      if (dragX < -SWIPE_THRESHOLD_PX) goNext();
      else if (dragX > SWIPE_THRESHOLD_PX) goPrev();
    }
    touchStartRef.current = null;
    dragAxisRef.current = null;
    setDragX(0);
  }

  if (!brands.length || !brand) return null;

  return (
    <section className={styles.section} aria-label="Лучшие бренды">
      <div
        className={styles.split}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className={styles.infoCol}>
          <div className={`padding-global ${styles.infoPad}`}>
            <Link href={`/brands/${brand.slug}`} className={styles.infoLink}>
              <h3 className={styles.brandName}>{brand.name}</h3>
              <div className={styles.productPreviewWrap}>
                {brand.productPreview ? (
                  <img
                    className={styles.productPreview}
                    src={brand.productPreview}
                    alt=""
                    width={640}
                    height={480}
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  <span className={styles.productPreviewPlaceholder} aria-hidden />
                )}
              </div>
              <p className={styles.description}>
                {brand.description.trim() || FALLBACK_DESCRIPTION}
              </p>
            </Link>
          </div>
        </div>

        <div className={styles.lifestyleCol}>
          <Link href={`/brands/${brand.slug}`} className={styles.lifestyleLink} tabIndex={-1}>
            {brand.lifestyleImage ? (
              <img
                className={styles.lifestyleImage}
                src={brand.lifestyleImage}
                alt=""
                width={960}
                height={720}
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <span className={styles.lifestylePlaceholder} aria-hidden />
            )}
          </Link>
        </div>

        {canNavigate ? (
          <>
            <button
              type="button"
              className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowPrev} ${styles.navArrow} ${styles.navArrowPrev}`}
              aria-label="Предыдущий бренд"
              onClick={goPrev}
            >
              <img src="/icons/arrow.svg" alt="" className={styles.navArrowIcon} aria-hidden />
            </button>
            <button
              type="button"
              className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowNext} ${styles.navArrow} ${styles.navArrowNext}`}
              aria-label="Следующий бренд"
              onClick={goNext}
            >
              <img
                src="/icons/arrow.svg"
                alt=""
                className={styles.navArrowIconNext}
                aria-hidden
              />
            </button>
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <div className={styles.dots} role="tablist" aria-label="Бренды в подборке">
          {visibleDotIndices.map((index) => {
            const item = brands[index];
            return (
              <button
                key={item.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={item.name}
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`.trim()}
                onClick={() => setActiveIndex(index)}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

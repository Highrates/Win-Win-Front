'use client';

import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import Link from 'next/link';
import newsStyles from '../News/News.module.css';
import scrollStyles from '../ScrollCatalog/ScrollCatalog.module.css';
import styles from './BestBrands.module.css';

const brandPanelClasses = {
  brandPanelActive: styles.brandPanelActive,
  brandPanelHidden: styles.brandPanelHidden,
  brandPanelHiddenAfter: styles.brandPanelHiddenAfter,
  brandPanelHiddenBefore: styles.brandPanelHiddenBefore,
};

export type BestBrandsBrandItem = {
  slug: string;
  name: string;
  /** Уже разрешённые URL для img src */
  logo: string;
  description: string;
  galleryMain: string;
  gallerySide1: string;
  gallerySide2: string;
};

export type BestBrandsProps = {
  sectionTitle: string;
  brands: BestBrandsBrandItem[];
  /** Активный бренд в превью; по умолчанию — первый в списке. */
  activeBrandSlug?: string | null;
};

const FALLBACK_DESCRIPTION =
  'Продукция бренда представлена в нашем каталоге. Перейдите на страницу бренда, чтобы увидеть ассортимент.';

const MAX_VISIBLE_DOTS = 6;
const MOBILE_CARD_WIDTH_RATIO = 0.9;
const MOBILE_CARD_GAP_PX = 10;
const SWIPE_THRESHOLD_PX = 52;

function collectBrandImageUrls(brands: BestBrandsBrandItem[]): string[] {
  const urls: string[] = [];
  for (const brand of brands) {
    for (const url of [brand.logo, brand.galleryMain]) {
      if (url && !urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

function getVisibleDotIndices(total: number, activeIndex: number): number[] {
  if (total <= MAX_VISIBLE_DOTS) {
    return Array.from({ length: total }, (_, i) => i);
  }
  let start = activeIndex - Math.floor(MAX_VISIBLE_DOTS / 2);
  if (start < 0) start = 0;
  if (start + MAX_VISIBLE_DOTS > total) start = total - MAX_VISIBLE_DOTS;
  return Array.from({ length: MAX_VISIBLE_DOTS }, (_, i) => start + i);
}

function panelVisibilityClass(
  index: number,
  activeIndex: number,
  total: number,
  panelStyles: {
    brandPanelActive: string;
    brandPanelHidden: string;
    brandPanelHiddenAfter: string;
    brandPanelHiddenBefore: string;
  },
): string {
  if (index === activeIndex) return panelStyles.brandPanelActive;
  const forward = (index - activeIndex + total) % total;
  const backward = (activeIndex - index + total) % total;
  const hiddenDir =
    forward <= backward
      ? panelStyles.brandPanelHiddenAfter
      : panelStyles.brandPanelHiddenBefore;
  return `${panelStyles.brandPanelHidden} ${hiddenDir}`;
}

type BrandInfoPanelProps = {
  brand: BestBrandsBrandItem;
  panelClassName: string;
  ariaHidden?: boolean;
  style?: CSSProperties;
};

function BrandInfoPanel({ brand, panelClassName, ariaHidden, style }: BrandInfoPanelProps) {
  return (
    <div className={panelClassName} aria-hidden={ariaHidden} style={style}>
      <h3 className={styles.brandNameLarge}>{brand.name}</h3>
      <div className={styles.logoWrap}>
        {brand.logo ? (
          <img
            className={styles.brandLogo}
            src={brand.logo}
            alt=""
            width={240}
            height={240}
            decoding="async"
          />
        ) : (
          <span className={styles.logoPlaceholder} aria-hidden />
        )}
      </div>
      <div className={styles.brandDetailsFooter}>
        <p className={styles.brandDescription}>
          {brand.description.trim() || FALLBACK_DESCRIPTION}
        </p>
        <Link href={`/brands/${brand.slug}`} className={newsStyles.allNewsLink}>
          <span className={newsStyles.allNewsText}>Подробнее</span>
          <img
            src="/icons/arrow-right.svg"
            alt=""
            width={12}
            height={7}
            className={newsStyles.arrow}
          />
        </Link>
      </div>
    </div>
  );
}

export function BestBrands({ sectionTitle, brands, activeBrandSlug }: BestBrandsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragAxisRef = useRef<'x' | 'y' | null>(null);

  useEffect(() => {
    if (activeBrandSlug == null) return;
    const idx = brands.findIndex((b) => b.slug === activeBrandSlug);
    if (idx >= 0) setActiveIndex(idx);
  }, [activeBrandSlug, brands]);

  const canNavigate = brands.length > 1;
  const visibleDotIndices = getVisibleDotIndices(brands.length, activeIndex);

  useEffect(() => {
    for (const url of collectBrandImageUrls(brands)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  }, [brands]);

  function goPrev() {
    if (!canNavigate) return;
    setActiveIndex((i) => (i - 1 + brands.length) % brands.length);
  }

  function goNext() {
    if (!canNavigate) return;
    setActiveIndex((i) => (i + 1) % brands.length);
  }

  function onMobileTouchStart(e: TouchEvent<HTMLDivElement>) {
    if (!canNavigate) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragAxisRef.current = null;
    setIsDragging(true);
    setDragX(0);
  }

  function onMobileTouchMove(e: TouchEvent<HTMLDivElement>) {
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

  function onMobileTouchEnd() {
    if (!canNavigate) return;
    if (dragAxisRef.current === 'x') {
      if (dragX < -SWIPE_THRESHOLD_PX) goNext();
      else if (dragX > SWIPE_THRESHOLD_PX) goPrev();
    }
    touchStartRef.current = null;
    dragAxisRef.current = null;
    setIsDragging(false);
    setDragX(0);
  }

  const mobileTrackTransform = `translateX(calc(-${activeIndex} * (${MOBILE_CARD_WIDTH_RATIO * 100}vw + ${MOBILE_CARD_GAP_PX}px) + ${dragX}px))`;

  if (!brands.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div className={styles.wrapper}>
          <div className={styles.titlesWrapper}>
            <h5 className={styles.title}>{sectionTitle}</h5>
            <Link href="/brands" className={styles.allBrandsLink}>
              <span className={styles.allBrandsText}>Все бренды</span>
              <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
            </Link>
          </div>
          <div className={styles.previewBlock}>
            <div className={styles.previewHost}>
              <div className={styles.previewGrid}>
                <div className={styles.infoStackDesktop}>
                  {brands.map((brand, index) => (
                    <BrandInfoPanel
                      key={brand.slug}
                      brand={brand}
                      panelClassName={`${styles.infoPanel} ${panelVisibilityClass(
                        index,
                        activeIndex,
                        brands.length,
                        brandPanelClasses,
                      )}`}
                      ariaHidden={index !== activeIndex}
                    />
                  ))}
                </div>
                <div className={styles.imageStack}>
                  {brands.map((brand, index) => {
                    const panelClass = panelVisibilityClass(
                      index,
                      activeIndex,
                      brands.length,
                      brandPanelClasses,
                    );
                    return (
                      <div
                        key={brand.slug}
                        className={`${styles.imagePanel} ${panelClass}`}
                        aria-hidden={index !== activeIndex}
                      >
                        {brand.galleryMain ? (
                          <img
                            className={styles.brandHeroImage}
                            src={brand.galleryMain}
                            alt=""
                            width={680}
                            height={520}
                            decoding="async"
                            fetchPriority={brand.slug === brands[0]?.slug ? 'high' : 'low'}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder} aria-hidden />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={styles.mobileCarouselViewport}
                onTouchStart={onMobileTouchStart}
                onTouchMove={onMobileTouchMove}
                onTouchEnd={onMobileTouchEnd}
                onTouchCancel={onMobileTouchEnd}
              >
                <div
                  className={`${styles.mobileCarouselTrack} ${isDragging ? styles.mobileCarouselTrackDragging : ''}`}
                  style={{ transform: mobileTrackTransform }}
                >
                  {brands.map((brand, index) => (
                    <BrandInfoPanel
                      key={brand.slug}
                      brand={brand}
                      panelClassName={`${styles.infoPanel} ${styles.mobileCarouselCard} ${
                        index === activeIndex
                          ? styles.mobileCarouselCardActive
                          : styles.mobileCarouselCardPeek
                      }`.trim()}
                      ariaHidden={index !== activeIndex}
                    />
                  ))}
                </div>
              </div>

              {canNavigate ? (
                <>
                  <button
                    type="button"
                    className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowPrev} ${styles.previewArrow} ${styles.previewArrowPrev}`}
                    aria-label="Предыдущий бренд"
                    onClick={goPrev}
                  >
                    <img src="/icons/arrow.svg" alt="" className={styles.previewArrowIcon} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${scrollStyles.stripArrow} ${scrollStyles.stripArrowNext} ${styles.previewArrow} ${styles.previewArrowNext}`}
                    aria-label="Следующий бренд"
                    onClick={goNext}
                  >
                    <img
                      src="/icons/arrow.svg"
                      alt=""
                      className={styles.previewArrowIconNext}
                      aria-hidden
                    />
                  </button>
                </>
              ) : null}
            </div>
            {canNavigate ? (
              <div className={styles.dots} role="tablist" aria-label="Бренды в подборке">
                {visibleDotIndices.map((index) => {
                  const brand = brands[index];
                  return (
                    <button
                      key={brand.slug}
                      type="button"
                      role="tab"
                      aria-selected={index === activeIndex}
                      aria-label={brand.name}
                      className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`.trim()}
                      onClick={() => setActiveIndex(index)}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

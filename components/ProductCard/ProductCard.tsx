'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import { normalizeProductCardImageUrls, productCardImageOnError } from '@/lib/productCardImageUrls';
import styles from './ProductCard.module.css';

const SLIDE_MS = 380;

export interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  /** Диапазон цен (каталог / поиск по товару) */
  priceMin?: number;
  priceMax?: number;
  /** @deprecated Ссылка ведёт на товар без query */
  variantId?: string;
  /** Одно превью (как раньше) */
  imageUrl?: string;
  /** Несколько изображений для листания; если задано и непустое — имеет приоритет над imageUrl */
  imageUrls?: string[];
  /** id товара в каталоге — для ссылки на проекты с этим товаром */
  productId?: string;
  collections?: number;
  likes?: number;
  comments?: number;
  /** Сердце с обводкой: в ЛК при списке лайков или явное значение с сервера. */
  heartActive?: boolean;
  /** С `productId`: вызывать POST/DELETE лайка (по умолчанию true). */
  likesInteractive?: boolean;
  /** После успешного POST/DELETE лайка (серверные liked и likesDisplayCount). */
  onLikedChange?: (state: { liked: boolean; likesDisplayCount: number; productId: string }) => void;
}

function formatCardPrice(value: number, priceMin?: number, priceMax?: number): string {
  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (
    priceMin != null &&
    priceMax != null &&
    Number.isFinite(priceMin) &&
    Number.isFinite(priceMax) &&
    priceMax > priceMin
  ) {
    return `~${fmt(Math.round(priceMin))} ₽`;
  }
  const p = value > 0 ? value : priceMin ?? 0;
  if (p <= 0) return '—';
  return `~${fmt(Math.round(p))} ₽`;
}

export function ProductCard({
  slug,
  name,
  price,
  priceMin,
  priceMax,
  variantId,
  imageUrl,
  imageUrls,
  productId,
  collections = 0,
  likes = 0,
  comments = 180,
  heartActive,
  likesInteractive = true,
  onLikedChange,
}: ProductCardProps) {
  const urls = useMemo(() => normalizeProductCardImageUrls(imageUrl, imageUrls), [imageUrl, imageUrls]);
  const urlsKey = urls.join('\0');
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState<null | { from: number; to: number; dir: 'next' | 'prev' }>(null);
  const [slideRun, setSlideRun] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const blockLinkClickRef = useRef(false);

  const heartFilledControlled = heartActive !== undefined;
  const controlledInteractive = Boolean(
    productId && likesInteractive && heartFilledControlled,
  );
  const [controlledLiked, setControlledLiked] = useState(() => !!heartActive);
  useEffect(() => {
    if (controlledInteractive) setControlledLiked(!!heartActive);
  }, [heartActive, controlledInteractive]);

  const likeInteractive = !!(productId && likesInteractive);
  const onLikeMutationSuccess = useCallback(
    (s: { liked: boolean; likesDisplayCount: number; id: string }) => {
      onLikedChange?.({ liked: s.liked, likesDisplayCount: s.likesDisplayCount, productId: s.id });
    },
    [onLikedChange],
  );
  const like = useToggleLike({
    kind: 'product',
    id: productId,
    likesDisplayCount: likes,
    enabled: likeInteractive,
    mode: controlledInteractive ? 'controlled' : 'uncontrolled',
    controlledLiked: controlledInteractive ? controlledLiked : undefined,
    setControlledLiked: controlledInteractive ? setControlledLiked : undefined,
    onMutationSuccess: onLikedChange ? onLikeMutationSuccess : undefined,
  });

  const heartFilled =
    heartFilledControlled && !controlledInteractive
      ? !!heartActive
      : controlledInteractive
        ? controlledLiked
        : likeInteractive
          ? like.liked
          : false;

  const showLikesColumn = true;

  useEffect(() => {
    setIndex(0);
    setSlide(null);
    setSlideRun(false);
  }, [urlsKey]);

  const startSlide = useCallback(
    (delta: number) => {
      if (urls.length <= 1) return;
      if (slide !== null) return;
      const N = urls.length;
      const to = (index + delta + N) % N;
      if (to === index) return;
      setSlide({ from: index, to, dir: delta > 0 ? 'next' : 'prev' });
      setSlideRun(false);
    },
    [urls.length, index, slide],
  );

  useLayoutEffect(() => {
    if (!slide || slideRun) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSlideRun(true));
    });
    return () => cancelAnimationFrame(id);
  }, [slide, slideRun]);

  const handleSlideTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== 'transform') return;
      if (e.target !== e.currentTarget) return;
      if (!slide) return;
      setIndex(slide.to);
      setSlide(null);
      setSlideRun(false);
    },
    [slide],
  );

  const handleArrowClick = useCallback(
    (e: React.MouseEvent, delta: number) => {
      e.preventDefault();
      e.stopPropagation();
      startSlide(delta);
    },
    [startSlide],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null || urls.length <= 1) {
        touchStartX.current = null;
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const dx = endX - touchStartX.current;
      touchStartX.current = null;
      const threshold = 40;
      if (Math.abs(dx) < threshold) return;
      blockLinkClickRef.current = true;
      if (dx > 0) startSlide(-1);
      else startSlide(1);
      window.setTimeout(() => {
        blockLinkClickRef.current = false;
      }, SLIDE_MS + 80);
    },
    [startSlide, urls.length],
  );

  const handleImgAreaClickCapture = useCallback((e: React.MouseEvent) => {
    if (blockLinkClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const cardClassName = [
    styles.productCard,
    cardHovered && urls.length > 1 ? styles.productCardHover : '',
  ]
    .filter(Boolean)
    .join(' ');

  const gallery = urls.length > 1;

  const productHref = `/product/${encodeURIComponent(slug)}`;
  const projectsCollectionsHref =
    productId && collections > 0
      ? `/projects?product=${encodeURIComponent(productId)}`
      : null;

  return (
    <div
      className={cardClassName}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      <Link href={productHref} className={styles.productCardMainLink}>
      <div className={styles.productContent}>
        <div
          className={styles.productImgWrapper}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClickCapture={handleImgAreaClickCapture}
        >
          {!gallery ? (
            <img
              className={styles.productImg}
              src={urls[0]}
              alt=""
              draggable={false}
              onError={productCardImageOnError}
            />
          ) : !slide ? (
            <img
              className={styles.productImg}
              src={urls[index]}
              alt=""
              draggable={false}
              onError={productCardImageOnError}
            />
          ) : (
            <div className={styles.imgSlideWrap}>
              <div
                className={styles.imgSlideStrip}
                data-dir={slide.dir}
                data-run={slideRun ? '1' : undefined}
                onTransitionEnd={handleSlideTransitionEnd}
              >
                {slide.dir === 'next' ? (
                  <>
                    <div className={styles.imgSlideCell}>
                      <img
                        className={styles.productImg}
                        src={urls[slide.from]}
                        alt=""
                        draggable={false}
                        onError={productCardImageOnError}
                      />
                    </div>
                    <div className={styles.imgSlideCell}>
                      <img
                        className={styles.productImg}
                        src={urls[slide.to]}
                        alt=""
                        draggable={false}
                        onError={productCardImageOnError}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.imgSlideCell}>
                      <img
                        className={styles.productImg}
                        src={urls[slide.to]}
                        alt=""
                        draggable={false}
                        onError={productCardImageOnError}
                      />
                    </div>
                    <div className={styles.imgSlideCell}>
                      <img
                        className={styles.productImg}
                        src={urls[slide.from]}
                        alt=""
                        draggable={false}
                        onError={productCardImageOnError}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {gallery ? (
            <>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowPrev}`}
                aria-label="Предыдущее изображение"
                onClick={(e) => handleArrowClick(e, -1)}
              >
                <img src="/icons/arrow.svg" alt="" className={styles.galleryArrowIcon} aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowNext}`}
                aria-label="Следующее изображение"
                onClick={(e) => handleArrowClick(e, 1)}
              >
                <img src="/icons/arrow.svg" alt="" className={styles.galleryArrowIconNext} aria-hidden />
              </button>
            </>
          ) : null}
        </div>
        <div className={styles.productTitles}>
          <span className={styles.productName}>{name}</span>
          <span className={styles.productPrice}>{formatCardPrice(price, priceMin, priceMax)}</span>
        </div>
      </div>
      </Link>
      <div className={styles.productInteract}>
        <div className={styles.interactWrapper}>
          {projectsCollectionsHref ? (
            <Link
              href={projectsCollectionsHref}
              className={`${styles.interactItem} ${styles.interactItemLink}`}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
            >
              <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.interactIcon} />
              <span className={styles.interactValue}>{collections}</span>
            </Link>
          ) : (
            <div className={styles.interactItem}>
              <img src="/icons/collections.svg" alt="" width={20} height={20} className={styles.interactIcon} />
              <span className={styles.interactValue}>{collections}</span>
            </div>
          )}
          {showLikesColumn ? (
            like.auth !== true ? (
              <button
                type="button"
                className={styles.interactItem}
                disabled
                aria-disabled="true"
                aria-label="Войдите, чтобы поставить лайк"
              >
                <LikeHeartSvg className={styles.interactIcon} />
                <span className={styles.interactValue}>{Math.max(0, likes)}</span>
              </button>
            ) : !productId || !likesInteractive ? (
              <div className={styles.interactItem}>
                <LikeHeartSvg
                  active={heartFilled}
                  className={heartFilled ? styles.heartIconActive : styles.interactIcon}
                />
                <span className={styles.interactValue}>{Math.max(0, like.count)}</span>
              </div>
            ) : (
              <button
                type="button"
                className={styles.interactItem}
                disabled={like.busy || (!controlledInteractive && !like.interactiveReady)}
                aria-label={heartFilled ? 'Убрать лайк' : 'Поставить лайк'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void like.toggle();
                }}
              >
                <LikeHeartSvg
                  active={heartFilled}
                  className={heartFilled ? styles.heartIconActive : styles.interactIcon}
                />
                <span className={styles.interactValue}>{Math.max(0, like.count)}</span>
              </button>
            )
          ) : null}
          <div className={styles.interactItem}>
            <img src="/icons/message.svg" alt="" width={20} height={20} className={styles.interactIcon} />
            <span className={styles.interactValue}>{comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { normalizeProductCardImageUrls, productCardImageOnError } from '@/lib/productCardImageUrls';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
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
  /** Иконка избранного с обводкой (страница «Избранное» в ЛК или явное значение). */
  heartActive?: boolean;
  /** С `productId`: вызывать POST/DELETE лайка (по умолчанию true). */
  likesInteractive?: boolean;
  /** После успешного POST/DELETE лайка (для сброса списка избранного и т.п.). */
  onLikedChange?: (liked: boolean) => void;
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
  const router = useRouter();
  const urls = useMemo(() => normalizeProductCardImageUrls(imageUrl, imageUrls), [imageUrl, imageUrls]);
  const urlsKey = urls.join('\0');
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState<null | { from: number; to: number; dir: 'next' | 'prev' }>(null);
  const [slideRun, setSlideRun] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [likedFromApi, setLikedFromApi] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState(likes);
  const [likeBusy, setLikeBusy] = useState(false);
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

  const heartFilled =
    heartFilledControlled && !controlledInteractive
      ? !!heartActive
      : controlledInteractive
        ? controlledLiked
        : !!likedFromApi;

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await getCachedIsAuthenticated();
      if (cancelled) return;
      setAuth(ok);
      if (!ok || !productId || !likesInteractive || heartFilledControlled) return;
      try {
        const res = await fetch(`/api/user/likes/products/${encodeURIComponent(productId)}/me`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const j = (await res.json()) as { liked?: boolean };
        if (!cancelled) setLikedFromApi(j.liked === true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, likesInteractive, heartFilledControlled]);

  const showLikesColumn = auth === true;

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
            !productId || !likesInteractive ? (
              <div className={styles.interactItem}>
                {heartFilled ? (
                  <svg
                    className={styles.heartIconActive}
                    width={20}
                    height={20}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
                )}
                <span className={styles.interactValue}>{Math.max(0, likeCount)}</span>
              </div>
            ) : (
              <button
                type="button"
                className={styles.interactItem}
                disabled={
                  likeBusy ||
                  (controlledInteractive ? false : likedFromApi === null)
                }
                aria-label={heartFilled ? 'Убрать из избранного' : 'Добавить в избранное'}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const ok = auth ?? (await getCachedIsAuthenticated());
                  if (!ok) {
                    router.push('/login');
                    return;
                  }
                  const currentLiked = controlledInteractive ? controlledLiked : likedFromApi === true;
                  if (!controlledInteractive && likedFromApi === null) return;
                  setLikeBusy(true);
                  const nextLiked = !currentLiked;
                  const prevCount = likeCount;
                  if (controlledInteractive) setControlledLiked(nextLiked);
                  else setLikedFromApi(nextLiked);
                  setLikeCount((c) => c + (nextLiked ? 1 : -1));
                  try {
                    const res = await fetch(
                      `/api/user/likes/products/${encodeURIComponent(productId!)}`,
                      {
                        method: nextLiked ? 'POST' : 'DELETE',
                        credentials: 'same-origin',
                      },
                    );
                    if (!res.ok) {
                      if (controlledInteractive) setControlledLiked(currentLiked);
                      else setLikedFromApi(currentLiked);
                      setLikeCount(prevCount);
                    } else {
                      onLikedChange?.(nextLiked);
                    }
                  } catch {
                    if (controlledInteractive) setControlledLiked(currentLiked);
                    else setLikedFromApi(currentLiked);
                    setLikeCount(prevCount);
                  } finally {
                    setLikeBusy(false);
                  }
                }}
              >
                {heartFilled ? (
                  <svg
                    className={styles.heartIconActive}
                    width={20}
                    height={20}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
                )}
                <span className={styles.interactValue}>{Math.max(0, likeCount)}</span>
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

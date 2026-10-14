'use client';

import Link from 'next/link';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import type { ProjectsFeedSourceParam } from '@/lib/projectsListingUrl';
import styles from './ProjectsPage.module.css';

const SOURCE_OPTIONS: { id: ProjectsFeedSourceParam; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'designers', label: 'Дизайнеры' },
  { id: 'brands', label: 'Бренды' },
];

type Props = {
  /** «Все» + помещения из выкладки. */
  roomChips: string[];
  activeLabel: string;
  onActiveChange: (label: string) => void;
  /** Фильтр по товару из query `?product=` */
  productFilter?: { id: string; label: string } | null;
  /** Фильтр по бренду из query `?brand=` */
  brandFilter?: { slug: string; label: string } | null;
  /** Дизайнерские кейсы с товарами бренда `?productBrand=` */
  productBrandFilter?: { slug: string; label: string } | null;
  withProducts: boolean;
  onWithProductsChange: (value: boolean) => void;
  source: ProjectsFeedSourceParam;
  onSourceChange: (source: ProjectsFeedSourceParam) => void;
  /** Скрыть сегмент, если источник задан query (`brand` / `productBrand`). */
  sourceLocked?: boolean;
};

function projectsHref(params: {
  product?: string | null;
  brand?: string | null;
  productBrand?: string | null;
  source?: string | null;
}): string {
  const qs = new URLSearchParams();
  if (params.product?.trim()) qs.set('product', params.product.trim());
  if (params.brand?.trim()) qs.set('brand', params.brand.trim());
  if (params.productBrand?.trim()) qs.set('productBrand', params.productBrand.trim());
  if (params.source?.trim()) qs.set('source', params.source.trim());
  const s = qs.toString();
  return s ? `/projects?${s}` : '/projects';
}

export function ProjectsRoomFilter({
  roomChips,
  activeLabel,
  onActiveChange,
  productFilter,
  brandFilter,
  productBrandFilter,
  withProducts,
  onWithProductsChange,
  source,
  onSourceChange,
  sourceLocked = false,
}: Props) {
  const tabs = roomChips.map((label) => ({ id: label, label }));

  const clearProductHref = projectsHref({
    brand: brandFilter?.slug,
    productBrand: productBrandFilter?.slug,
    source: productBrandFilter ? 'designers' : null,
  });
  const clearBrandHref = projectsHref({
    product: productFilter?.id,
    productBrand: productBrandFilter?.slug,
    source: productBrandFilter ? 'designers' : null,
  });
  const clearProductBrandHref = projectsHref({
    product: productFilter?.id,
    brand: brandFilter?.slug,
  });

  return (
    <div className={styles.marketRoomToolbar}>
      {productFilter || brandFilter || productBrandFilter ? (
        <div className={styles.marketProductFilterRow}>
          {productFilter ? (
            <div className={styles.marketProductFilterChip}>
              <span className={styles.marketProductFilterLabel} title={productFilter.label}>
                {productFilter.label}
              </span>
              <Link
                href={clearProductHref}
                className={styles.marketProductFilterClear}
                aria-label="Сбросить фильтр по товару"
                prefetch={false}
              >
                ×
              </Link>
            </div>
          ) : null}
          {brandFilter ? (
            <div className={styles.marketProductFilterChip}>
              <span className={styles.marketProductFilterLabel} title={brandFilter.label}>
                {brandFilter.label}
              </span>
              <Link
                href={clearBrandHref}
                className={styles.marketProductFilterClear}
                aria-label="Сбросить фильтр по бренду"
                prefetch={false}
              >
                ×
              </Link>
            </div>
          ) : null}
          {productBrandFilter ? (
            <div className={styles.marketProductFilterChip}>
              <span className={styles.marketProductFilterLabel} title={productBrandFilter.label}>
                {productBrandFilter.label}
              </span>
              <Link
                href={clearProductBrandHref}
                className={styles.marketProductFilterClear}
                aria-label="Сбросить фильтр по товарам бренда"
                prefetch={false}
              >
                ×
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.marketRoomToolbarRow}>
        {tabs.length > 0 ? (
          <UnderlineTabs
            ariaLabel="Фильтр по помещению"
            tabs={tabs}
            activeId={activeLabel}
            onSelect={onActiveChange}
            className={styles.marketRoomTabs}
          />
        ) : (
          <div className={styles.marketRoomTabs} aria-hidden />
        )}

        <div className={styles.marketRoomToolbarEnd}>
          <label className={styles.withProductsSwitch}>
            <input
              type="checkbox"
              role="switch"
              className={styles.withProductsSwitchInput}
              checked={withProducts}
              onChange={(e) => onWithProductsChange(e.target.checked)}
              aria-checked={withProducts}
            />
            <span className={styles.withProductsSwitchTrack} aria-hidden>
              <span className={styles.withProductsSwitchThumb} />
            </span>
            <span className={styles.withProductsSwitchLabel}>с товарами</span>
          </label>

          {!sourceLocked ? (
            <div className={styles.sourceSegment} role="radiogroup" aria-label="Источник проектов">
              {SOURCE_OPTIONS.map((opt) => {
                const selected = source === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.sourceSegmentBtn} ${
                      selected ? styles.sourceSegmentBtnActive : ''
                    }`}
                    onClick={() => onSourceChange(opt.id)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

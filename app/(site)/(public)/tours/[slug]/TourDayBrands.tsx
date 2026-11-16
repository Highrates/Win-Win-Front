'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import { BrandAboutSheetContent } from '@/app/(site)/(public)/brands/[slug]/BrandAboutSheetContent';
import { tourImageUnoptimized } from '@/lib/chinaTours/tourImage';
import type { ChinaTourDetailDayBrand } from '@/lib/chinaTours/types';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import styles from './tourDetail.module.css';

type Props = {
  brands: ChinaTourDetailDayBrand[];
};

function canOpenAbout(b: ChinaTourDetailDayBrand): boolean {
  return Boolean(
    b.slug &&
      (b.hasAbout ||
        b.shortDescription?.trim() ||
        b.logoUrl?.trim() ||
        b.galleryUrls.length > 0 ||
        b.siteUrl?.trim() ||
        b.catalogPdfUrl?.trim()),
  );
}

export function TourDayBrands({ brands }: Props) {
  const list = useMemo(() => brands.filter((b) => b.name.trim()), [brands]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = list.find((b) => b.id === activeId) ?? null;

  const close = useCallback(() => setActiveId(null), []);

  if (list.length === 0) return null;

  const logoSrc = active?.logoUrl ? resolveMediaUrlForClient(active.logoUrl) : null;
  const galleryUrls = (active?.galleryUrls ?? []).map((u) => resolveMediaUrlForClient(u));
  const pdfHref = active?.catalogPdfUrl
    ? resolveMediaUrlForClient(active.catalogPdfUrl)
    : null;

  return (
    <div className={styles.dayBrands}>
      <p className={`h5 ${styles.dayBrandsLabel}`}>Фабрики дня</p>
      <ul className={styles.dayBrandList}>
        {list.map((b) => {
          const openable = canOpenAbout(b);
          const thumb = b.logoUrl ? resolveMediaUrlForClient(b.logoUrl) : null;
          const content = (
            <>
              {thumb ? (
                <Image
                  className={styles.dayBrandLogo}
                  src={thumb}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  unoptimized={tourImageUnoptimized(thumb)}
                />
              ) : (
                <span className={styles.dayBrandLogoFallback} aria-hidden>
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className={styles.dayBrandName}>{b.name}</span>
            </>
          );

          return (
            <li key={b.id}>
              {openable ? (
                <button
                  type="button"
                  className={styles.dayBrandChip}
                  onClick={() => setActiveId(b.id)}
                  aria-label={`Подробнее о бренде ${b.name}`}
                >
                  {content}
                </button>
              ) : (
                <span className={`${styles.dayBrandChip} ${styles.dayBrandChipStatic}`}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <SideSheetModal
        open={Boolean(active)}
        onClose={close}
        title={active?.name ?? 'Бренд'}
        srTitle={active ? `Ещё о бренде: ${active.name}` : 'Бренд'}
      >
        {active ? (
          <BrandAboutSheetContent
            brandName={active.name}
            bodyHtml={active.descriptionHtml}
            shortDescription={active.shortDescription}
            logoUrl={logoSrc}
            siteUrl={active.siteUrl}
            galleryUrls={galleryUrls}
            catalogPdfHref={pdfHref}
          />
        ) : null}
      </SideSheetModal>
    </div>
  );
}

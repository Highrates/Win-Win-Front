'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './BestBrands.module.css';

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
};

const FALLBACK_DESCRIPTION =
  'Продукция бренда представлена в нашем каталоге. Перейдите на страницу бренда, чтобы увидеть ассортимент.';

export function BestBrands({ sectionTitle, brands }: BestBrandsProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const activeBrand = useMemo(() => {
    const slug = hoveredSlug ?? brands[0]?.slug;
    return brands.find((b) => b.slug === slug) ?? brands[0];
  }, [hoveredSlug, brands]);

  if (!brands.length || !activeBrand) {
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
          <div className={styles.twoColGrid}>
            <div className={styles.leftCol}>
              <div className={styles.brandDetails}>
                <img
                  className={styles.brandDetailsLogo}
                  src={activeBrand.logo}
                  alt=""
                  width={32}
                  height={32}
                />
                <h3 className={styles.brandDetailsName}>{activeBrand.name}</h3>
                <p className={styles.brandDetailsDescription}>
                  {activeBrand.description.trim() || FALLBACK_DESCRIPTION}
                </p>
              </div>
              <div className={styles.brandGallery}>
                <img
                  className={styles.brandGalleryMain}
                  src={activeBrand.galleryMain}
                  alt=""
                  width={340}
                  height={424}
                />
                <div className={styles.brandGallerySide}>
                  <img
                    className={styles.brandGallerySideImg}
                    src={activeBrand.gallerySide1}
                    alt=""
                    width={340}
                    height={204}
                  />
                  <img
                    className={styles.brandGallerySideImg}
                    src={activeBrand.gallerySide2}
                    alt=""
                    width={340}
                    height={204}
                  />
                </div>
              </div>
            </div>
            <div className={styles.wrapperDetails} onMouseLeave={() => setHoveredSlug(null)}>
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className={styles.brandItem}
                  onMouseEnter={() => setHoveredSlug(brand.slug)}
                >
                  <span className={styles.brandName}>{brand.name}</span>
                  <img src="/icons/arrow-right.svg" alt="" width={16} height={8} className={styles.brandArrow} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

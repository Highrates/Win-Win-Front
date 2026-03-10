'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './BestBrands.module.css';

const BRANDS_MOCK: Array<{
  name: string;
  logo: string;
  description: string;
  galleryMain: string;
  gallerySide1: string;
  gallerySide2: string;
}> = [
  { name: 'Adidas', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Nike', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Zara', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'H&M', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Gucci', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Puma', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Uniqlo', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Massimo Dutti', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Reserved', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
  { name: 'Bershka', logo: '/images/placeholder.svg', description: 'Продукция компании охватывает все жилые зоны, такие как гостиная, чайная комната, столовая, спальня и кабинет и включает различные виды мебели, такие как диваны, чайные столики, обеденные столы и кровати.', galleryMain: '/images/placeholder.svg', gallerySide1: '/images/placeholder.svg', gallerySide2: '/images/placeholder.svg' },
];

export function BestBrands() {
  const [hoveredBrandName, setHoveredBrandName] = useState<string | null>(null);

  const activeBrand = useMemo(() => {
    const name = hoveredBrandName ?? BRANDS_MOCK[0].name;
    return BRANDS_MOCK.find((b) => b.name === name) ?? BRANDS_MOCK[0];
  }, [hoveredBrandName]);

  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div className={styles.wrapper}>
          <div className={styles.titlesWrapper}>
            <h5 className={styles.title}>Лучшие бренды месяца</h5>
            <Link href="/brands" className={styles.allBrandsLink}>
              <span className={styles.allBrandsText}>Все бренды</span>
              <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
            </Link>
          </div>
          <div className={styles.twoColGrid}>
            <div className={styles.leftCol}>
              <div className={styles.brandDetails}>
                <img className={styles.brandDetailsLogo} src={activeBrand.logo} alt="" width={32} height={32} />
                <h3 className={styles.brandDetailsName}>{activeBrand.name}</h3>
                <p className={styles.brandDetailsDescription}>{activeBrand.description}</p>
              </div>
              <div className={styles.brandGallery}>
                <img className={styles.brandGalleryMain} src={activeBrand.galleryMain} alt="" width={340} height={424} />
                <div className={styles.brandGallerySide}>
                  <img className={styles.brandGallerySideImg} src={activeBrand.gallerySide1} alt="" width={340} height={204} />
                  <img className={styles.brandGallerySideImg} src={activeBrand.gallerySide2} alt="" width={340} height={204} />
                </div>
              </div>
            </div>
            <div className={styles.wrapperDetails} onMouseLeave={() => setHoveredBrandName(null)}>
              {BRANDS_MOCK.map((brand) => (
                <Link
                  key={brand.name}
                  href={`/brands/${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={styles.brandItem}
                  onMouseEnter={() => setHoveredBrandName(brand.name)}
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

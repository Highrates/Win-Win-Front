'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PublicBrandProductRow } from '@/lib/brandsPublic';
import { productPriceToNumber } from '@/lib/brandsPublic';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import type { HomeProductRailSection } from '@/lib/home/mapHomeSections';
import type { RecommendationsStaticItem } from '@/sections/home/Recommendations/recommendationsStaticItem';
import { HomeProductCollections } from '@/sections/home/HomeProductCollections';
import { HomeProductLikesScope } from '@/sections/home/HomeProductLikesScope';
import styles from './CatalogHubCollections.module.css';

type ApiSection = {
  kind: 'collection' | 'set';
  slug: string;
  name: string;
  products: PublicBrandProductRow[];
};

function mapRowsToItems(rows: PublicBrandProductRow[]): RecommendationsStaticItem[] {
  return rows.map((p) => {
    const ordered = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const galleryUrls = ordered.map((im) => resolveMediaUrlForClient(im.url));
    const useGallery = galleryUrls.length > 1;
    const title = (p.displayName ?? p.name).trim() || p.name;
    return {
      slug: p.slug,
      name: title,
      price: productPriceToNumber(p.price),
      variantId: p.variantId ?? undefined,
      imageUrl: galleryUrls[0] ?? '/images/placeholder.svg',
      imageUrls: useGallery ? galleryUrls : undefined,
      productId: p.id,
      collections: typeof p.casesLinkedCount === 'number' ? p.casesLinkedCount : 0,
      likes: typeof p.likesDisplayCount === 'number' ? p.likesDisplayCount : 0,
      likedByMe: p.likedByMe,
    };
  });
}

function mapApiSections(items: ApiSection[]): HomeProductRailSection[] {
  const sections: HomeProductRailSection[] = [];
  for (const section of items) {
    if (!section.products?.length) continue;
    const mappedItems = mapRowsToItems(section.products);
    if (!mappedItems.length) continue;
    sections.push({
      title: section.name,
      items: mappedItems,
      advanceGalleryOnScroll: true,
      progressiveLoad: true,
    });
  }
  return sections;
}

export function CatalogHubCollectionsLazy() {
  const [sections, setSections] = useState<HomeProductRailSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/catalog/collections-and-sets');
        if (!res.ok) throw new Error('fetch failed');
        const data = (await res.json()) as { items?: ApiSection[] };
        if (cancelled) return;
        setSections(mapApiSections(Array.isArray(data.items) ? data.items : []));
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allItems = useMemo(
    () => (sections ?? []).reduce<RecommendationsStaticItem[]>((acc, s) => acc.concat(s.items), []),
    [sections],
  );

  if (loading) {
    return (
      <div className="padding-global">
        <p className={styles.empty}>Загрузка коллекций…</p>
      </div>
    );
  }

  if (failed || !sections?.length) {
    return (
      <div className="padding-global">
        <p className={styles.empty}>Коллекции и наборы пока не настроены.</p>
      </div>
    );
  }

  return (
    <HomeProductLikesScope items={allItems}>
      <HomeProductCollections sections={sections} />
    </HomeProductLikesScope>
  );
}

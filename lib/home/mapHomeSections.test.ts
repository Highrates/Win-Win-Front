import { describe, expect, it } from 'vitest';
import {
  mapHomeCuratedSections,
  mapHomeRail,
  type HomeCuratedProductRail,
} from './mapHomeSections';

function rail(
  partial: Pick<HomeCuratedProductRail, 'slug' | 'name' | 'homeOrder' | 'homeGridSize'> & {
    productCount?: number;
  },
): HomeCuratedProductRail {
  const n = partial.productCount ?? 1;
  return {
    slug: partial.slug,
    name: partial.name,
    homeOrder: partial.homeOrder,
    homeGridSize: partial.homeGridSize,
    products: Array.from({ length: n }, (_, i) => ({
      id: `${partial.slug}-p${i}`,
      slug: `${partial.slug}-p${i}`,
      name: `Product ${i}`,
      price: 1000,
      currency: 'RUB',
      images: [],
    })),
  };
}

describe('mapHomeRail', () => {
  it('returns null for empty products', () => {
    expect(
      mapHomeRail({
        slug: 'empty',
        name: 'Empty',
        homeOrder: 1,
        homeGridSize: 'FOUR',
        products: [],
      }),
    ).toBeNull();
  });

  it('sets progressiveLoad only for UNLIMITED', () => {
    const four = mapHomeRail(rail({ slug: 'a', name: 'A', homeOrder: 1, homeGridSize: 'FOUR' }));
    const unlimited = mapHomeRail(
      rail({ slug: 'b', name: 'B', homeOrder: 3, homeGridSize: 'UNLIMITED' }),
    );
    expect(four?.progressiveLoad).toBe(false);
    expect(unlimited?.progressiveLoad).toBe(true);
    expect(four?.advanceGalleryOnScroll).toBe(false);
    expect(four?.allHref).toBe('/collections/a');
  });
});

describe('mapHomeCuratedSections slot bucketing', () => {
  it('buckets homeOrder 1 / 2 / 3+ into afterBestBrands / afterNews / afterTours', () => {
    const sections = mapHomeCuratedSections({
      brandCollection: null,
      homeRails: [
        rail({ slug: 'slot1', name: 'One', homeOrder: 1, homeGridSize: 'FOUR' }),
        rail({ slug: 'slot2', name: 'Two', homeOrder: 2, homeGridSize: 'EIGHT' }),
        rail({ slug: 'slot3', name: 'Three', homeOrder: 3, homeGridSize: 'FOUR' }),
        rail({ slug: 'slot5', name: 'Five', homeOrder: 5, homeGridSize: 'UNLIMITED' }),
        rail({
          slug: 'empty',
          name: 'Empty',
          homeOrder: 1,
          homeGridSize: 'FOUR',
          productCount: 0,
        }),
      ],
    });

    expect(sections.afterBestBrands.map((r) => r.homeOrder)).toEqual([1]);
    expect(sections.afterNews.map((r) => r.homeOrder)).toEqual([2]);
    expect(sections.afterTours.map((r) => r.homeOrder)).toEqual([3, 5]);
    expect(sections.bestBrands).toBeNull();
    expect(sections.allRecommendationItems.length).toBe(4);
  });
});

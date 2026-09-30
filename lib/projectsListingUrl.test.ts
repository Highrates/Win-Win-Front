import { describe, expect, it } from 'vitest';
import {
  chipsFromFeedSource,
  feedSourceFromChips,
  nextProjectsSearchWithSource,
} from './projectsListingUrl';
import {
  parseProjectsFeedPayload,
  resolveProjectsFeedSource,
} from './publicProjectsListing';

describe('projectsListingUrl', () => {
  it('maps source param to chips', () => {
    expect(chipsFromFeedSource('all')).toEqual({ designers: true, brands: true });
    expect(chipsFromFeedSource('designers')).toEqual({ designers: true, brands: false });
    expect(chipsFromFeedSource('brands')).toEqual({ designers: false, brands: true });
  });

  it('writes ?source= when toggling to one chip', () => {
    expect(nextProjectsSearchWithSource('', { designers: true, brands: false })).toBe(
      '?source=designers',
    );
    expect(
      nextProjectsSearchWithSource('?brand=acme&product=1', { designers: false, brands: true }),
    ).toBe('?brand=acme&product=1&source=brands');
  });

  it('removes source when both chips on (all)', () => {
    expect(
      nextProjectsSearchWithSource('?source=designers', { designers: true, brands: true }),
    ).toBe('');
  });

  it('does not rewrite URL when both chips off', () => {
    expect(nextProjectsSearchWithSource('?source=brands', { designers: false, brands: false })).toBe(
      null,
    );
  });

  it('writes source=brands so shareable URL survives refresh', () => {
    expect(feedSourceFromChips({ designers: false, brands: true })).toBe('brands');
    expect(nextProjectsSearchWithSource('', { designers: false, brands: true })).toBe(
      '?source=brands',
    );
    expect(nextProjectsSearchWithSource('?source=brands', { designers: true, brands: true })).toBe(
      '',
    );
  });
});

describe('publicProjectsListing feed', () => {
  it('resolveProjectsFeedSource prefers brand slug', () => {
    expect(resolveProjectsFeedSource({ brandSlug: 'x', source: 'designers' })).toBe('brands');
  });

  it('parseProjectsFeedPayload maps designer + brand rows', () => {
    const parsed = parseProjectsFeedPayload({
      total: 2,
      rooms: ['Кухня'],
      items: [
        {
          id: 'c1',
          title: 'D',
          shortDescription: null,
          descriptionHtml: null,
          coverLayout: '9:16',
          coverImageUrls: ['https://x/a.jpg'],
          roomTypes: ['Кухня'],
          products: [],
          likesDisplayCount: 0,
          designerSlug: 'anna',
          designerDisplayName: 'Anna',
          designerPhotoUrl: null,
        },
        {
          id: 'c2',
          title: 'B',
          shortDescription: null,
          descriptionHtml: null,
          coverLayout: '9:16',
          coverImageUrls: [],
          roomTypes: [],
          products: [],
          likesDisplayCount: 0,
          brandSlug: 'acme',
          brandDisplayName: 'Acme',
          brandLogoUrl: null,
        },
      ],
    });
    expect(parsed.total).toBe(2);
    expect(parsed.rooms).toEqual(['Кухня']);
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.projects[0]?.designer?.slug).toBe('anna');
    expect(parsed.projects[1]?.brand?.slug).toBe('acme');
  });

  it('skips rows without designer or brand', () => {
    const parsed = parseProjectsFeedPayload({
      items: [
        {
          id: 'x',
          title: 'orphan',
          shortDescription: null,
          descriptionHtml: null,
          coverLayout: null,
          coverImageUrls: null,
          roomTypes: null,
          products: [],
          likesDisplayCount: 0,
        },
      ],
      total: 1,
    });
    expect(parsed.projects).toEqual([]);
  });
});

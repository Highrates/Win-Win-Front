import { describe, expect, it } from 'vitest';
import { nextProjectsSearchWithSource } from './projectsListingUrl';
import {
  parseProjectsFeedPayload,
  resolveProjectsFeedSource,
} from './publicProjectsListing';

describe('projectsListingUrl', () => {
  it('writes ?source= when selecting designers or brands', () => {
    expect(nextProjectsSearchWithSource('', 'designers')).toBe('?source=designers');
    expect(nextProjectsSearchWithSource('?brand=acme&product=1', 'brands')).toBe(
      '?brand=acme&product=1&source=brands',
    );
  });

  it('removes source when selecting all', () => {
    expect(nextProjectsSearchWithSource('?source=designers', 'all')).toBe('');
  });

  it('does not rewrite URL when already all without source param', () => {
    expect(nextProjectsSearchWithSource('', 'all')).toBe(null);
  });

  it('writes source=brands so shareable URL survives refresh', () => {
    expect(nextProjectsSearchWithSource('', 'brands')).toBe('?source=brands');
    expect(nextProjectsSearchWithSource('?source=brands', 'all')).toBe('');
    expect(nextProjectsSearchWithSource('?source=brands', 'brands')).toBe(null);
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

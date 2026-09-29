import { describe, expect, it } from 'vitest';
import { SITE_NAME } from '@/lib/brand';
import {
  designerPageMetadata,
  designerProjectsFromPayload,
  parsePublicDesignerPayload,
} from '@/lib/designersPublicShared';

function samplePayload(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'd1',
    slug: 'anna-ivanova',
    displayName: 'Анна Иванова',
    photoUrl: '/uploads/avatar.jpg',
    city: 'Москва',
    servicesLine: 'Интерьеры',
    likesDisplayCount: 3,
    casesCount: 9,
    casesPage: 1,
    casesLimit: 36,
    casesTotal: 9,
    coverLayout: '16:9',
    coverImageUrls: ['/uploads/cover.jpg'],
    aboutHtml: '<p>Опыт с частными интерьерами.</p>',
    cases: [
      {
        id: 'c1',
        title: 'Квартира на Арбате',
        shortDescription: 'Кратко',
        placesLine: 'Гостиная',
        roomTypes: ['Гостиная'],
        descriptionHtml: null,
        coverLayout: '4:3',
        coverImageUrls: ['/uploads/case1.jpg'],
        products: [],
        likesDisplayCount: 1,
      },
    ],
    ...overrides,
  };
}

describe('parsePublicDesignerPayload', () => {
  it('maps media URLs and coverLayout', () => {
    const d = parsePublicDesignerPayload(samplePayload(), 'fallback');
    expect(d.slug).toBe('anna-ivanova');
    expect(d.coverLayout).toBe('16:9');
    expect(d.photoUrl).toContain('/uploads/avatar.jpg');
    expect(d.coverImageUrls[0]).toContain('/uploads/cover.jpg');
    expect(d.cases).toHaveLength(1);
    expect(d.casesTotal).toBe(9);
  });

  it('defaults coverLayout to 4:3 and uses slug fallback', () => {
    const d = parsePublicDesignerPayload(
      samplePayload({ slug: undefined, coverLayout: 'weird', casesTotal: undefined, casesCount: 2 }),
      'fallback-slug',
    );
    expect(d.slug).toBe('fallback-slug');
    expect(d.coverLayout).toBe('4:3');
    expect(d.casesTotal).toBe(2);
  });
});

describe('designerProjectsFromPayload', () => {
  it('maps cases to project cards', () => {
    const d = parsePublicDesignerPayload(samplePayload(), 'x');
    const projects = designerProjectsFromPayload(d);
    expect(projects).toHaveLength(1);
    expect(projects[0]?.title).toBe('Квартира на Арбате');
    expect(projects[0]?.id).toBe('c1');
  });
});

describe('designerPageMetadata', () => {
  it('prefers aboutHtml excerpt for description and builds OG', () => {
    const designer = parsePublicDesignerPayload(samplePayload(), 'x');
    const meta = designerPageMetadata(designer, { siteOrigin: 'https://wupapa.example' });
    expect(meta.title).toBe(`Анна Иванова — Дизайнер — ${SITE_NAME}`);
    expect(meta.description).toContain('Опыт с частными интерьерами');
    expect(meta.openGraph?.url).toBe('https://wupapa.example/designers/anna-ivanova');
    const images = meta.openGraph?.images;
    const first = Array.isArray(images) ? images[0] : images;
    expect(first && typeof first === 'object' && 'alt' in first ? first.alt : null).toBe(
      'Анна Иванова',
    );
  });

  it('falls back to city/services when about is empty', () => {
    const designer = parsePublicDesignerPayload(samplePayload({ aboutHtml: null }), 'x');
    const meta = designerPageMetadata(designer);
    expect(meta.description).toContain('Москва');
    expect(meta.description).toContain('Интерьеры');
  });
});

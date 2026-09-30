import { describe, expect, it } from 'vitest';
import {
  brandCaseFormToBody,
  isNearAspect9x16,
  projectsFeedFilterKey,
  type BrandCaseFormState,
} from './brandCaseForm';
import { resolveProjectsFeedSource, parseProjectsFeedPayload } from './publicProjectsListing';

const emptyForm = (): BrandCaseFormState => ({
  title: '  Loft  ',
  shortDescription: 'x'.repeat(10),
  location: 'Москва',
  year: '2024',
  budgetDigits: '2500000',
  descriptionHtml: '<p>hi</p>',
  coverUrl: 'https://cdn.example/a.jpg',
  selectedRooms: ['Кухня'],
  productIds: ['p1'],
  isPublished: true,
});

describe('brandCaseFormToBody', () => {
  it('formats budget and forces 9:16 cover layout', () => {
    const body = brandCaseFormToBody(emptyForm(), (d) => d.replace(/(\d)(?=(\d{3})+$)/g, '$1 '));
    expect(body.coverLayout).toBe('9:16');
    expect(body.coverImageUrls).toEqual(['https://cdn.example/a.jpg']);
    expect(body.budget).toBe('2 500 000');
    expect(body.title).toBe('Loft');
    expect(body.isPublished).toBe(true);
  });

  it('nulls empty optional fields', () => {
    const form = emptyForm();
    form.budgetDigits = '';
    form.coverUrl = '  ';
    form.year = '';
    const body = brandCaseFormToBody(form, (d) => d);
    expect(body.budget).toBeNull();
    expect(body.coverImageUrls).toEqual([]);
    expect(body.year).toBeNull();
  });
});

describe('isNearAspect9x16', () => {
  it('accepts exact and near 9:16', () => {
    expect(isNearAspect9x16(900, 1600)).toBe(true);
    expect(isNearAspect9x16(920, 1600)).toBe(true);
  });

  it('rejects landscape', () => {
    expect(isNearAspect9x16(1600, 900)).toBe(false);
  });
});

describe('projectsFeedFilterKey', () => {
  it('changes when source or brand changes', () => {
    const a = projectsFeedFilterKey({ source: 'all', pageSize: 48 });
    const b = projectsFeedFilterKey({ source: 'brands', brandSlug: 'acme', pageSize: 48 });
    expect(a).not.toBe(b);
  });
});

describe('projectsFeedPaginationEnabled', () => {
  it('disables when both sources are off', async () => {
    const { projectsFeedPaginationEnabled } = await import('./brandCaseForm');
    expect(projectsFeedPaginationEnabled(true)).toBe(false);
    expect(projectsFeedPaginationEnabled(false)).toBe(true);
  });
});

describe('resolveProjectsFeedSource', () => {
  it('prefers brand slug over source param', () => {
    expect(resolveProjectsFeedSource({ brandSlug: 'x', source: 'designers' })).toBe('brands');
  });

  it('uses productBrand as designers', () => {
    expect(resolveProjectsFeedSource({ productBrandSlug: 'x' })).toBe('designers');
  });
});

describe('parseProjectsFeedPayload', () => {
  it('returns empty on bad payload', () => {
    expect(parseProjectsFeedPayload(null).projects).toEqual([]);
    expect(parseProjectsFeedPayload({ items: 'nope' }).total).toBe(0);
  });
});

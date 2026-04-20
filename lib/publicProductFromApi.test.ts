import { describe, expect, it } from 'vitest';
import {
  parsePublicProduct,
  pickPublicProductVariant,
  type PublicProductFromApi,
  type PublicProductVariantApi,
} from './publicProductFromApi';

function makeVariant(overrides: Partial<PublicProductVariantApi> = {}): PublicProductVariantApi {
  return {
    id: 'v',
    variantSlug: null,
    variantLabel: null,
    modificationId: null,
    price: 1,
    sku: null,
    isDefault: false,
    images: [],
    selections: [],
    ...overrides,
  };
}

function makeProduct(overrides: Partial<PublicProductFromApi> = {}): PublicProductFromApi {
  return {
    slug: 'p',
    name: 'Product',
    price: 100,
    shortDescription: null,
    description: null,
    seoTitle: null,
    seoDescription: null,
    deliveryText: null,
    technicalSpecs: null,
    additionalInfoHtml: null,
    category: null,
    brand: null,
    images: [],
    modifications: [],
    elements: [],
    defaultVariantId: null,
    defaultModificationId: null,
    variants: [],
    ...overrides,
  };
}

describe('pickPublicProductVariant', () => {
  it('returns null when no variants', () => {
    const p = makeProduct({ variants: [] });
    const r = pickPublicProductVariant(p, undefined, undefined);
    expect(r.variant).toBeNull();
    expect(r.resolvedVariantId).toBeNull();
  });

  it('prefers vs over v and default', () => {
    const p = makeProduct({
      variants: [
        makeVariant({ id: 'a', variantSlug: 'alpha', variantLabel: 'A', isDefault: true }),
        makeVariant({ id: 'b', variantSlug: 'beta', variantLabel: 'B', price: 2 }),
      ],
      defaultVariantId: 'a',
    });
    const r = pickPublicProductVariant(p, 'a', 'beta');
    expect(r.variant?.id).toBe('b');
    expect(r.resolvedVariantId).toBe('b');
  });

  it('falls back to v when vs missing', () => {
    const p = makeProduct({
      variants: [makeVariant({ id: 'x' })],
      defaultVariantId: 'x',
    });
    const r = pickPublicProductVariant(p, 'x', undefined);
    expect(r.variant?.id).toBe('x');
  });
});

describe('parsePublicProduct', () => {
  it('parses minimal payload', () => {
    const raw = {
      slug: 's',
      name: 'N',
      price: 0,
      shortDescription: null,
      description: null,
      seoTitle: null,
      seoDescription: null,
      deliveryText: null,
      technicalSpecs: null,
      additionalInfoHtml: null,
      category: null,
      brand: null,
      images: [],
      modifications: [],
      elements: [],
      variants: [],
    };
    const p = parsePublicProduct(raw);
    expect(p?.slug).toBe('s');
    expect(p?.variants).toEqual([]);
    expect(p?.modifications).toEqual([]);
    expect(p?.elements).toEqual([]);
  });
});

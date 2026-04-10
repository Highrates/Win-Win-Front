import { describe, expect, it } from 'vitest';
import {
  parsePublicProduct,
  pickPublicProductVariant,
  type PublicProductFromApi,
} from './publicProductFromApi';

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
    specsJson: null,
    category: null,
    brand: null,
    images: [],
    defaultVariantId: null,
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
        {
          id: 'a',
          variantSlug: 'alpha',
          variantLabel: 'A',
          price: 1,
          sku: null,
          specsJson: null,
          optionAttributes: null,
          isDefault: true,
          images: [],
        },
        {
          id: 'b',
          variantSlug: 'beta',
          variantLabel: 'B',
          price: 2,
          sku: null,
          specsJson: null,
          optionAttributes: null,
          isDefault: false,
          images: [],
        },
      ],
      defaultVariantId: 'a',
    });
    const r = pickPublicProductVariant(p, 'a', 'beta');
    expect(r.variant?.id).toBe('b');
    expect(r.resolvedVariantId).toBe('b');
  });

  it('falls back to v when vs missing', () => {
    const p = makeProduct({
      variants: [
        {
          id: 'x',
          variantSlug: null,
          variantLabel: null,
          price: 1,
          sku: null,
          specsJson: null,
          optionAttributes: null,
          isDefault: false,
          images: [],
        },
      ],
      defaultVariantId: 'x',
    });
    const r = pickPublicProductVariant(p, 'x', undefined);
    expect(r.variant?.id).toBe('x');
  });

  it('uses defaultVariantId then first variant', () => {
    const p = makeProduct({
      variants: [
        {
          id: 'd',
          variantSlug: 'd',
          variantLabel: null,
          price: 5,
          sku: null,
          specsJson: null,
          optionAttributes: null,
          isDefault: true,
          images: [],
        },
        {
          id: 'e',
          variantSlug: 'e',
          variantLabel: null,
          price: 6,
          sku: null,
          specsJson: null,
          optionAttributes: null,
          isDefault: false,
          images: [],
        },
      ],
      defaultVariantId: 'd',
    });
    const r = pickPublicProductVariant(p, undefined, undefined);
    expect(r.variant?.id).toBe('d');
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
      specsJson: null,
      category: null,
      brand: null,
      images: [],
      variants: [],
    };
    const p = parsePublicProduct(raw);
    expect(p?.slug).toBe('s');
    expect(p?.variants).toEqual([]);
  });
});

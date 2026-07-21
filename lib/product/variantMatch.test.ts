import { describe, expect, it } from 'vitest';
import {
  buildInitialSelections,
  findExactVariant,
  isConfigurationReadyForProject,
} from './variantMatch';
import type { PublicProductElementApi, PublicProductVariantApi } from '@/lib/publicProductFromApi';

const element: PublicProductElementApi = {
  id: 'el1',
  name: 'Обивка',
  sortOrder: 0,
  availabilities: [
    {
      brandMaterialColorId: 'bmc-a',
      brandMaterialId: 'bm1',
      materialName: 'Ткань',
      materialSortOrder: 0,
      colorName: 'Серый',
      imageUrl: null,
      sortOrder: 0,
    },
    {
      brandMaterialColorId: 'bmc-b',
      brandMaterialId: 'bm1',
      materialName: 'Ткань',
      materialSortOrder: 0,
      colorName: 'Беж',
      imageUrl: null,
      sortOrder: 1,
    },
  ],
};

const variant: PublicProductVariantApi = {
  id: 'v1',
  modificationId: 'mod1',
  variantSlug: null,
  variantLabel: '180 см',
  price: 1000,
  sku: 'SKU1',
  isDefault: true,
  images: [],
  selections: [{ productElementId: 'el1', brandMaterialColorId: 'bmc-b' }],
};

describe('findExactVariant', () => {
  it('matches modification and all element selections', () => {
    const found = findExactVariant([variant], [element], 'mod1', { el1: 'bmc-b' });
    expect(found?.id).toBe('v1');
  });

  it('returns null when selection differs', () => {
    const found = findExactVariant([variant], [element], 'mod1', { el1: 'bmc-a' });
    expect(found).toBeNull();
  });
});

describe('buildInitialSelections', () => {
  it('prefers anchor variant selections', () => {
    expect(buildInitialSelections([element], [variant], 'v1')).toEqual({ el1: 'bmc-b' });
  });

  it('falls back to first availability', () => {
    expect(buildInitialSelections([element], [variant], null)).toEqual({ el1: 'bmc-a' });
  });
});

describe('isConfigurationReadyForProject', () => {
  it('requires modification and every element selection', () => {
    expect(isConfigurationReadyForProject([element], 'mod1', { el1: 'bmc-a' })).toBe(true);
    expect(isConfigurationReadyForProject([element], null, { el1: 'bmc-a' })).toBe(false);
    expect(isConfigurationReadyForProject([element], 'mod1', {})).toBe(false);
  });
});

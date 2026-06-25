import { describe, expect, it } from 'vitest';
import {
  SOURCING_MAX_FILES,
  SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT,
  SOURCING_PRODUCT_NAME_MAX,
  SOURCING_TITLE_MAX,
  validateSourcingIncomingFiles,
} from './sourcingLimits';
import { createEmptySourcingProduct } from './types';
import {
  hasSourcingFormErrors,
  isProductMinimallyFilled,
  validateSourcingForm,
} from './validation';

describe('validateSourcingForm', () => {
  it('требует название заявки', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    const errors = validateSourcingForm('', [product], []);
    expect(errors.requestTitle).toBeTruthy();
    expect(hasSourcingFormErrors(errors)).toBe(true);
  });

  it('требует хотя бы один заполненный товар', () => {
    const errors = validateSourcingForm('Заявка', [createEmptySourcingProduct()], []);
    expect(errors.productsGeneral).toMatch(/хотя бы у одного товара/);
  });

  it('принимает валидную форму', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Диван';
    const errors = validateSourcingForm('Подбор мебели', [product], []);
    expect(hasSourcingFormErrors(errors)).toBe(false);
  });

  it('валидирует ссылку на товар', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    product.productLink = 'not-a-url';
    const errors = validateSourcingForm('Заявка', [product], []);
    expect(errors.productErrors?.[product.id]?.productLink).toBeTruthy();
  });

  it('отклоняет слишком длинное название заявки', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    const errors = validateSourcingForm('x'.repeat(SOURCING_TITLE_MAX + 1), [product], []);
    expect(errors.requestTitle).toMatch(/не длиннее/);
  });

  it('отклоняет недопустимую единицу измерения', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    product.unit = 'ящик';
    const errors = validateSourcingForm('Заявка', [product], []);
    expect(errors.productErrors?.[product.id]?.unit).toBeTruthy();
  });

  it('отклоняет превышение лимита файлов на заявку', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    const attachments = Array.from({ length: SOURCING_MAX_FILES }, (_, i) => ({
      id: `att-${i}`,
      file: new File(['x'], `f${i}.txt`, { type: 'text/plain' }),
    }));
    const err = validateSourcingIncomingFiles(
      [new File(['x'], 'one-more.txt', { type: 'text/plain' })],
      [product],
      attachments,
    );
    expect(err).toMatch(/Не больше/);
  });

  it('отклоняет слишком много референсов на товар', () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стул';
    product.referenceImages = Array.from({ length: SOURCING_MAX_REFERENCE_KEYS_PER_PRODUCT }, (_, i) => ({
      id: `ref-${i}`,
      file: new File(['x'], `r${i}.jpg`, { type: 'image/jpeg' }),
      previewUrl: `blob:${i}`,
    }));
    const err = validateSourcingIncomingFiles(
      [new File(['x'], 'extra.jpg', { type: 'image/jpeg' })],
      [product],
      [],
      { productId: product.id },
    );
    expect(err).toMatch(/изображений на товар/);
  });
  it('отклоняет слишком длинное имя товара', () => {
    const product = createEmptySourcingProduct();
    product.name = 'x'.repeat(SOURCING_PRODUCT_NAME_MAX + 1);
    const errors = validateSourcingForm('Заявка', [product], []);
    expect(errors.productsGeneral).toMatch(/Наименование товара/);
  });
});

describe('isProductMinimallyFilled (frontend adapter)', () => {
  it('учитывает referenceImages', () => {
    const product = createEmptySourcingProduct();
    product.referenceImages = [
      {
        id: 'img1',
        file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:test',
      },
    ];
    expect(isProductMinimallyFilled(product)).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const save = vi.fn();
const addImage = vi.fn();
const text = vi.fn();
const setFont = vi.fn();
const addFont = vi.fn();
const addFileToVFS = vi.fn();
const setPage = vi.fn();
const getNumberOfPages = vi.fn(() => 1);
const splitTextToSize = vi.fn((t: string) => [t]);
const getTextWidth = vi.fn(() => 10);

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addFileToVFS,
    addFont,
    setFont,
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    text,
    addImage,
    addPage: vi.fn(),
    setPage,
    getNumberOfPages,
    getTextWidth,
    splitTextToSize,
    getImageProperties: vi.fn((src: string) => {
      if (typeof src === 'string' && src.startsWith('data:')) {
        return { width: 800, height: 600 };
      }
      return { width: 100, height: 100 };
    }),
    save,
  })),
}));

vi.mock('@win-win/order-item-snapshot', () => ({
  orderItemSnapshotMetaRows: () => [],
}));

describe('downloadCommercialProposalPdf', () => {
  beforeEach(() => {
    save.mockClear();
    addImage.mockClear();
    text.mockClear();
    addFont.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/fonts/')) {
          return new Response(new Uint8Array([0, 1, 2, 3]).buffer, { status: 200 });
        }
        if (url.includes('wupapa-logo') || url.includes('/email/')) {
          return new Response(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), {
            status: 200,
          });
        }
        return new Response('missing', { status: 404 });
      }),
    );
  });

  it('собирает PDF и вызывает save при валидном КП', async () => {
    const { downloadCommercialProposalPdf } = await import('./exportCommercialProposalPdf');
    await downloadCommercialProposalPdf({
      orderId: 'ord-abc12345',
      proposal: {
        id: 'kp1',
        orderId: 'ord-abc12345',
        versionNumber: 2,
        status: 'PUBLISHED',
        publishedAt: '2026-01-10T12:00:00.000Z',
        publishedByUserId: null,
        createdAt: '2026-01-10T12:00:00.000Z',
        updatedAt: '2026-01-10T12:00:00.000Z',
        lines: [
          {
            id: 'l1',
            sourceOrderItemId: null,
            sortOrder: 0,
            productId: 'p1',
            productVariantId: null,
            quantity: 2,
            unit: 'шт',
            snapshot: { productName: 'Стул' },
            offerUnitPrice: 1000,
            discountPercent: null,
            deliveryEta: null,
            lineNote: null,
          },
        ],
      },
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(String(save.mock.calls[0]?.[0])).toMatch(/WUPAPA-KP-/);
  });

  it('бросает, если нет позиций', async () => {
    const { downloadCommercialProposalPdf } = await import('./exportCommercialProposalPdf');
    await expect(
      downloadCommercialProposalPdf({
        orderId: 'ord-x',
        proposal: {
          id: 'kp0',
          orderId: 'ord-x',
          versionNumber: 1,
          status: 'PUBLISHED',
          publishedAt: null,
          publishedByUserId: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          lines: [],
        },
      }),
    ).rejects.toThrow(/нет позиций/i);
  });

  it('блокирует save при ошибке шрифта (без Helvetica/кракозябр)', async () => {
    vi.resetModules();
    save.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/fonts/')) return new Response('fail', { status: 500 });
        if (url.includes('wupapa-logo') || url.includes('/email/')) {
          return new Response(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), {
            status: 200,
          });
        }
        return new Response('missing', { status: 404 });
      }),
    );
    const { downloadCommercialProposalPdf, KP_PDF_FONT_ERROR_MESSAGE } = await import(
      './exportCommercialProposalPdf'
    );
    await expect(
      downloadCommercialProposalPdf({
        orderId: 'ord-font',
        proposal: {
          id: 'kp1',
          orderId: 'ord-font',
          versionNumber: 1,
          status: 'PUBLISHED',
          publishedAt: '2026-01-10T12:00:00.000Z',
          publishedByUserId: null,
          createdAt: '2026-01-10T12:00:00.000Z',
          updatedAt: '2026-01-10T12:00:00.000Z',
          lines: [
            {
              id: 'l1',
              sourceOrderItemId: null,
              sortOrder: 0,
              productId: 'p1',
              productVariantId: null,
              quantity: 1,
              unit: 'шт',
              snapshot: { productName: 'Стол' },
              offerUnitPrice: 500,
              discountPercent: null,
              deliveryEta: null,
              lineNote: null,
            },
          ],
        },
      }),
    ).rejects.toThrow(KP_PDF_FONT_ERROR_MESSAGE);
    expect(save).not.toHaveBeenCalled();
  });

  it('progress labels: fonts → images → save', async () => {
    save.mockClear();
    const { __resetKpPdfAssetCachesForTests, downloadCommercialProposalPdf } = await import(
      './exportCommercialProposalPdf'
    );
    __resetKpPdfAssetCachesForTests();
    const labels: string[] = [];
    const phases: string[] = [];
    await downloadCommercialProposalPdf({
      orderId: 'ord-progress',
      proposal: {
        id: 'kp1',
        orderId: 'ord-progress',
        versionNumber: 1,
        status: 'PUBLISHED',
        publishedAt: '2026-01-10T12:00:00.000Z',
        publishedByUserId: null,
        createdAt: '2026-01-10T12:00:00.000Z',
        updatedAt: '2026-01-10T12:00:00.000Z',
        lines: [
          {
            id: 'l1',
            sourceOrderItemId: null,
            sortOrder: 0,
            productId: 'p1',
            productVariantId: null,
            quantity: 1,
            unit: 'шт',
            snapshot: { productName: 'Стул' },
            offerUnitPrice: 1000,
            discountPercent: null,
            deliveryEta: null,
            lineNote: null,
          },
        ],
      },
      onProgress: (p) => {
        phases.push(p.phase);
        labels.push(p.label);
      },
    });
    expect(phases[0]).toBe('fonts');
    expect(labels[0]).toMatch(/Шрифт/i);
    expect(phases).toContain('images');
    expect(phases).toContain('build');
    expect(phases).toContain('save');
    expect(phases.at(-1)).toBe('done');
    expect(labels.some((l) => /Фото/i.test(l) || /Сборка/i.test(l))).toBe(true);
    expect(labels.some((l) => /Сохран/i.test(l))).toBe(true);
  });
});

describe('media proxy for PDF images', () => {
  it('абсолютный URL уходит в /api/media-proxy', async () => {
    const { mediaUrlForPdf } = await import('./exportCommercialProposalPdf');
    expect(mediaUrlForPdf('https://cdn.example.com/a.jpg')).toBe(
      '/api/media-proxy?url=' + encodeURIComponent('https://cdn.example.com/a.jpg'),
    );
    expect(mediaUrlForPdf('/uploads/x.jpg')).toBe('/uploads/x.jpg');
    expect(mediaUrlForPdf('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('отбрасывает placeholder URL', async () => {
    const { isPlaceholderMediaUrl } = await import('./exportCommercialProposalPdf');
    expect(isPlaceholderMediaUrl('/images/placeholder.svg')).toBe(true);
    expect(isPlaceholderMediaUrl('/uploads/chair.jpg')).toBe(false);
  });

  it('fitContain сохраняет отношение сторон', async () => {
    const { fitContain } = await import('./exportCommercialProposalPdf');
    const fitted = fitContain(180, 110, 800, 600);
    expect(fitted.w / fitted.h).toBeCloseTo(800 / 600, 5);
    expect(fitted.w).toBeLessThanOrEqual(180);
    expect(fitted.h).toBeLessThanOrEqual(110);
  });

  it('lineImageUrls caps at KP_PDF_MAX_IMAGES_PER_LINE', async () => {
    const { lineImageUrls, KP_PDF_MAX_IMAGES_PER_LINE } = await import('./exportCommercialProposalPdf');
    const urls = Array.from({ length: 12 }, (_, i) => `/uploads/p${i}.jpg`);
    const line = {
      id: 'l1',
      sourceOrderItemId: null,
      sortOrder: 0,
      productId: 'p1',
      productVariantId: null,
      quantity: 1,
      unit: 'шт',
      snapshot: { productName: 'X', imageUrl: urls[0], imageUrls: urls.slice(1) },
      offerUnitPrice: 1,
      discountPercent: null,
      deliveryEta: null,
      lineNote: null,
    };
    expect(lineImageUrls(line)).toHaveLength(KP_PDF_MAX_IMAGES_PER_LINE);
    expect(lineImageUrls(line, 2)).toHaveLength(2);
  });

  it('preferPngRaster: PNG/WebP magic vs JPEG; GIF→JPEG', async () => {
    const { preferPngRaster } = await import('./exportCommercialProposalPdf');
    expect(preferPngRaster('image/jpeg')).toBe(false);
    expect(preferPngRaster('image/png')).toBe(true);
    expect(preferPngRaster('image/webp')).toBe(true);
    expect(preferPngRaster('image/gif')).toBe(false);
    expect(preferPngRaster('', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      true,
    );
    expect(preferPngRaster('', new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
    // GIF89a
    expect(
      preferPngRaster('', new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0])),
    ).toBe(false);
  });

  it('imageFetchCandidates: /uploads добавляет media-proxy fallback', async () => {
    const { imageFetchCandidates } = await import('./exportCommercialProposalPdf');
    expect(imageFetchCandidates('/uploads/a.jpg')).toEqual([
      '/uploads/a.jpg',
      '/api/media-proxy?url=' + encodeURIComponent('/uploads/a.jpg'),
    ]);
    expect(imageFetchCandidates('/images/logo.png')).toEqual(['/images/logo.png']);
  });

  it('kpPdfFailedImagesMessage', async () => {
    const { kpPdfFailedImagesMessage } = await import('./exportCommercialProposalPdf');
    expect(kpPdfFailedImagesMessage(0)).toBe('');
    expect(kpPdfFailedImagesMessage(1)).toBe('1 фото не загрузилось');
    expect(kpPdfFailedImagesMessage(3)).toMatch(/3 фото не загрузились/);
  });
});

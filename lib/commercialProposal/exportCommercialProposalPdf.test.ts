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

  it('soft font fallback: PDF всё равно сохраняется через helvetica', async () => {
    vi.resetModules();
    save.mockClear();
    setFont.mockClear();
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
    const { downloadCommercialProposalPdf } = await import('./exportCommercialProposalPdf');
    await downloadCommercialProposalPdf({
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
    });
    expect(save).toHaveBeenCalled();
    expect(setFont.mock.calls.some((c) => c[0] === 'helvetica')).toBe(true);
  });
});

describe('media proxy for PDF images', () => {
  it('абсолютный URL уходит в /api/media-proxy', async () => {
    const { mediaUrlForPdf } = await import('./exportCommercialProposalPdf');
    expect(mediaUrlForPdf('https://cdn.example.com/a.jpg')).toBe(
      '/api/media-proxy?url=' + encodeURIComponent('https://cdn.example.com/a.jpg'),
    );
    expect(mediaUrlForPdf('/uploads/x.jpg')).toBe('/uploads/x.jpg');
  });
});

/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetKpPdfAssetCachesForTests,
  fetchImageBlob,
  imageFetchCandidates,
  isPlaceholderMediaUrl,
  loadProductImage,
} from './kpPdfAssets';

describe('kpPdfAssets image pipeline', () => {
  beforeEach(() => {
    __resetKpPdfAssetCachesForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('isPlaceholderMediaUrl + loadProductImage skip без fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(isPlaceholderMediaUrl('/images/placeholder.svg')).toBe(true);
    await expect(loadProductImage('/images/placeholder.svg')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('imageFetchCandidates: /uploads → + media-proxy', () => {
    expect(imageFetchCandidates('/uploads/a.jpg')).toEqual([
      '/uploads/a.jpg',
      '/api/media-proxy?url=' + encodeURIComponent('/uploads/a.jpg'),
    ]);
  });

  it('fetchImageBlob: 404 на /uploads → media-proxy', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/uploads/')) return new Response('no', { status: 404 });
      if (url.includes('/api/media-proxy')) {
        const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
        return new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/jpeg' } });
      }
      return new Response('missing', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const blob = await fetchImageBlob('/uploads/chair.jpg');
    expect(blob).not.toBeNull();
    expect(blob!.size).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/api/media-proxy');
  });

  it('loadProductImage: JPEG → JPEG через createImageBitmap', async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(jpegBytes, { status: 200, headers: { 'Content-Type': 'image/jpeg' } })),
    );
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({
        width: 400,
        height: 300,
        close,
      })),
    );
    const toDataURL = vi.fn((type?: string, _q?: number) =>
      type === 'image/jpeg' ? 'data:image/jpeg;base64,xx' : 'data:image/png;base64,yy',
    );
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' }),
      toDataURL,
    };
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      if (tag === 'canvas') return canvas as unknown as HTMLCanvasElement;
      return origCreate(tag, options);
    });

    const img = await loadProductImage('/uploads/photo.jpg');
    expect(img).toEqual({
      dataUrl: 'data:image/jpeg;base64,xx',
      format: 'JPEG',
      width: 400,
      height: 300,
    });
    expect(close).toHaveBeenCalled();
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
  });

  it('loadProductImage: fail blob → null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array(0), { status: 200 })),
    );
    await expect(loadProductImage('/uploads/empty.jpg')).resolves.toBeNull();
  });
});

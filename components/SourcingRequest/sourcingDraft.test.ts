import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptySourcingProduct } from './types';
import {
  buildSourcingResumeCallbackUrl,
  clearSourcingDraft,
  consumeSourcingResumeFromUrl,
  hasSourcingDraftInStorage,
  isSourcingResumeSearch,
  loadSourcingDraft,
  saveSourcingDraft,
  SOURCING_DRAFT_SESSION_KEY,
} from './sourcingDraft';

const fileStore = new Map<string, Blob>();

function mockIndexedDb() {
  const db = {
    transaction: () => {
      const tx = {
        objectStore: () => ({
          put: (value: Blob, key: string) => {
            fileStore.set(key, value);
          },
          get: (key: string) => {
            const req: {
              result: Blob | undefined;
              onsuccess: ((ev: { target: { result: Blob | undefined } }) => void) | null;
            } = {
              result: fileStore.get(key),
              onsuccess: null,
            };
            queueMicrotask(() => req.onsuccess?.({ target: req }));
            return req;
          },
          clear: () => {
            fileStore.clear();
          },
        }),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    },
    close: vi.fn(),
    objectStoreNames: { contains: () => true },
  };

  vi.stubGlobal('indexedDB', {
    open: () => {
      const req = {
        result: db,
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  });
}

describe('sourcingDraft URL helpers', () => {
  it('buildSourcingResumeCallbackUrl adds query flag', () => {
    expect(buildSourcingResumeCallbackUrl('/account/orders')).toBe('/account/orders?sourcing=resume');
  });

  it('isSourcingResumeSearch detects resume flag', () => {
    expect(isSourcingResumeSearch('?sourcing=resume')).toBe(true);
    expect(isSourcingResumeSearch('?tab=work')).toBe(false);
  });

  it('consumeSourcingResumeFromUrl strips query flag', () => {
    const replaceState = vi.fn();
    vi.stubGlobal('window', {
      location: {
        pathname: '/account/orders',
        search: '?tab=work&sourcing=resume',
        hash: '',
      },
      history: { replaceState, state: null },
      sessionStorage: {
        getItem: () => null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });
    expect(consumeSourcingResumeFromUrl()).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/account/orders?tab=work');
  });
});

describe('sourcingDraft round-trip', () => {
  let sessionStore: Map<string, string>;

  beforeEach(() => {
    sessionStore = new Map();
    fileStore.clear();
    mockIndexedDb();
    const sessionStorage = {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => sessionStore.set(key, value),
      removeItem: (key: string) => sessionStore.delete(key),
    };
    vi.stubGlobal('sessionStorage', sessionStorage);
    vi.stubGlobal('window', {
      sessionStorage,
      location: {
        pathname: '/',
        search: '',
        hash: '',
      },
      history: { replaceState: vi.fn(), state: null },
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('save → load восстанавливает поля и pendingSubmit', async () => {
    const product = createEmptySourcingProduct();
    product.name = 'Кресло';
    product.referenceImages = [
      {
        id: 'ref-1',
        file: new File(['img'], 'ref.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:local',
      },
    ];

    await saveSourcingDraft(
      {
        requestTitle: 'Подбор',
        deliveryCity: 'Москва',
        products: [product],
        formAttachments: [{ id: 'att-1', file: new File(['pdf'], 'spec.pdf', { type: 'application/pdf' }) }],
        openProductId: product.id,
      },
      { pendingSubmit: true },
    );

    expect(hasSourcingDraftInStorage()).toBe(true);
    expect(sessionStore.has(SOURCING_DRAFT_SESSION_KEY)).toBe(true);

    const restored = await loadSourcingDraft();
    expect(restored).toMatchObject({
      requestTitle: 'Подбор',
      deliveryCity: 'Москва',
      openProductId: product.id,
      pendingSubmit: true,
    });
    expect(restored?.products[0]?.name).toBe('Кресло');
    expect(restored?.products[0]?.referenceImages[0]?.file.name).toBe('ref.jpg');
    expect(restored?.formAttachments[0]?.file.name).toBe('spec.pdf');
  });

  it('clearSourcingDraft удаляет session и indexedDB', async () => {
    const product = createEmptySourcingProduct();
    product.name = 'Стол';
    await saveSourcingDraft({
      requestTitle: 'X',
      deliveryCity: '',
      products: [product],
      formAttachments: [],
      openProductId: product.id,
    });
    await clearSourcingDraft();
    expect(hasSourcingDraftInStorage()).toBe(false);
    expect(fileStore.size).toBe(0);
  });
});

import type { SourcingFormAttachment, SourcingProductItem, SourcingReferenceImage } from './types';
import { normalizeSourcingUnit } from './types';

export const SOURCING_DRAFT_SESSION_KEY = 'winwin-sourcing-request-draft-v1';
export const SOURCING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const SOURCING_RESUME_QUERY = 'sourcing';
export const SOURCING_RESUME_VALUE = 'resume';

const IDB_NAME = 'winwin-sourcing-draft';
const IDB_STORE = 'files';

export const SOURCING_DRAFT_SAVE_ERROR =
  'Не удалось сохранить черновик. Проверьте место в браузере и попробуйте снова.';

export const SOURCING_DRAFT_LOAD_ERROR =
  'Не удалось восстановить черновик. Данные могли быть повреждены или недоступны.';

export type SourcingFormSnapshot = {
  requestTitle: string;
  deliveryCity: string;
  products: SourcingProductItem[];
  formAttachments: SourcingFormAttachment[];
  openProductId: string;
  pendingSubmit?: boolean;
};

export type SaveSourcingDraftOptions = {
  pendingSubmit?: boolean;
};

type StoredFileMeta = {
  id: string;
  name: string;
  type: string;
  lastModified: number;
};

type StoredProduct = Omit<SourcingProductItem, 'referenceImages'> & {
  referenceImages: StoredFileMeta[];
};

type StoredDraft = {
  version: 1;
  savedAt: number;
  requestTitle: string;
  deliveryCity: string;
  products: StoredProduct[];
  formAttachments: StoredFileMeta[];
  openProductId: string;
  pendingSubmit?: boolean;
};

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function putDraftFile(file: File, id: string): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put failed'));
  });
  db.close();
}

async function getDraftFile(id: string): Promise<Blob | null> {
  const db = await openDraftDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB get failed'));
  });
  db.close();
  return blob;
}

async function clearDraftFiles(): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB clear failed'));
  });
  db.close();
}

function readStoredDraft(): StoredDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SOURCING_DRAFT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || parsed.version !== 1 || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > SOURCING_DRAFT_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredDraft(draft: StoredDraft): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SOURCING_DRAFT_SESSION_KEY, JSON.stringify(draft));
}

export function buildSourcingResumeCallbackUrl(returnPath?: string): string {
  const base = returnPath?.trim() || '/';
  try {
    const url = new URL(base, 'http://local');
    url.searchParams.set(SOURCING_RESUME_QUERY, SOURCING_RESUME_VALUE);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `/?${SOURCING_RESUME_QUERY}=${SOURCING_RESUME_VALUE}`;
  }
}

export function consumeSourcingResumeFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isSourcingResumeSearch(window.location.search)) return false;

  const params = new URLSearchParams(window.location.search);
  params.delete(SOURCING_RESUME_QUERY);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
  return true;
}

export function isSourcingResumeSearch(search: string): boolean {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return params.get(SOURCING_RESUME_QUERY) === SOURCING_RESUME_VALUE;
  } catch {
    return false;
  }
}

export async function saveSourcingDraft(
  snapshot: SourcingFormSnapshot,
  opts?: SaveSourcingDraftOptions,
): Promise<void> {
  if (typeof window === 'undefined') return;

  for (const product of snapshot.products) {
    for (const image of product.referenceImages) {
      await putDraftFile(image.file, image.id);
    }
  }
  for (const attachment of snapshot.formAttachments) {
    await putDraftFile(attachment.file, attachment.id);
  }

  const stored: StoredDraft = {
    version: 1,
    savedAt: Date.now(),
    requestTitle: snapshot.requestTitle,
    deliveryCity: snapshot.deliveryCity,
    openProductId: snapshot.openProductId,
    pendingSubmit: opts?.pendingSubmit ?? snapshot.pendingSubmit ?? false,
    products: snapshot.products.map((product) => ({
      id: product.id,
      name: product.name,
      productLink: product.productLink,
      material: product.material,
      color: product.color,
      size: product.size,
      description: product.description,
      quantity: product.quantity,
      unit: product.unit,
      expectedBudget: product.expectedBudget,
      referenceImages: product.referenceImages.map((image) => ({
        id: image.id,
        name: image.file.name,
        type: image.file.type,
        lastModified: image.file.lastModified,
      })),
    })),
    formAttachments: snapshot.formAttachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.file.name,
      type: attachment.file.type,
      lastModified: attachment.file.lastModified,
    })),
  };

  writeStoredDraft(stored);
}

async function fileFromStored(meta: StoredFileMeta): Promise<File | null> {
  const blob = await getDraftFile(meta.id);
  if (!blob) return null;
  if (blob instanceof File) return blob;
  return new File([blob], meta.name, { type: meta.type || blob.type, lastModified: meta.lastModified });
}

export async function loadSourcingDraft(): Promise<SourcingFormSnapshot | null> {
  const stored = readStoredDraft();
  if (!stored) {
    await clearSourcingDraft();
    return null;
  }

  const formAttachments: SourcingFormAttachment[] = [];
  for (const meta of stored.formAttachments) {
    const file = await fileFromStored(meta);
    if (!file) continue;
    formAttachments.push({ id: meta.id, file });
  }

  const products: SourcingProductItem[] = [];
  for (const product of stored.products) {
    const referenceImages: SourcingReferenceImage[] = [];
    for (const meta of product.referenceImages) {
      const file = await fileFromStored(meta);
      if (!file) continue;
      referenceImages.push({
        id: meta.id,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    products.push({
      ...product,
      unit: normalizeSourcingUnit(product.unit),
      referenceImages,
    });
  }

  return {
    requestTitle: stored.requestTitle,
    deliveryCity: stored.deliveryCity,
    products,
    formAttachments,
    openProductId: stored.openProductId,
    pendingSubmit: stored.pendingSubmit === true,
  };
}

export async function clearSourcingDraft(): Promise<void> {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SOURCING_DRAFT_SESSION_KEY);
  try {
    await clearDraftFiles();
  } catch {
    /* ignore */
  }
}

export function hasSourcingDraftInStorage(): boolean {
  return readStoredDraft() !== null;
}

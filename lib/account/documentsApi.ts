import { privateFileHref, type PrivateFileRef } from '@/lib/privateFiles';
import { AccountLoadError, accountLoadErrorMessage } from './loadErrorMessage';

export type AccountDocumentSource =
  | 'ORDER_CHAT'
  | 'ORDER_DOCUMENT'
  | 'SOURCING_CHAT'
  | 'SOURCING_REQUEST';

export type AccountDocument = {
  /** Непрозрачный id; файл отдаётся только через `accountDocumentFileHref` (с проверкой владельца). */
  id: string;
  title: string;
  mimeType: string | null;
  /** Расширение в нижнем регистре без точки (pdf, xlsx…), если известно. */
  ext: string | null;
  /** Файл по внешней ссылке (не из нашего хранилища): откроется на другом сайте. */
  external: boolean;
  /** Откроется в браузере (PDF, текст); иначе скачается — та же логика, что у ответа файла. */
  inline: boolean;
  createdAt: string;
  source: AccountDocumentSource;
  sourceId: string;
  /** Текущий статус заказа / заявки — выбирает вкладку `/account/orders` для ссылки на источник. */
  sourceStatus: string | null;
  uploadedBy: 'CUSTOMER' | 'STAFF' | null;
};

export type AccountDocumentsFilter = 'all' | 'orders' | 'sourcing' | 'mine';

export type AccountDocumentsPage = {
  items: AccountDocument[];
  nextCursor: string | null;
};

/** Группа вида «По заказам»: заказ или заявка на подбор, первые документы и сколько их всего. */
export type AccountDocumentGroup = {
  /** `order:<id>` / `sourcing:<id>`. */
  key: string;
  source: 'ORDER' | 'SOURCING';
  sourceId: string;
  sourceStatus: string | null;
  total: number;
  latestAt: string;
  items: AccountDocument[];
  /** Курсор остальных документов группы (`fetchAccountDocuments({ group })`); null — показаны все. */
  nextCursor: string | null;
};

export type AccountDocumentGroupsPage = {
  groups: AccountDocumentGroup[];
  nextCursor: string | null;
};

export const ACCOUNT_DOCUMENTS_PAGE_SIZE = 50;
export const ACCOUNT_DOCUMENT_GROUPS_PAGE_SIZE = 20;
export const ACCOUNT_DOCUMENT_GROUP_PREVIEW_SIZE = 5;

const SUBJECT = 'документы';

export function accountDocumentFileHref(id: string): string {
  return privateFileHref(id as PrivateFileRef);
}

type ListOpts = {
  filter?: AccountDocumentsFilter;
  q?: string;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
};

async function getJson<T>(path: string, params: URLSearchParams, opts: ListOpts): Promise<Partial<T> | null> {
  if (opts.filter && opts.filter !== 'all') params.set('filter', opts.filter);
  if (opts.q?.trim()) params.set('q', opts.q.trim());
  if (opts.cursor) params.set('cursor', opts.cursor);

  let res: Response;
  try {
    res = await fetch(`${path}?${params.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new AccountLoadError(accountLoadErrorMessage(null, SUBJECT), null);
  }
  if (!res.ok) {
    throw new AccountLoadError(accountLoadErrorMessage(res.status, SUBJECT), res.status);
  }
  return (await res.json().catch(() => null)) as Partial<T> | null;
}

export async function fetchAccountDocuments(
  opts: ListOpts & {
    /** Только одна группа (`AccountDocumentGroup.key`). */
    group?: string;
  } = {},
): Promise<AccountDocumentsPage> {
  const params = new URLSearchParams({ limit: String(opts.limit ?? ACCOUNT_DOCUMENTS_PAGE_SIZE) });
  if (opts.group) params.set('group', opts.group);
  const data = await getJson<AccountDocumentsPage>('/api/user/account/documents', params, opts);
  return { items: data?.items ?? [], nextCursor: data?.nextCursor ?? null };
}

export async function fetchAccountDocumentGroups(
  opts: ListOpts & { itemsPerGroup?: number } = {},
): Promise<AccountDocumentGroupsPage> {
  const params = new URLSearchParams({
    limit: String(opts.limit ?? ACCOUNT_DOCUMENT_GROUPS_PAGE_SIZE),
    items: String(opts.itemsPerGroup ?? ACCOUNT_DOCUMENT_GROUP_PREVIEW_SIZE),
  });
  const data = await getJson<AccountDocumentGroupsPage>('/api/user/account/documents/groups', params, opts);
  return { groups: data?.groups ?? [], nextCursor: data?.nextCursor ?? null };
}

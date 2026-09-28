import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import type { AccountDocument, AccountDocumentGroup } from './documentsApi';
import { accountOrdersDetailHref } from './orders';

export type AccountDocsDateGroup = {
  dateISO: string;
  docs: AccountDocument[];
};

function localDateISO(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function isOrderSource(doc: AccountDocument): boolean {
  return doc.source === 'ORDER_CHAT' || doc.source === 'ORDER_DOCUMENT';
}

function isChatSource(doc: AccountDocument): boolean {
  return doc.source === 'ORDER_CHAT' || doc.source === 'SOURCING_CHAT';
}

/** Документы (уже отсортированы по убыванию даты) → группы по локальной дате. */
export function groupAccountDocsByDate(docs: AccountDocument[]): AccountDocsDateGroup[] {
  const groups: AccountDocsDateGroup[] = [];
  for (const doc of docs) {
    const dateISO = localDateISO(doc.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.dateISO === dateISO) last.docs.push(doc);
    else groups.push({ dateISO, docs: [doc] });
  }
  return groups;
}

/** Заголовок и ссылка группы вида «По заказам» (группы приходят с сервера). */
export function accountDocGroupHeading(
  group: Pick<AccountDocumentGroup, 'source' | 'sourceId' | 'sourceStatus'>,
): {
  title: string;
  href: string;
} {
  const isOrder = group.source === 'ORDER';
  const no = formatOrderDisplayId(group.sourceId);
  return {
    title: isOrder ? `Заказ ${no}` : `Подбор ${no}`,
    href: accountOrdersDetailHref({
      kind: isOrder ? 'order' : 'sourcing',
      id: group.sourceId,
      chat: false,
      status: group.sourceStatus,
    }),
  };
}

/** «1 документ», «3 документа», «12 документов». */
export function accountDocsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'документ'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'документа'
        : 'документов';
  return `${n} ${word}`;
}

export function accountDocSourceLabel(doc: AccountDocument): string {
  const no = formatOrderDisplayId(doc.sourceId);
  switch (doc.source) {
    case 'ORDER_CHAT':
      return `Заказ ${no} · чат`;
    case 'ORDER_DOCUMENT':
      return `Заказ ${no}`;
    case 'SOURCING_CHAT':
      return `Подбор ${no} · чат`;
    case 'SOURCING_REQUEST':
      return `Подбор ${no} · заявка`;
  }
}

/** Канал внутри заказа / заявки — для вида «по заказам», где номер уже в заголовке группы. */
export function accountDocChannelLabel(doc: AccountDocument): string {
  switch (doc.source) {
    case 'ORDER_CHAT':
    case 'SOURCING_CHAT':
      return doc.uploadedBy === 'CUSTOMER' ? 'Вы отправили в чат' : 'Менеджер прислал в чат';
    case 'ORDER_DOCUMENT':
      return 'Документ заказа';
    case 'SOURCING_REQUEST':
      return 'Приложен к заявке';
  }
}

/** Куда ведёт подпись: файл из чата — в этот чат, остальное — в карточку заказа / заявки. */
export function accountDocSourceHref(doc: AccountDocument): string {
  return accountOrdersDetailHref({
    kind: isOrderSource(doc) ? 'order' : 'sourcing',
    id: doc.sourceId,
    chat: isChatSource(doc),
    status: doc.sourceStatus,
  });
}

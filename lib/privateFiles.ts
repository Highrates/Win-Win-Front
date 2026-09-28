import { adminBackendPath } from '@/lib/adminBackendFetch';

/**
 * Составной id персонального файла: вложение чата, файл заявки на подбор или документ заказа.
 * Совпадает с id в ленте /account/docs.
 */
export type PrivateFileRef = `chat:${string}` | `sourcing:${string}` | `order-doc:${string}`;

/** Ссылка на файл через прокси с проверкой доступа (ЛК — сессия покупателя, админка — сессия сотрудника). */
export function privateFileHref(ref: PrivateFileRef, variant: 'account' | 'admin' = 'account'): string {
  const encoded = encodeURIComponent(ref);
  return variant === 'admin' ? adminBackendPath(`files/${encoded}`) : `/api/user/files/${encoded}`;
}

/** Атрибуты ссылки на файл: inline-типы открываются во вкладке, остальные скачиваются без пустой вкладки. */
export function privateFileLinkProps(inline: boolean): {
  target?: '_blank';
  rel?: string;
  download?: true;
} {
  return inline ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true };
}

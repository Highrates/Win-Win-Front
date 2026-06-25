import type { SourcingRequestStatus } from './types';

const LABELS_RU: Record<SourcingRequestStatus, string> = {
  PENDING_REVIEW: 'На рассмотрении',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

const LABELS_ZH: Record<SourcingRequestStatus, string> = {
  PENDING_REVIEW: '待审核',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export function sourcingStatusLabel(status: string, locale: 'ru' | 'zh' = 'ru'): string {
  const labels = locale === 'zh' ? LABELS_ZH : LABELS_RU;
  return labels[status as SourcingRequestStatus] ?? status;
}

export const SOURCING_IN_WORK_STATUSES = new Set<SourcingRequestStatus>([
  'PENDING_REVIEW',
  'IN_PROGRESS',
]);

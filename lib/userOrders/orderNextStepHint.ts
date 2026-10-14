/** Подсказка по зафиксированному ответу на КП (карточка / модалка заказа в ЛК). */

const KP_CHANGES_REQUESTED_NOTICE = 'Запросили изменения — ожидаем новое коммерческое предложение';
const KP_REJECTED_NOTICE = 'Вы отклонили коммерческое предложение';

export function kpDecisionNotice(
  canRespond: boolean,
  decision: 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED' | null | undefined,
): string | undefined {
  if (canRespond) return undefined;
  if (decision === 'CHANGES_REQUESTED') return KP_CHANGES_REQUESTED_NOTICE;
  if (decision === 'REJECTED') return KP_REJECTED_NOTICE;
  return undefined;
}

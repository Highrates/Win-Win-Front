import type {
  EmailNotificationListItem,
  EmailNotificationRecipients,
  EmailNotificationRevision,
  EmailSendPath,
  EmailTemplateFields,
} from '@win-win/admin-sections';

export type {
  EmailNotificationDetail,
  EmailNotificationListItem,
  EmailNotificationRevision,
  EmailPreview,
  EmailSampleVariant,
  EmailSendPath,
  EmailTemplateFields,
  EmailTestSendResult,
} from '@win-win/admin-sections';

export const EMAIL_NOTIFICATIONS_API = 'settings/admin/email-notifications';
export const EMAIL_NOTIFICATIONS_HREF = '/admin/settings/email-notifications';

export function emailNotificationApi(eventKey: string, suffix = ''): string {
  return `${EMAIL_NOTIFICATIONS_API}/${encodeURIComponent(eventKey)}${suffix}`;
}

export const AUDIENCE_LABEL: Record<EmailNotificationListItem['audience'], string> = {
  customer: 'Клиентам',
  staff: 'Сотрудникам',
};

export const SEND_PATH_META: Record<EmailSendPath, { short: string; title: string; tone: 'on' | 'off' | 'warn' }> = {
  rendered_db: { short: 'Шаблон', title: 'Письмо собрано по шаблону из админки и отправлено', tone: 'on' },
  rendered_legacy: {
    short: 'Резерв',
    title: 'Шаблон из админки не загрузился (обычно база данных была недоступна) — ушло письмо с текстом по умолчанию',
    tone: 'warn',
  },
  skipped_disabled: { short: 'Выключено', title: 'Уведомление выключено — письмо не отправлялось', tone: 'off' },
  failed: { short: 'Ошибка', title: 'Письмо не отправлено: ошибка почтового сервера', tone: 'warn' },
};

const RECIPIENTS_INLINE = 3;

/** «a@x, b@x, c@x и ещё 2»; полный список и источник — в `title`. */
export function recipientsSummary(recipients: EmailNotificationRecipients): { label: string; title: string; empty: boolean } {
  const source =
    recipients.source === 'env'
      ? 'Адреса заданы в настройках сервера'
      : 'Администраторы и модераторы с доступом к разделу «Заказы»';
  if (!recipients.emails.length) {
    return { label: 'Получателей нет — письмо не уйдёт', title: source, empty: true };
  }
  const shown = recipients.emails.slice(0, RECIPIENTS_INLINE).join(', ');
  const rest = recipients.emails.length - RECIPIENTS_INLINE;
  return {
    label: `Получатели: ${shown}${rest > 0 ? ` и ещё ${rest}` : ''}`,
    title: `${source}:\n${recipients.emails.join('\n')}`,
    empty: false,
  };
}

const FIELD_LABEL: Record<keyof EmailTemplateFields, string> = {
  subject: 'Тема',
  title: 'Заголовок',
  body: 'Сообщение',
};

export const TEMPLATE_FIELDS = Object.keys(FIELD_LABEL) as (keyof EmailTemplateFields)[];

export function templateFieldLabel(field: keyof EmailTemplateFields): string {
  return FIELD_LABEL[field];
}

/** Что поменялось, когда версию `before` заменили на `after`: «Тема, сообщение», «Отправка». */
export function revisionChanges(
  before: EmailNotificationRevision,
  after: EmailTemplateFields & { enabled: boolean },
): string[] {
  const changed: string[] = TEMPLATE_FIELDS.filter((f) => before[f] !== after[f]).map((f) => FIELD_LABEL[f]);
  if (before.enabled !== after.enabled) changed.push(after.enabled ? 'Включено' : 'Выключено');
  return changed;
}

/** Последний сбой хранится отдельно от последней отправки — успешное письмо его не затирает. */
export function lastErrorSummary(item: EmailNotificationListItem): { label: string; title: string } | null {
  if (!item.lastErrorAt || !item.lastErrorPath) return null;
  const meta = SEND_PATH_META[item.lastErrorPath];
  return {
    label: `Последний сбой: ${meta.short.toLowerCase()}, ${formatDateTime(item.lastErrorAt)}`,
    title: item.lastErrorMessage ? `${meta.title}\n\nПричина: ${item.lastErrorMessage}` : meta.title,
  };
}

const DATE_TIME = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_TIME.format(d);
}

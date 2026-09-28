'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminBackendRequestError, adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import local from './emailNotifications.module.css';
import {
  AUDIENCE_LABEL,
  EMAIL_NOTIFICATIONS_API,
  EMAIL_NOTIFICATIONS_HREF,
  SEND_PATH_META,
  emailNotificationApi,
  formatDateTime,
  lastErrorSummary,
  recipientsSummary,
  type EmailNotificationListItem,
  type EmailSendPath,
} from './emailNotificationsShared';

type ListFilter = 'all' | 'customer' | 'staff' | 'off' | 'custom';

function toneClass(tone: 'on' | 'off' | 'warn'): string {
  const byTone = { on: catalogStyles.badgeOn, off: catalogStyles.badgeOff, warn: local.badgeWarn };
  return `${catalogStyles.badge} ${byTone[tone]}`;
}

export function EmailNotificationsAdminClient() {
  const { confirm } = useAdminConfirm();
  const [items, setItems] = useState<EmailNotificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListFilter>('all');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminBackendJson<EmailNotificationListItem[]>(EMAIL_NOTIFICATIONS_API);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof AdminBackendRequestError ? e.message : 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: items.length,
      customer: items.filter((r) => r.audience === 'customer').length,
      staff: items.filter((r) => r.audience === 'staff').length,
      off: items.filter((r) => !r.enabled).length,
      custom: items.filter((r) => r.isCustomized).length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    if (filter === 'customer' || filter === 'staff') return items.filter((r) => r.audience === filter);
    if (filter === 'off') return items.filter((r) => !r.enabled);
    if (filter === 'custom') return items.filter((r) => r.isCustomized);
    return items;
  }, [items, filter]);

  async function toggle(row: EmailNotificationListItem, next: boolean) {
    if (!next) {
      const ok = await confirm({
        title: 'Выключить письмо?',
        message: `«${row.label}» перестанет отправляться сразу. Письмо с текстом по умолчанию тоже не уйдёт. Текст шаблона сохранится.`,
        confirmLabel: 'Выключить',
      });
      if (!ok) return;
    }
    setBusyKey(row.eventKey);
    setNotice(null);
    setError(null);
    try {
      const updated = await adminBackendJson<EmailNotificationListItem>(emailNotificationApi(row.eventKey), {
        method: 'PUT',
        body: JSON.stringify({ enabled: next }),
      });
      setItems((prev) => prev.map((r) => (r.eventKey === row.eventKey ? { ...r, ...pickListFields(updated) } : r)));
      setNotice(next ? `«${row.label}» включено` : `«${row.label}» выключено`);
    } catch (e) {
      setError(e instanceof AdminBackendRequestError ? e.message : 'Не удалось изменить статус');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className={local.page}>
      <AdminTabs
        ariaLabel="Фильтр уведомлений"
        variant="pill"
        activeId={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: `Все (${counts.all})` },
          { id: 'customer', label: `Клиентам (${counts.customer})` },
          { id: 'staff', label: `Сотрудникам (${counts.staff})` },
          { id: 'off', label: `Выключенные (${counts.off})` },
          { id: 'custom', label: `Изменённые (${counts.custom})` },
        ]}
      />

      <details className={local.legend}>
        <summary>Что значит «Последняя отправка»</summary>
        <ul className={local.legendList}>
          {(Object.keys(SEND_PATH_META) as EmailSendPath[]).map((key) => (
            <li key={key}>
              <span className={toneClass(SEND_PATH_META[key].tone)}>{SEND_PATH_META[key].short}</span>
              <span>{SEND_PATH_META[key].title}</span>
            </li>
          ))}
        </ul>
      </details>

      {notice ? (
        <p className={catalogStyles.muted} style={{ margin: '0 0 12px' }} role="status">
          {notice}
        </p>
      ) : null}

      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void load()}
        loadingLabel="Загрузка…"
        empty="Нет уведомлений по фильтру"
        isEmpty={!loading && filtered.length === 0}
      >
        <table className={catalogStyles.table}>
          <thead>
            <tr>
              <th>Событие</th>
              <th>Кому</th>
              <th>Отправка</th>
              <th>Последняя отправка</th>
              <th>Изменено</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const path = row.lastSendPath ? SEND_PATH_META[row.lastSendPath] : null;
              const lastError = lastErrorSummary(row);
              const lastSendIsError = lastError !== null && row.lastErrorAt === row.lastSendAt;
              const recipients = row.recipients ? recipientsSummary(row.recipients) : null;
              return (
                <tr key={row.eventKey}>
                  <td>
                    <div>{row.label}</div>
                    <div className={local.cellSub}>{row.description}</div>
                    {recipients ? (
                      <div
                        className={`${local.cellSub} ${recipients.empty ? local.recipientsEmpty : ''}`}
                        title={recipients.title}
                      >
                        {recipients.label}
                      </div>
                    ) : null}
                    {row.isCustomized ? <div className={local.cellSub}>Текст изменён</div> : null}
                  </td>
                  <td className={catalogStyles.mutedInline}>{AUDIENCE_LABEL[row.audience]}</td>
                  <td>
                    <label className={catalogStyles.labelCheckboxRow}>
                      <AccountCheckbox
                        className={catalogStyles.adminCheckboxForm}
                        checked={row.enabled}
                        disabled={busyKey === row.eventKey}
                        onChange={(e) => void toggle(row, e.target.checked)}
                        aria-label={row.enabled ? `Выключить «${row.label}»` : `Включить «${row.label}»`}
                      />
                      <span className={toneClass(row.enabled ? 'on' : 'off')}>
                        {row.enabled ? 'Включено' : 'Выключено'}
                      </span>
                    </label>
                  </td>
                  <td>
                    {path ? (
                      <>
                        <span className={toneClass(path.tone)} title={lastSendIsError ? lastError.title : path.title}>
                          {path.short}
                        </span>
                        <div className={local.cellSub}>{formatDateTime(row.lastSendAt)}</div>
                      </>
                    ) : (
                      <span className={catalogStyles.mutedInline}>—</span>
                    )}
                    {lastError && !lastSendIsError ? (
                      <div className={local.cellSub} title={lastError.title}>
                        {lastError.label}
                      </div>
                    ) : null}
                  </td>
                  <td className={catalogStyles.mutedInline}>
                    {formatDateTime(row.lastEditedAt)}
                    {row.lastEditedByEmail ? <div className={local.cellSub}>{row.lastEditedByEmail}</div> : null}
                  </td>
                  <td className={catalogStyles.tableCellActions}>
                    <Link
                      href={`${EMAIL_NOTIFICATIONS_HREF}/${encodeURIComponent(row.eventKey)}`}
                      className={catalogStyles.tableIconLink}
                      aria-label={`Изменить «${row.label}»`}
                      title="Изменить"
                    >
                      <img src="/icons/edit.svg" alt="" width={20} height={20} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminListShell>
    </div>
  );
}

function pickListFields(d: EmailNotificationListItem): Partial<EmailNotificationListItem> {
  return {
    enabled: d.enabled,
    isCustomized: d.isCustomized,
    updatedAt: d.updatedAt,
    lastEditedAt: d.lastEditedAt,
    lastEditedByEmail: d.lastEditedByEmail,
  };
}

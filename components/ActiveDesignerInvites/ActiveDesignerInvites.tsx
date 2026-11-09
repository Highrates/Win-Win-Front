'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountConfirmDialog } from '@/components/AccountConfirmDialog/AccountConfirmDialog';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import btnStyles from '@/components/Button/Button.module.css';
import profileSheetStyles from '@/app/(site)/(account)/account/profile/page.module.css';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import {
  formatInviteRowMeta,
  formatResendResultMessage,
  resendDesignerInvite,
  revokeDesignerInvite,
  summarizeInviteStatuses,
  type ActiveDesignerInviteApi,
  type DesignerInviteStatusCounts,
} from '@/lib/designerInvites/activeInvites';
import styles from './ActiveDesignerInvites.module.css';

const DEFAULT_VISIBLE = 5;

type ActiveDesignerInvitesProps = {
  items: ActiveDesignerInviteApi[];
  /** Компактный вариант — в одну строку с кнопкой приглашения */
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** После revoke/resend — обновить список. */
  onChanged?: () => void;
  /**
   * Сворачиваемая секция (команда): заголовок «Приглашения (N)», по умолчанию первые 5.
   */
  collapsible?: boolean;
  visibleLimit?: number;
  /** Полные счётчики по статусам (не только по загруженной странице). */
  statusCounts?: DesignerInviteStatusCounts | null;
  truncated?: boolean;
  listLimit?: number;
  total?: number;
};

export function ActiveDesignerInvites({
  items,
  compact = false,
  loading = false,
  error = null,
  onRetry,
  onChanged,
  collapsible = false,
  visibleLimit = DEFAULT_VISIBLE,
  statusCounts = null,
  truncated = false,
  listLimit = 50,
  total,
}: ActiveDesignerInvitesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ActiveDesignerInviteApi | null>(null);
  const pendingCount = items.filter(
    (i) => i.status === 'pending' || i.status === 'pending_admin',
  ).length;
  const [open, setOpen] = useState(false);
  const syncedOpenRef = useRef(false);

  /** Первый раз после загрузки: открыть, если есть ожидающие. */
  useEffect(() => {
    if (!collapsible || syncedOpenRef.current) return;
    if (loading) return;
    if (items.length === 0) return;
    syncedOpenRef.current = true;
    setOpen(pendingCount > 0);
  }, [collapsible, loading, items.length, pendingCount]);

  const copyLink = useCallback(async (item: ActiveDesignerInviteApi) => {
    if (!item.inviteLink) return;
    setCopyErrorId(null);
    try {
      await copyTextToClipboard(item.inviteLink);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 3000);
    } catch {
      setCopiedId(null);
      setCopyErrorId(item.id);
    }
  }, []);

  const runAction = useCallback(
    async (item: ActiveDesignerInviteApi, action: 'revoke' | 'resend') => {
      if (action === 'revoke') {
        setRevokeTarget(item);
        return;
      }
      setActionError(null);
      setActionStatus(null);
      setBusyId(item.id);
      try {
        const result = await resendDesignerInvite(item.id);
        setActionStatus(formatResendResultMessage(result));
        onChanged?.();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusyId(null);
      }
    },
    [onChanged],
  );

  const confirmRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    const item = revokeTarget;
    setActionError(null);
    setActionStatus(null);
    setBusyId(item.id);
    try {
      await revokeDesignerInvite(item.id);
      setActionStatus(`Приглашение для ${item.email} отозвано.`);
      setRevokeTarget(null);
      onChanged?.();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
    } finally {
      setBusyId(null);
    }
  }, [onChanged, revokeTarget]);

  if (error) {
    return (
      <section
        className={compact ? styles.wrapCompact : styles.wrap}
        aria-label="Приглашения дизайнеров-партнёров"
      >
        <AccountErrorState message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (loading && items.length === 0) {
    return (
      <section
        className={compact ? styles.wrapCompact : styles.wrap}
        aria-label="Приглашения дизайнеров-партнёров"
        aria-busy="true"
      >
        <p className={styles.statusMuted}>Загрузка приглашений…</p>
      </section>
    );
  }

  if (items.length === 0) return null;

  const visibleItems =
    collapsible && !expanded ? items.slice(0, Math.max(1, visibleLimit)) : items;
  const hiddenCount = Math.max(0, items.length - visibleItems.length);

  const summary = summarizeInviteStatuses(statusCounts ?? items);
  const totalLabel = typeof total === 'number' ? total : items.length;

  const list = (
    <>
      {!collapsible ? (
        <p className={styles.heading}>Ваши приглашения: {summary}</p>
      ) : (
        <p className={styles.heading}>{summary}</p>
      )}
      {truncated ? (
        <p className={styles.statusMuted}>Показаны последние {listLimit}</p>
      ) : null}
      {actionError ? (
        <p className={styles.actionError} role="alert">
          {actionError}
        </p>
      ) : null}
      {actionStatus ? (
        <p className={styles.actionStatus} role="status">
          {actionStatus}
        </p>
      ) : null}
      <ul className={styles.list}>
        {visibleItems.map((item) => {
          const status = item.status ?? 'pending';
          const busy = busyId === item.id;
          return (
            <li key={item.id} className={styles.item}>
              <span className={styles.email}>{item.email}</span>
              <span className={styles.meta}>{formatInviteRowMeta(item)}</span>
              {copyErrorId === item.id ? (
                <span className={styles.actionError} role="alert">
                  Не удалось скопировать. Выделите ссылку вручную.
                </span>
              ) : null}
              <span className={styles.actions}>
                {status === 'pending' && item.inviteLink ? (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${copiedId === item.id ? profileSheetStyles.inviteLinkCopyBtnDone : ''} ${styles.copyBtn}`}
                    onClick={() => {
                      void copyLink(item);
                    }}
                    disabled={busy}
                  >
                    {copiedId === item.id ? 'Скопировано!' : 'Копировать ссылку'}
                  </button>
                ) : null}
                {item.canResend ? (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.copyBtn}`}
                    disabled={busy}
                    onClick={() => {
                      void runAction(item, 'resend');
                    }}
                  >
                    {busy ? '…' : 'Переотправить'}
                  </button>
                ) : null}
                {item.canRevoke ? (
                  <button
                    type="button"
                    className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.copyBtn}`}
                    disabled={busy}
                    onClick={() => {
                      void runAction(item, 'revoke');
                    }}
                  >
                    {busy ? '…' : 'Отозвать'}
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className={styles.showMore}
          onClick={() => setExpanded(true)}
        >
          Показать ещё {hiddenCount}
        </button>
      ) : null}
      {expanded && items.length > visibleLimit ? (
        <button type="button" className={styles.showMore} onClick={() => setExpanded(false)}>
          Свернуть
        </button>
      ) : null}
    </>
  );

  const revokeDialog = (
    <AccountConfirmDialog
      open={Boolean(revokeTarget)}
      title={
        revokeTarget
          ? `Отозвать приглашение для ${revokeTarget.email}?`
          : 'Отозвать приглашение?'
      }
      confirmLabel="Отозвать"
      cancelLabel="Отмена"
      danger
      busy={Boolean(revokeTarget && busyId === revokeTarget.id)}
      onClose={() => {
        if (revokeTarget && busyId === revokeTarget.id) return;
        setRevokeTarget(null);
      }}
      onConfirm={() => void confirmRevoke()}
    >
      <p>Ссылка перестанет действовать. При необходимости можно отправить новое приглашение.</p>
    </AccountConfirmDialog>
  );

  if (!collapsible) {
    return (
      <section
        className={compact ? styles.wrapCompact : styles.wrap}
        aria-label="Приглашения дизайнеров-партнёров"
      >
        {list}
        {revokeDialog}
      </section>
    );
  }

  return (
    <>
      <details
        className={`${compact ? styles.wrapCompact : styles.wrap} ${styles.invitesDetails}`}
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className={styles.invitesSummary}>
          Приглашения ({totalLabel})
        </summary>
        <div className={styles.invitesBody}>{list}</div>
      </details>
      {revokeDialog}
    </>
  );
}

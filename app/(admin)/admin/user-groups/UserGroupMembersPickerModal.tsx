'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminUserGroupsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminSkipTakeParams } from '@/lib/adminListResponse';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import own from './UserGroupMembersPickerModal.module.css';

type ClientPickerRow = {
  id: string;
  email: string | null;
  phone: string | null;
  profile: { firstName: string | null; lastName: string | null } | null;
};

function formatClientPickerName(row: ClientPickerRow): string {
  const name = [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(' ').trim();
  return name || row.email?.trim() || row.phone?.trim() || row.id;
}

type Props = {
  open: boolean;
  excludedUserIds: ReadonlySet<string>;
  saving?: boolean;
  onClose: () => void;
  onSave: (userIds: string[]) => void | Promise<void>;
};

export function UserGroupMembersPickerModal({
  open,
  excludedUserIds,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminUserGroupsPage(locale), [locale]);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [results, setResults] = useState<ClientPickerRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setQ('');
    setDebouncedQ('');
    setResults([]);
    setSelectedIds(new Set());
    setError(null);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSearching(true);
    setError(null);
    void (async () => {
      try {
        const json = await adminBackendJson<{ items: ClientPickerRow[] }>(
          `users/admin?${adminSkipTakeParams({ page: 1, limit: 50, q: debouncedQ })}`,
        );
        if (!cancelled) setResults(json.items ?? []);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setError(e instanceof Error ? e.message : t.errLoad);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQ, t.errLoad]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = ph;
      body.style.overflow = pb;
    };
  }, [open, onClose, saving]);

  function toggleUser(userId: string) {
    if (excludedUserIds.has(userId) || saving) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function confirm() {
    if (selectedIds.size === 0 || saving) return;
    setError(null);
    try {
      await onSave(Array.from(selectedIds));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errAddMember);
    }
  }

  if (!open) return null;

  return (
    <div
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-group-members-picker-title"
      onMouseDown={(e) => {
        if (!saving && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`${modalStyles.panel} ${modalStyles.panelWide}`}>
        <div className={modalStyles.panelHead}>
          <h2 id="user-group-members-picker-title" className={modalStyles.panelTitle}>
            {t.memberPickerTitle}
          </h2>
          <AdminModalCloseButton
            label={t.memberPickerClose}
            disabled={saving}
            onClick={onClose}
          />
        </div>
        <div className={`${modalStyles.body} ${own.body}`}>
          <AdminSearchBox
            className={catalogStyles.searchBoxFull}
            placeholder={t.memberSearchPlaceholder}
            ariaLabel={t.memberSearchAria}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {selectedIds.size > 0 ? (
            <p className={own.selectedHint}>{t.memberPickerSelected(selectedIds.size)}</p>
          ) : null}
          {error ? <p className={catalogStyles.error}>{error}</p> : null}
          {searching ? <p className={catalogStyles.muted}>{t.loading}</p> : null}
          {!searching && results.length === 0 ? (
            <p className={catalogStyles.muted}>
              {debouncedQ ? t.memberSearchEmpty : t.memberPickerEmptyList}
            </p>
          ) : null}
          {!searching && results.length > 0 ? (
            <div className={`${catalogStyles.tableWrap} ${own.tableWrap}`}>
              <table className={catalogStyles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 44 }} aria-hidden />
                    <th>{t.colMemberName}</th>
                    <th>{t.colMemberEmail}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((u) => {
                    const inGroup = excludedUserIds.has(u.id);
                    const checked = inGroup || selectedIds.has(u.id);
                    const displayName = formatClientPickerName(u);
                    return (
                      <tr key={u.id} className={inGroup ? own.rowDisabled : undefined}>
                        <td>
                          <AccountCheckbox
                            id={`ug-member-pick-${u.id}`}
                            className={catalogStyles.adminCheckboxInTable}
                            checked={checked}
                            disabled={inGroup || saving}
                            onChange={() => toggleUser(u.id)}
                            aria-label={
                              inGroup
                                ? t.memberAlreadyInGroup
                                : `${displayName}${checked ? '' : ` — ${t.memberPickerSelectRow}`}`
                            }
                          />
                        </td>
                        <td>{displayName}</td>
                        <td>
                          {inGroup
                            ? t.memberAlreadyInGroup
                            : u.email?.trim() || u.phone?.trim() || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className={modalStyles.panelFooter}>
          <AdminCompactBtn type="button" variant="outline" disabled={saving} onClick={onClose}>
            {t.memberPickerCancel}
          </AdminCompactBtn>
          <AdminCompactBtn
            variant="accent"
            disabled={saving || selectedIds.size === 0}
            onClick={() => void confirm()}
          >
            {saving ? t.saving : t.memberPickerSave(selectedIds.size)}
          </AdminCompactBtn>
        </div>
      </div>
    </div>
  );
}

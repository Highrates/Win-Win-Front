'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import styles from './page.module.css';

type CaseRow = {
  id: string;
  title: string;
  shortDescription: string | null;
  roomTypes: unknown;
  createdAt: string;
};

function roomTypesLine(roomTypes: unknown): string {
  if (!Array.isArray(roomTypes)) return '';
  return roomTypes
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .join(', ');
}

export function AccountCasesPageClient() {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [items, setItems] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [query, setQuery] = useState('');

  const loadCases = useCallback(async () => {
    const res = await fetch('/api/user/cases', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) throw new Error(await readApiErrorMessage(res));
    const j = (await res.json()) as unknown;
    const list = Array.isArray(j) ? (j as CaseRow[]) : [];
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await loadCases();
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setError('Сеть или сервер недоступны');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (it.title ?? '').toLowerCase().includes(q));
  }, [items, query]);

  const empty = !loading && !error && items.length === 0;

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set(filtered.map((it) => it.id)));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filtered.map((it) => it.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        return next;
      });
    }
  };

  const onBulkDelete = async () => {
    const ids = Array.from(selectedIds).filter((id) => items.some((it) => it.id === id));
    if (!ids.length) return;
    if (!confirm(`Удалить выбранные кейсы (${ids.length})?`)) return;
    setBulkDeleting(true);
    setError(null);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/user/cases/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        setError(`Не удалось удалить часть кейсов (${failed.length})`);
      }
      const list = await loadCases();
      setItems(list);
      exitSelectionMode();
      router.refresh();
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setBulkDeleting(false);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((it) => selectedIds.has(it.id));

  return (
    <div className={styles.page}>
      {empty ? (
        <div style={{ paddingTop: 18 }}>
          <p style={{ marginTop: 0, marginBottom: 12 }}>У вас пока нет кейсов!</p>
          <Button variant="primary" onClick={() => router.push('/account/cases/new')}>
            Добавить новый кейс
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.topBar}>
            <SearchBox
              placeholder="Поиск кейса"
              ariaLabel="Поиск кейса"
              className={styles.caseSearchBox}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="primary" onClick={() => router.push('/account/cases/new')}>
              +Добавить кейс
            </Button>
          </div>

          <div className={styles.productsTopRowOrders}>
            {!selectionMode ? (
              <button type="button" className={styles.selectAllButton} onClick={enterSelectionMode}>
                Выбрать все
              </button>
            ) : (
              <div className={styles.selectionToolbar}>
                <button type="button" className={styles.selectAllButton} onClick={exitSelectionMode}>
                  Отменить
                </button>
                <button
                  type="button"
                  className={styles.selectAllButton}
                  onClick={toggleSelectAllFiltered}
                  aria-pressed={allFilteredSelected}
                >
                  {allFilteredSelected ? 'Снять выделение' : 'Выделить все на экране'}
                </button>
                <button
                  type="button"
                  className={styles.deleteCasesIconBtn}
                  onClick={onBulkDelete}
                  disabled={bulkDeleting || selectedIds.size === 0}
                  aria-label={bulkDeleting ? 'Удаление…' : 'Удалить выбранные'}
                >
                  <img src="/icons/delete.svg" alt="" width={20} height={20} className={styles.iconDelete} />
                </button>
              </div>
            )}
          </div>

          {error ? (
            <p style={{ color: 'var(--color-red)', marginTop: 8 }} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.casesList}>
            {loading
              ? [0, 1, 2, 3].map((k) => (
                  <div key={k} className={styles.caseSkeletonWrapper} aria-hidden>
                    <div className={styles.skeletonTitle} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonDesc}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonDescShort}`} />
                  </div>
                ))
              : null}
            {!loading &&
              filtered.map((item) => (
                <div key={item.id} className={styles.casesWrapper}>
                  {selectionMode ? (
                    <input
                      type="checkbox"
                      className={styles.caseCheckbox}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                      aria-label={`Выбрать кейс «${item.title}»`}
                    />
                  ) : null}
                  <div className={styles.casesWrapperInner}>
                    <div className={styles.caseHead}>
                      <div className={styles.caseTitle}>{item.title}</div>
                      <div className={styles.caseMeta}>{roomTypesLine(item.roomTypes)}</div>
                    </div>
                    <div className={styles.caseDescription}>{item.shortDescription ?? ''}</div>
                  </div>

                  <button
                    type="button"
                    className={styles.editCaseButton}
                    onClick={() => router.push(`/account/cases/${encodeURIComponent(item.id)}`)}
                  >
                    <img src="/icons/edit.svg" alt="" width={16} height={16} aria-hidden />
                    <span>Редактировать кейс</span>
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

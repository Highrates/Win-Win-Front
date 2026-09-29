'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountConfirmDialog } from '@/components/AccountConfirmDialog/AccountConfirmDialog';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { GRID_CARD_ASPECTS } from '@/app/(site)/(public)/designers/designerProjectsTypes';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import {
  type ApiCase,
  coverUrlsFromUnknown,
  parseApiCaseList,
  roomTypesCommaSeparated,
} from '@/lib/account/caseApiSchema';
import styles from './page.module.css';

function caseCoverUrl(item: ApiCase): string | null {
  const urls = coverUrlsFromUnknown(item.coverImageUrls, 1);
  return urls[0] ?? null;
}

function useMasonryColCount() {
  const [cols, setCols] = useState(4);
  useLayoutEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w <= 768) setCols(2);
      else if (w <= 1100) setCols(3);
      else setCols(4);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return cols;
}

function distributeRoundRobin<T>(items: T[], colCount: number): { item: T; index: number }[][] {
  const n = Math.max(1, colCount);
  const cols: { item: T; index: number }[][] = Array.from({ length: n }, () => []);
  items.forEach((item, index) => {
    cols[index % n].push({ item, index });
  });
  return cols;
}

export function AccountCasesPageClient() {
  const router = useRouter();
  const masonryCols = useMasonryColCount();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [items, setItems] = useState<ApiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const loadCases = useCallback(async (q: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await fetch(`/api/user/cases${qs}`, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) {
      const msg = await readApiErrorMessage(res);
      const err = new Error(msg) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return parseApiCaseList(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await loadCases(debouncedQ);
        if (!cancelled) {
          setItems(list);
          setSelectedIds((prev) => {
            if (!prev.size) return prev;
            const next = new Set<string>();
            Array.from(prev).forEach((id) => {
              if (list.some((it) => it.id === id)) next.add(id);
            });
            return next;
          });
        }
      } catch (e) {
        if (!cancelled) {
          const status =
            e && typeof e === 'object' && 'status' in e ? Number((e as { status: number }).status) : 0;
          if (status === 403) {
            const msg = e instanceof Error ? e.message.trim() : '';
            setError(msg || 'Доступно только партнёрам Wupapa');
          } else if (status > 0 && e instanceof Error && e.message.trim()) {
            setError(e.message);
          } else {
            setError('Сеть или сервер недоступны');
          }
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCases, debouncedQ, reloadToken]);

  const empty = !loading && !error && items.length === 0 && !debouncedQ;
  const emptySearch = !loading && !error && items.length === 0 && Boolean(debouncedQ);

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
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

  const toggleSelectAll = () => {
    const ids = items.map((it) => it.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  };

  const onBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds).filter((id) => items.some((it) => it.id === id));
    if (!ids.length) return;
    setBulkDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/user/cases/bulk-delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        setError(await readApiErrorMessage(res));
        return;
      }
      setConfirmOpen(false);
      const list = await loadCases(debouncedQ);
      setItems(list);
      exitSelectionMode();
      router.refresh();
    } catch {
      setError('Сеть или сервер недоступны');
    } finally {
      setBulkDeleting(false);
    }
  };

  const allSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const selectedCount = useMemo(
    () => Array.from(selectedIds).filter((id) => items.some((it) => it.id === id)).length,
    [selectedIds, items],
  );

  const gridColumns = useMemo(
    () => distributeRoundRobin(items, masonryCols),
    [items, masonryCols],
  );

  const skeletonColumns = useMemo(() => {
    const placeholders = Array.from({ length: 8 }, (_, i) => i);
    return distributeRoundRobin(placeholders, masonryCols);
  }, [masonryCols]);

  if (error && !loading && items.length === 0 && !debouncedQ) {
    return (
      <div className={styles.page}>
        <AccountErrorState message={error} onRetry={() => setReloadToken((n) => n + 1)} />
      </div>
    );
  }

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
                Выбрать
              </button>
            ) : (
              <div className={styles.selectionToolbar}>
                <button type="button" className={styles.selectAllButton} onClick={exitSelectionMode}>
                  Отменить
                </button>
                <button
                  type="button"
                  className={styles.selectAllButton}
                  onClick={toggleSelectAll}
                  aria-pressed={allSelected}
                  disabled={items.length === 0}
                >
                  {allSelected ? 'Снять выделение' : 'Выделить все'}
                </button>
                <button
                  type="button"
                  className={styles.deleteCasesIconBtn}
                  onClick={() => setConfirmOpen(true)}
                  disabled={bulkDeleting || selectedCount === 0}
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

          {emptySearch ? (
            <p className={styles.emptySearch} role="status">
              Ничего не найдено по запросу «{debouncedQ}»
            </p>
          ) : null}

          <div className={styles.casesGrid} aria-busy={loading || undefined} aria-label="Кейсы">
            {loading
              ? skeletonColumns.map((column, colIdx) => (
                  <div key={colIdx} className={styles.casesColumn}>
                    {column.map(({ item: i, index }) => (
                      <div
                        key={i}
                        className={styles.caseSkeletonCard}
                        style={{ aspectRatio: GRID_CARD_ASPECTS[index % GRID_CARD_ASPECTS.length] }}
                        aria-hidden
                      />
                    ))}
                  </div>
                ))
              : gridColumns.map((column, colIdx) => (
                  <div key={colIdx} className={styles.casesColumn}>
                    {column.map(({ item, index }) => {
                      const cover = caseCoverUrl(item);
                      const meta = roomTypesCommaSeparated(item.roomTypes);
                      const href = `/account/cases/${encodeURIComponent(item.id)}`;
                      return (
                        <div
                          key={item.id}
                          className={styles.caseCard}
                          style={{ aspectRatio: GRID_CARD_ASPECTS[index % GRID_CARD_ASPECTS.length] }}
                        >
                          {cover ? (
                            <img src={cover} alt={item.title} className={styles.caseCardImg} />
                          ) : (
                            <span className={styles.caseCardPlaceholder} aria-hidden />
                          )}
                          <span className={styles.caseCardOverlay} aria-hidden />
                          <div className={styles.caseCardCaption}>
                            <p className={styles.caseCardTitle}>{item.title}</p>
                            {meta ? <p className={styles.caseCardMeta}>{meta}</p> : null}
                          </div>
                          {selectionMode ? (
                            <>
                              <input
                                type="checkbox"
                                className={styles.caseCheckbox}
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleRow(item.id)}
                                aria-label={`Выбрать кейс «${item.title}»`}
                              />
                              <button
                                type="button"
                                className={styles.caseCardOpenBtn}
                                onClick={() => toggleRow(item.id)}
                                aria-label={`Выбрать кейс «${item.title}»`}
                              />
                            </>
                          ) : (
                            <>
                              <span className={styles.caseCardEditHint}>
                                <img
                                  src="/icons/edit.svg"
                                  alt=""
                                  width={14}
                                  height={14}
                                  className={styles.caseCardEditHintIcon}
                                  aria-hidden
                                />
                                Редактировать
                              </span>
                              <Link
                                href={href}
                                className={styles.caseCardOpenLink}
                                aria-label={`Редактировать кейс «${item.title}»`}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
          </div>
        </>
      )}

      <AccountConfirmDialog
        open={confirmOpen}
        title="Удалить выбранные кейсы?"
        confirmLabel={bulkDeleting ? 'Удаление…' : `Удалить (${selectedCount})`}
        cancelLabel="Отмена"
        danger
        busy={bulkDeleting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void onBulkDeleteConfirm()}
      >
        <p>
          Будет удалено кейсов: {selectedCount}. Действие необратимо.
        </p>
      </AccountConfirmDialog>
    </div>
  );
}

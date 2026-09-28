'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountDocRow } from '@/components/AccountDocRow/AccountDocRow';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button';
import buttonStyles from '@/components/Button/Button.module.css';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { TransitionLink } from '@/components/SiteTransition/TransitionLink';
import { SourcingRequestModal } from '@/components/SourcingRequest/SourcingRequestModal';
import { useSourcingPromoFlow } from '@/components/SourcingRequest/useSourcingPromoFlow';
import { accountDocFileType } from '@/lib/account/docFileType';
import {
  accountDocChannelLabel,
  accountDocGroupHeading,
  accountDocsCountLabel,
  accountDocSourceHref,
  accountDocSourceLabel,
  groupAccountDocsByDate,
} from '@/lib/account/docsTimeline';
import {
  accountDocumentFileHref,
  fetchAccountDocumentGroups,
  fetchAccountDocuments,
  type AccountDocument,
  type AccountDocumentGroup,
  type AccountDocumentsFilter,
} from '@/lib/account/documentsApi';
import { formatAccountDocDateHeader, formatAccountDocShortDate } from '@/lib/account/formatAccountDocDate';
import { accountLoadErrorText } from '@/lib/account/loadErrorMessage';
import { ACCOUNT_WORK_FEED_REFRESH_EVENT } from '@/lib/account/orders';
import { AccountDocsListSkeleton } from './AccountDocsListSkeleton';
import styles from './page.module.css';

const FILTERS: readonly { id: AccountDocumentsFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'orders', label: 'Заказы' },
  { id: 'sourcing', label: 'Подборы' },
  { id: 'mine', label: 'Мои загрузки' },
];
const FILTER_LABELS = FILTERS.map((f) => f.label);

const VIEWS = ['По датам', 'По заказам'] as const;
const VIEW_BY_SOURCE = 1;

const SEARCH_DEBOUNCE_MS = 300;

type Status = 'loading' | 'ready' | 'error';
type GroupMoreState = { loading: boolean; error: string | null };

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

function compareDesc(a: { at: string; id: string }, b: { at: string; id: string }): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Свежая первая страница поверх уже загруженных: новые версии по id, порядок ленты — дата ↓, id ↓. */
function mergeFreshDocs(prev: AccountDocument[], fresh: AccountDocument[]): AccountDocument[] {
  const byId = new Map(prev.map((d) => [d.id, d]));
  for (const d of fresh) byId.set(d.id, d);
  return Array.from(byId.values()).sort((a, b) =>
    compareDesc({ at: a.createdAt, id: a.id }, { at: b.createdAt, id: b.id }),
  );
}

/**
 * Свежая первая страница групп: раскрытые группы сохраняют догруженные документы.
 * `replace` — показана одна страница групп, её и заменяем; иначе подмешиваем к загруженным.
 */
function mergeFreshGroups(
  prev: AccountDocumentGroup[],
  fresh: AccountDocumentGroup[],
  replace: boolean,
): AccountDocumentGroup[] {
  const prevByKey = new Map(prev.map((g) => [g.key, g]));
  const merged = fresh.map((g) => {
    const old = prevByKey.get(g.key);
    if (!old || old.items.length <= g.items.length) return g;
    return { ...g, items: mergeFreshDocs(old.items, g.items), nextCursor: old.nextCursor };
  });
  if (replace) return merged;
  const freshKeys = new Set(fresh.map((g) => g.key));
  return [...merged, ...prev.filter((g) => !freshKeys.has(g.key))].sort((a, b) =>
    compareDesc({ at: a.latestAt, id: a.key }, { at: b.latestAt, id: b.key }),
  );
}

export function AccountDocsPageClient() {
  const sourcingFlow = useSourcingPromoFlow();

  const [filterIndex, setFilterIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');

  const [docs, setDocs] = useState<AccountDocument[]>([]);
  const [groups, setGroups] = useState<AccountDocumentGroup[]>([]);
  const [groupMore, setGroupMore] = useState<Record<string, GroupMoreState>>({});
  /** Курсор следующей страницы ленты (по датам) или следующей страницы групп (по заказам). */
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  /** Были ли у пользователя документы хоть раз — иначе тулбар фильтров не нужен. */
  const [hasAnyDocs, setHasAnyDocs] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const filter = FILTERS[filterIndex]?.id ?? 'all';
  const bySource = viewIndex === VIEW_BY_SOURCE;
  const isFiltered = filter !== 'all' || query.length > 0;
  const requestRef = useRef<AbortController | null>(null);
  const silentRef = useRef<AbortController | null>(null);
  /** Сколько страниц показано: при одной тихое обновление заменяет ленту целиком, иначе подмешивает новые. */
  const pagesLoadedRef = useRef(0);
  const statusRef = useRef<Status>(status);
  statusRef.current = status;
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    requestRef.current?.abort();
    silentRef.current?.abort();
    const ctrl = new AbortController();
    requestRef.current = ctrl;
    pagesLoadedRef.current = 0;
    setStatus('loading');
    setError(null);
    setMoreError(null);
    setLoadingMore(false);
    setGroupMore({});
    void (async () => {
      try {
        let found: boolean;
        if (bySource) {
          const page = await fetchAccountDocumentGroups({ filter, q: query, signal: ctrl.signal });
          if (ctrl.signal.aborted) return;
          setGroups(page.groups);
          setNextCursor(page.nextCursor);
          found = page.groups.length > 0;
        } else {
          const page = await fetchAccountDocuments({ filter, q: query, signal: ctrl.signal });
          if (ctrl.signal.aborted) return;
          setDocs(page.items);
          setNextCursor(page.nextCursor);
          found = page.items.length > 0;
        }
        pagesLoadedRef.current = 1;
        if (found) setHasAnyDocs(true);
        setStatus('ready');
      } catch (e) {
        if (isAbort(e) || ctrl.signal.aborted) return;
        setError(accountLoadErrorText(e, 'документы'));
        setStatus('error');
      }
    })();
    return () => ctrl.abort();
  }, [filter, query, bySource, reloadTick]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const ctrl = requestRef.current;
    // Тихая замена первой страницы сдвинула бы курсор под догружаемую страницу — отменяем её.
    silentRef.current?.abort();
    setLoadingMore(true);
    setMoreError(null);
    try {
      if (bySource) {
        const page = await fetchAccountDocumentGroups({ filter, q: query, cursor: nextCursor, signal: ctrl?.signal });
        if (ctrl?.signal.aborted) return;
        setGroups((prev) => {
          const seen = new Set(prev.map((g) => g.key));
          return [...prev, ...page.groups.filter((g) => !seen.has(g.key))];
        });
        setNextCursor(page.nextCursor);
      } else {
        const page = await fetchAccountDocuments({ filter, q: query, cursor: nextCursor, signal: ctrl?.signal });
        if (ctrl?.signal.aborted) return;
        setDocs((prev) => {
          const seen = new Set(prev.map((d) => d.id));
          return [...prev, ...page.items.filter((d) => !seen.has(d.id))];
        });
        setNextCursor(page.nextCursor);
      }
      pagesLoadedRef.current += 1;
    } catch (e) {
      if (isAbort(e) || ctrl?.signal.aborted) return;
      setMoreError(accountLoadErrorText(e, 'документы'));
    } finally {
      if (!ctrl?.signal.aborted) setLoadingMore(false);
    }
  }, [filter, query, bySource, nextCursor, loadingMore]);

  /** Остальные документы группы в виде «По заказам». */
  const loadGroupRest = useCallback(
    async (group: AccountDocumentGroup) => {
      if (!group.nextCursor || groupMore[group.key]?.loading) return;
      const ctrl = requestRef.current;
      setGroupMore((prev) => ({ ...prev, [group.key]: { loading: true, error: null } }));
      try {
        let cursor: string | null = group.nextCursor;
        const loaded: AccountDocument[] = [];
        while (cursor) {
          const page = await fetchAccountDocuments({ filter, q: query, group: group.key, cursor, signal: ctrl?.signal });
          if (ctrl?.signal.aborted) return;
          loaded.push(...page.items);
          cursor = page.nextCursor;
        }
        setGroups((prev) =>
          prev.map((g) => {
            if (g.key !== group.key) return g;
            const seen = new Set(g.items.map((d) => d.id));
            return { ...g, items: [...g.items, ...loaded.filter((d) => !seen.has(d.id))], nextCursor: null };
          }),
        );
        setGroupMore((prev) => ({ ...prev, [group.key]: { loading: false, error: null } }));
      } catch (e) {
        if (isAbort(e) || ctrl?.signal.aborted) return;
        setGroupMore((prev) => ({
          ...prev,
          [group.key]: { loading: false, error: accountLoadErrorText(e, 'документы') },
        }));
      }
    },
    [filter, query, groupMore],
  );

  /** Обновление без скелетона и без показа ошибок: новые документы от менеджера появляются сами. */
  const refreshSilently = useCallback(async () => {
    if (statusRef.current !== 'ready' || loadingMoreRef.current) return;
    silentRef.current?.abort();
    const ctrl = new AbortController();
    silentRef.current = ctrl;
    const mainRequest = requestRef.current;
    const replace = pagesLoadedRef.current <= 1;
    try {
      if (bySource) {
        const page = await fetchAccountDocumentGroups({ filter, q: query, signal: ctrl.signal });
        if (ctrl.signal.aborted || mainRequest !== requestRef.current) return;
        if (page.groups.length > 0) setHasAnyDocs(true);
        setGroups((prev) => mergeFreshGroups(prev, page.groups, replace));
        if (replace) setNextCursor(page.nextCursor);
      } else {
        const page = await fetchAccountDocuments({ filter, q: query, signal: ctrl.signal });
        if (ctrl.signal.aborted || mainRequest !== requestRef.current) return;
        if (page.items.length > 0) setHasAnyDocs(true);
        if (replace) {
          setDocs(page.items);
          setNextCursor(page.nextCursor);
        } else {
          setDocs((prev) => mergeFreshDocs(prev, page.items));
        }
      }
    } catch {
      /* тихое обновление: при ошибке оставляем текущую ленту */
    }
  }, [filter, query, bySource]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshSilently();
    };
    const onFeedRefresh = () => void refreshSilently();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, onFeedRefresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, onFeedRefresh);
      silentRef.current?.abort();
    };
  }, [refreshSilently]);

  const resetFilters = useCallback(() => {
    setFilterIndex(0);
    setSearchInput('');
    setQuery('');
  }, []);

  const dateGroups = useMemo(() => groupAccountDocsByDate(docs), [docs]);

  const isEmpty = bySource ? groups.length === 0 : docs.length === 0;
  const isEmptyAccount = status === 'ready' && isEmpty && !isFiltered;
  /** Первая загрузка: тулбар на месте, но неактивен — чтобы макет не прыгал после ответа. */
  const toolbarPending = status === 'loading' && !hasAnyDocs && !isFiltered;
  const showToolbar = hasAnyDocs || isFiltered || toolbarPending;

  if (isEmptyAccount) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <p className={styles.muted}>
            Здесь появятся документы по заказам и подборам: счета, акты, накладные, договоры и УПД от менеджера, а
            также файлы из переписки и заявок на подбор.
          </p>
          <div className={styles.emptyActions}>
            <TransitionLink
              href="/account/orders?tab=work"
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
            >
              <span>Перейти к заказам</span>
            </TransitionLink>
            <Button type="button" variant="secondary" onClick={sourcingFlow.openFreshModal}>
              Заказать подбор
            </Button>
          </div>
        </div>
        <SourcingRequestModal {...sourcingFlow.modalProps} />
      </div>
    );
  }

  const renderRow = (doc: AccountDocument, inGroup: boolean) => (
    <AccountDocRow
      key={doc.id}
      title={doc.title}
      fileType={accountDocFileType(doc)}
      meta={inGroup ? accountDocChannelLabel(doc) : accountDocSourceLabel(doc)}
      metaHref={accountDocSourceHref(doc)}
      metaSuffix={inGroup ? formatAccountDocShortDate(doc.createdAt) : undefined}
      href={accountDocumentFileHref(doc.id)}
      action={doc.external ? 'external' : doc.inline ? 'open' : 'download'}
    />
  );

  const renderGroup = (group: AccountDocumentGroup) => {
    const heading = accountDocGroupHeading(group);
    const more = groupMore[group.key];
    const rest = group.total - group.items.length;
    return (
      <section key={group.key} className={styles.dateBlock}>
        <div className={styles.dateWrapper}>
          <h2 className={styles.dateLabel}>
            <Link href={heading.href} className={styles.groupTitleLink}>
              {heading.title}
            </Link>
          </h2>
          <span className={styles.dateLine} aria-hidden />
        </div>
        <div className={styles.docsWrapper}>{group.items.map((doc) => renderRow(doc, true))}</div>
        {more?.error ? <AccountErrorState message={more.error} onRetry={() => void loadGroupRest(group)} /> : null}
        {group.nextCursor && rest > 0 && !more?.error ? (
          <div className={styles.groupMore}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadGroupRest(group)}
              disabled={more?.loading}
              aria-label={`${heading.title}: показать ещё ${accountDocsCountLabel(rest)}`}
            >
              {more?.loading ? 'Загрузка…' : `Ещё ${accountDocsCountLabel(rest)}`}
            </Button>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div className={styles.page}>
      {showToolbar ? (
        <fieldset className={styles.toolbar} disabled={toolbarPending} aria-label="Фильтры документов">
          <div className={styles.toolbarRow}>
            <div className={styles.filters}>
              <AccountProjectTabs
                mode="toggle"
                projects={FILTER_LABELS}
                selectedIndex={filterIndex}
                onSelect={setFilterIndex}
                ariaLabel="Фильтр документов"
              />
            </div>
            <div className={styles.viewToggle}>
              <AccountProjectTabs
                mode="toggle"
                projects={VIEWS}
                selectedIndex={viewIndex}
                onSelect={setViewIndex}
                ariaLabel="Группировка документов"
              />
            </div>
          </div>
          <SearchBox
            placeholder="Поиск по названию: договор, счёт, КП…"
            ariaLabel="Поиск документов по названию"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </fieldset>
      ) : null}

      {status === 'loading' ? <AccountDocsListSkeleton /> : null}

      {status === 'error' && error ? (
        <AccountErrorState message={error} onRetry={() => setReloadTick((n) => n + 1)} />
      ) : null}

      {status === 'ready' && isEmpty ? (
        <div className={styles.empty}>
          <p className={styles.muted}>
            {query ? `По запросу «${query}» ничего не найдено.` : 'В этом разделе пока нет документов.'}
          </p>
          <div className={styles.emptyActions}>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'ready' && !isEmpty ? (
        <div className={styles.list} aria-label="Документы">
          {bySource
            ? groups.map(renderGroup)
            : dateGroups.map((group) => (
                <section key={group.dateISO} className={styles.dateBlock}>
                  <div className={styles.dateWrapper}>
                    <h2 className={styles.dateLabel}>{formatAccountDocDateHeader(group.dateISO)}</h2>
                    <span className={styles.dateLine} aria-hidden />
                  </div>
                  <div className={styles.docsWrapper}>{group.docs.map((doc) => renderRow(doc, false))}</div>
                </section>
              ))}

          {moreError ? <AccountErrorState message={moreError} onRetry={() => void loadMore()} /> : null}

          {nextCursor && !moreError ? (
            <div className={styles.loadMore}>
              <Button type="button" variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? 'Загрузка…' : 'Показать ещё'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <SourcingRequestModal {...sourcingFlow.modalProps} />
    </div>
  );
}

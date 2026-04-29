'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import type { CatalogProductSearchHit, CatalogProductSearchResponse } from '@/lib/catalogPublic';
import styles from './CaseProductsField.module.css';

export type CaseProductPick = { id: string; slug: string; name: string };

type TabKey = 'all' | 'orders';

const PAGE_SIZE = 32;
const MAX_PICK = 80;

/** Заглушка вкладки «Заказы» (позже — реальные заказы дизайнера). */
const MOCK_ORDER_HITS: CatalogProductSearchHit[] = [
  {
    id: 'demo-order-1',
    slug: 'catalog',
    name: 'Заказ № 10482 — пример',
    priceMin: 156_000,
    thumbUrl: '/images/placeholder.svg',
  },
  {
    id: 'demo-order-2',
    slug: 'catalog',
    name: 'Заказ № 10491 — пример',
    priceMin: 48_900,
    thumbUrl: '/images/placeholder.svg',
  },
  {
    id: 'demo-order-3',
    slug: 'catalog',
    name: 'Заказ № 10503 — пример',
    priceMin: 2_120_000,
    thumbUrl: '/images/placeholder.svg',
  },
];

function hitToPick(hit: CatalogProductSearchHit): CaseProductPick {
  return { id: String(hit.id), slug: hit.slug, name: hit.name };
}

function hitPrice(hit: CatalogProductSearchHit): number {
  const n = hit.priceMin ?? hit.price;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function hitThumb(hit: CatalogProductSearchHit): string | undefined {
  const u = hit.thumbUrl ?? hit.imageUrls?.[0];
  return typeof u === 'string' && u.trim() ? u : undefined;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  value: CaseProductPick[];
  onChange: (next: CaseProductPick[]) => void;
};

export function CaseProductsField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('all');
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [hits, setHits] = useState<CatalogProductSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchRaw), 300);
    return () => window.clearTimeout(t);
  }, [searchRaw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'all') return;
    let cancelled = false;
    setLoading(true);
    setHits([]);
    setTotal(0);
    void (async () => {
      const qs = new URLSearchParams({ page: '1', limit: String(PAGE_SIZE) });
      const q = debouncedQ.trim();
      if (q) qs.set('q', q);
      try {
        const res = await fetch(`/api/public/catalog/products/search?${qs}`, { cache: 'no-store' });
        const data = (await res.json()) as CatalogProductSearchResponse;
        if (cancelled) return;
        setHits(Array.isArray(data.hits) ? data.hits : []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      } catch {
        if (!cancelled) {
          setHits([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, debouncedQ]);

  const orderHits = useMemo(() => {
    const q = searchRaw.trim().toLowerCase();
    if (!q) return MOCK_ORDER_HITS;
    return MOCK_ORDER_HITS.filter((h) => h.name.toLowerCase().includes(q));
  }, [searchRaw]);

  const loadMore = useCallback(async () => {
    if (tab !== 'all' || loading || loadingMore) return;
    if (hits.length >= total) return;
    const nextPage = Math.floor(hits.length / PAGE_SIZE) + 1;
    setLoadingMore(true);
    try {
      const qs = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
      const q = debouncedQ.trim();
      if (q) qs.set('q', q);
      const res = await fetch(`/api/public/catalog/products/search?${qs}`, { cache: 'no-store' });
      const data = (await res.json()) as CatalogProductSearchResponse;
      const chunk = Array.isArray(data.hits) ? data.hits : [];
      setHits((prev) => {
        const seen = new Set(prev.map((h) => h.id));
        const merged = [...prev];
        for (const h of chunk) {
          if (seen.has(h.id)) continue;
          seen.add(h.id);
          merged.push(h);
        }
        return merged;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [tab, loading, loadingMore, hits.length, total, debouncedQ]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || tab !== 'all') return;
    if (loading || loadingMore) return;
    if (hits.length >= total) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      void loadMore();
    }
  }, [tab, loading, loadingMore, hits.length, total, loadMore]);

  const openModal = () => {
    setTab('all');
    setSearchRaw('');
    setDebouncedQ('');
    setHits([]);
    setTotal(0);
    setOpen(true);
  };

  const toggleHit = (hit: CatalogProductSearchHit) => {
    const pick = hitToPick(hit);
    const exists = value.find((v) => v.id === pick.id);
    if (exists) {
      const placeholder = exists.name.trim() === 'Товар' || exists.name.trim().length === 0;
      if (placeholder && pick.name.trim().length > 0) {
        onChange(value.map((v) => (v.id === pick.id ? pick : v)));
        return;
      }
      onChange(value.filter((v) => v.id !== pick.id));
      return;
    }
    if (value.length >= MAX_PICK) return;
    onChange([...value, pick]);
  };

  const removeId = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  const listForGrid = tab === 'all' ? hits : orderHits;

  return (
    <div className={styles.field}>
      <span className={styles.label}>Выберите товары</span>
      <Button type="button" variant="secondary" className={styles.openBtn} onClick={openModal}>
        {value.length ? `Изменить выбор (${value.length})` : 'Открыть каталог'}
      </Button>
      {value.length > 0 ? (
        <div className={styles.chips}>
          {value.map((p) => (
            <span key={p.id} className={styles.chip}>
              <span className={styles.chipName} title={p.name}>
                {p.name.trim() ? p.name : 'Товар'}
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Убрать «${p.name}»`}
                onClick={() => removeId(p.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="case-products-modal-title">
            <div className={styles.panelHead}>
              <h2 id="case-products-modal-title" className={styles.panelTitle}>
                Товары в кейсе
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </div>
            <div className={styles.tabs}>
              <button
                type="button"
                className={styles.tab}
                data-active={tab === 'all' || undefined}
                onClick={() => setTab('all')}
              >
                Все товары
              </button>
              <button
                type="button"
                className={styles.tab}
                data-active={tab === 'orders' || undefined}
                onClick={() => setTab('orders')}
              >
                Заказы
              </button>
            </div>
            <div className={styles.toolbar}>
              <SearchBox
                className={styles.toolbarSearch}
                placeholder={tab === 'all' ? 'Поиск по каталогу' : 'Поиск по заказам'}
                ariaLabel={tab === 'all' ? 'Поиск по каталогу' : 'Поиск по заказам'}
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
              />
            </div>
            <div ref={scrollRef} className={styles.scroll} onScroll={onScroll}>
              {tab === 'all' && loading ? <div className={styles.loadingRow}>Загрузка…</div> : null}
              <div className={styles.grid}>
                {listForGrid.map((hit) => (
                  <ProductCardSmall
                    key={hit.id}
                    slug={hit.slug}
                    name={hit.name}
                    price={hitPrice(hit)}
                    imageUrl={hitThumb(hit)}
                    pickMode
                    selected={value.some((v) => v.id === hit.id)}
                    onPickToggle={() => toggleHit(hit)}
                  />
                ))}
              </div>
              {tab === 'all' && !loading && hits.length === 0 ? (
                <div className={styles.endRow}>Ничего не найдено</div>
              ) : null}
              {tab === 'all' && loadingMore ? <div className={styles.loadingRow}>Подгрузка…</div> : null}
              {tab === 'all' && !loading && hits.length > 0 && hits.length >= total ? (
                <div className={styles.endRow}>Показаны все товары по запросу</div>
              ) : null}
            </div>
            <div className={styles.panelFooter}>
              <Button type="button" variant="primary" className={styles.confirmBtn} onClick={() => setOpen(false)}>
                Выбрать
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

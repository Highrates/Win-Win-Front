'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import type { CatalogProductSearchHit, CatalogProductSearchResponse } from '@/lib/catalogPublic';
import styles from './CaseProductsField.module.css';

export type CaseProductPick = { id: string; slug: string; name: string };

const PAGE_SIZE = 32;
const MAX_PICK = 80;

function hitToPick(hit: CatalogProductSearchHit): CaseProductPick {
  return { id: String(hit.id), slug: hit.slug, name: hit.name };
}

function hitPrice(hit: CatalogProductSearchHit): number {
  const n = hit.priceMin ?? hit.price;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
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
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [hits, setHits] = useState<CatalogProductSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const closeModal = useCallback(() => setOpen(false), []);
  useModalBodyLock(open, closeModal);
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchRaw), 300);
    return () => window.clearTimeout(t);
  }, [searchRaw]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, debouncedQ]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
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
  }, [loading, loadingMore, hits.length, total, debouncedQ]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (loading || loadingMore) return;
    if (hits.length >= total) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      void loadMore();
    }
  }, [loading, loadingMore, hits.length, total, loadMore]);

  const openModal = () => {
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

  const selectedLabel =
    value.length === 0
      ? 'Ничего не выбрано'
      : value.length === 1
        ? 'Выбран 1 товар'
        : `Выбрано: ${value.length}`;

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
        <>
          <button type="button" className={styles.overlay} aria-label="Закрыть" onClick={closeModal} />
          <div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-products-modal-title"
            tabIndex={-1}
          >
            <div className={styles.panelHead}>
              <div className={styles.panelHeadText}>
                <h2 id="case-products-modal-title" className={styles.panelTitle}>
                  Товары в кейсе
                </h2>
                <p className={styles.panelSubtitle}>{selectedLabel}</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={closeModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </div>
            <div className={styles.toolbar}>
              <SearchBox
                className={styles.toolbarSearch}
                placeholder="Поиск по каталогу"
                ariaLabel="Поиск по каталогу"
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
              />
            </div>
            <div ref={scrollRef} className={styles.scroll} onScroll={onScroll}>
              {loading ? <div className={styles.loadingRow}>Загрузка…</div> : null}
              {!loading && hits.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateTitle}>Ничего не найдено</p>
                  <p className={styles.emptyStateHint}>Попробуйте другой запрос или сбросьте поиск.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {hits.map((hit) => (
                    <ProductCardSmall
                      key={hit.id}
                      slug={hit.slug}
                      name={hit.name}
                      price={hitPrice(hit)}
                      imageUrl={
                        typeof hit.thumbUrl === 'string' && hit.thumbUrl.trim() ? hit.thumbUrl : undefined
                      }
                      imageUrls={hit.imageUrls}
                      pickMode
                      selected={value.some((v) => v.id === hit.id)}
                      onPickToggle={() => toggleHit(hit)}
                    />
                  ))}
                </div>
              )}
              {loadingMore ? <div className={styles.loadingRow}>Подгрузка…</div> : null}
              {!loading && hits.length > 0 && hits.length >= total ? (
                <div className={styles.endRow}>Показаны все товары по запросу</div>
              ) : null}
            </div>
            <div className={styles.panelFooter}>
              <p className={styles.footerCount}>{selectedLabel}</p>
              <Button type="button" variant="primary" className={styles.confirmBtn} onClick={closeModal}>
                Готово
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

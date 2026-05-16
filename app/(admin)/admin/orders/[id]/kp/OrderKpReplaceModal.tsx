'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import type { AdminProductRow } from '@/app/(admin)/admin/catalog/products/adminProductTypes';
import {
  buildSnapshotFromAdminVariant,
  type AdminVariantForKpSnapshot,
} from '@/lib/commercialProposal/buildSnapshotFromAdminVariant';
import modalStyles from '@/app/(account)/account/projects/components/CreateEditProjectModal.module.css';
import styles from '../../../catalog/catalogAdmin.module.css';
import own from './OrderKpReplaceModal.module.css';

type ProductDetail = {
  id: string;
  name: string;
  variants: { id: string; variantLabel: string | null; price: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (payload: {
    productId: string;
    productVariantId: string | null;
    snapshot: Record<string, unknown>;
  }) => void;
};

export function OrderKpReplaceModal({ open, onClose, onApply }: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AdminProductRow[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [variantId, setVariantId] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setQ('');
    setDebouncedQ('');
    setResults([]);
    setProductId(null);
    setDetail(null);
    setVariantId('');
    setError(null);
    setSearching(false);
    setLoadingDetail(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reset();
  }, [open, reset]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadProduct = useCallback(async (id: string) => {
    setProductId(id);
    setLoadingDetail(true);
    setError(null);
    setVariantId('');
    try {
      const p = await adminBackendJson<ProductDetail>(`catalog/admin/products/${encodeURIComponent(id)}`);
      setDetail(p);
      const first = p.variants?.[0]?.id;
      if (first) setVariantId(first);
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить товар');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!open || productId) return;
    let cancelled = false;
    void (async () => {
      setSearching(true);
      setError(null);
      try {
        const params = debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : '';
        const list = await adminBackendJson<AdminProductRow[]>(`catalog/admin/products${params}`);
        if (!cancelled) setResults(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setError(e instanceof Error ? e.message : 'Ошибка поиска');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQ, productId]);

  const variantOptions = useMemo(() => detail?.variants ?? [], [detail]);

  async function confirm() {
    if (!detail || !variantId) {
      setError('Выберите вариант SKU');
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const v = await adminBackendJson<AdminVariantForKpSnapshot>(
        `catalog/admin/products/${encodeURIComponent(detail.id)}/variants/${encodeURIComponent(variantId)}`,
      );
      const snapshot = buildSnapshotFromAdminVariant(v);
      onApply({ productId: detail.id, productVariantId: variantId, snapshot });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить вариант');
    } finally {
      setApplying(false);
    }
  }

  function backToSearch() {
    setProductId(null);
    setDetail(null);
    setVariantId('');
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-replace-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={modalStyles.panel} style={{ maxWidth: 560, width: '100%' }}>
        <div className={modalStyles.panelHead}>
          <h2 id="kp-replace-title" className={modalStyles.panelTitle}>
            Заменить товар
          </h2>
          <button
            type="button"
            className={modalStyles.closeBtn}
            style={{ fontSize: 28, lineHeight: 1, fontWeight: 300 }}
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={`${modalStyles.body} ${own.body}`}>
          {!productId ? (
            <div className={own.searchBlock}>
              <label className={styles.cardNote} style={{ display: 'block', marginBottom: 6 }}>
                Поиск по названию или slug
              </label>
              <input
                className={styles.input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Например, диван"
                style={{ width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
                autoFocus
              />
              {searching ? <p className={styles.cardNote}>Поиск…</p> : null}
              {!searching && results.length === 0 ? (
                <p className={styles.cardNote}>{debouncedQ ? 'Ничего не найдено' : 'Введите запрос или выберите из списка'}</p>
              ) : null}
              <ul className={own.resultsList}>
                {results.map((r) => (
                  <li key={r.id} style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      className={styles.backLink}
                      style={{ textAlign: 'left', width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
                      onClick={() => void loadProduct(r.id)}
                    >
                      {r.name}
                      <span className={styles.cardNote} style={{ marginLeft: 8 }}>
                        {r.slug}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={own.productBlock}>
              {loadingDetail ? <p className={styles.cardNote}>Загрузка карточки…</p> : null}
              {detail && !loadingDetail ? (
                <>
                  <p className={own.productName}>{detail.name}</p>
                  <label className={styles.cardNote} htmlFor="kp-variant-select">
                    Вариант (SKU)
                  </label>
                  <select
                    id="kp-variant-select"
                    className={styles.input}
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {variantOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {(v.variantLabel || v.id).slice(0, 80)} — {v.price} ₽
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          )}
          {error ? <p style={{ color: 'var(--color-red, #c53029)', margin: '8px 0' }}>{error}</p> : null}
        </div>
        <div className={modalStyles.panelFooter}>
          {productId ? (
            <button type="button" className={styles.btn} onClick={backToSearch}>
              Назад к поиску
            </button>
          ) : null}
          <button type="button" className={styles.btn} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!detail || !variantId || applying}
            onClick={() => void confirm()}
          >
            {applying ? 'Применение…' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
}
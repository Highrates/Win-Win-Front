'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import {
  buildSnapshotFromAdminVariant,
  type AdminVariantForKpSnapshot,
} from '@/lib/commercialProposal/buildSnapshotFromAdminVariant';
import modalStyles from '@/app/(account)/account/projects/components/CreateEditProjectModal.module.css';
import styles from '../../../catalog/catalogAdmin.module.css';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  thumbUrl: string | null;
};

type ProductDetail = {
  id: string;
  name: string;
  variants: { id: string; variantLabel: string | null; price: string }[];
};

type Props = {
  open: boolean;
  /** Открыть сразу карточку этого товара (смена SKU / тот же товар). */
  initialProductId?: string | null;
  onClose: () => void;
  onApply: (payload: {
    productId: string;
    productVariantId: string | null;
    snapshot: Record<string, unknown>;
  }) => void;
};

export function OrderKpReplaceModal({ open, initialProductId, onClose, onApply }: Props) {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProductRow[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [variantId, setVariantId] = useState<string>('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setQ('');
    setResults([]);
    setProductId(null);
    setDetail(null);
    setVariantId('');
    setError(null);
  }, []);

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
    if (!open) {
      reset();
      return;
    }
    reset();
    if (initialProductId) void loadProduct(initialProductId);
  }, [open, initialProductId, reset, loadProduct]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        setError(null);
        try {
          const list = await adminBackendJson<ProductRow[]>(
            `catalog/admin/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`,
          );
          setResults(Array.isArray(list) ? list : []);
        } catch (e) {
          setResults([]);
          setError(e instanceof Error ? e.message : 'Ошибка поиска');
        } finally {
          setSearching(false);
        }
      })();
    }, 300);
    return () => window.clearTimeout(t);
  }, [open, q]);

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
        <div className={modalStyles.body}>
        <label className={styles.cardNote} style={{ display: 'block', marginBottom: 6 }}>
          Поиск по названию или slug
        </label>
        <input
          className={styles.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Например, диван"
          style={{ width: '100%', marginBottom: 12 }}
        />
        {searching ? <p className={styles.cardNote}>Поиск…</p> : null}
        {!productId ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', maxHeight: 200, overflow: 'auto' }}>
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
        ) : null}

        {productId && loadingDetail ? <p className={styles.cardNote}>Загрузка карточки…</p> : null}
        {detail ? (
          <div style={{ marginBottom: 12 }}>
            <p className={styles.cardTitle} style={{ margin: '0 0 8px' }}>
              {detail.name}
            </p>
            <label className={styles.cardNote} htmlFor="kp-variant-select">
              Вариант (SKU)
            </label>
            <select
              id="kp-variant-select"
              className={styles.input}
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              style={{ width: '100%' }}
            >
              {variantOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {(v.variantLabel || v.id).slice(0, 80)} — {v.price} ₽
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error ? <p style={{ color: 'var(--color-red, #c53029)', margin: '8px 0' }}>{error}</p> : null}
        </div>
        <div className={modalStyles.panelFooter}>
          {productId ? (
            <button type="button" className={styles.btn} onClick={() => setProductId(null)}>
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

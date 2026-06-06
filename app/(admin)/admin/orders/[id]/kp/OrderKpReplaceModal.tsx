'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import type { AdminProductRow } from '@/app/(admin)/admin/catalog/products/adminProductTypes';
import {
  buildSnapshotFromAdminVariant,
  type AdminVariantForKpSnapshot,
} from '@/lib/commercialProposal/buildSnapshotFromAdminVariant';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import styles from '../../../catalog/catalogAdmin.module.css';
import kpStyles from './kpEditor.module.css';
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
        const res = await adminBackendList<AdminProductRow>(
          'catalog/admin/products',
          adminListParams({ page: 1, limit: 50, q: debouncedQ }),
        );
        if (!cancelled) setResults(res.items);
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
      <div className={modalStyles.panel}>
        <div className={modalStyles.panelHead}>
          <h2 id="kp-replace-title" className={modalStyles.panelTitle}>
            Заменить товар
          </h2>
          <button
            type="button"
            className={styles.modalCloseIconBtn}
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={`${modalStyles.body} ${own.body}`}>
          {!productId ? (
            <div className={own.searchBlock}>
              <AdminSearchBox
                className={styles.searchBoxFull}
                placeholder="Например, диван"
                ariaLabel="Поиск по названию или slug"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {searching ? <p className={styles.muted}>Поиск…</p> : null}
              {!searching && results.length === 0 ? (
                <p className={styles.muted}>
                  {debouncedQ ? 'Ничего не найдено' : 'Введите запрос или выберите из списка'}
                </p>
              ) : null}
              <ul className={own.resultsList}>
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={kpStyles.resultPickBtn}
                      onClick={() => void loadProduct(r.id)}
                    >
                      {r.name}
                      <span className={styles.mutedInline}> {r.slug}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={own.productBlock}>
              {loadingDetail ? <p className={styles.muted}>Загрузка карточки…</p> : null}
              {detail && !loadingDetail ? (
                <>
                  <p className={own.productName}>{detail.name}</p>
                  <AdminSelect
                    label="Вариант (SKU)"
                    id="kp-variant-select"
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value)}
                  >
                    {variantOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {(v.variantLabel || v.id).slice(0, 80)} — {v.price} ₽
                      </option>
                    ))}
                  </AdminSelect>
                </>
              ) : null}
            </div>
          )}
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className={modalStyles.panelFooter}>
          {productId ? (
            <AdminCompactBtn type="button" variant="outline" onClick={backToSearch}>
              Назад к поиску
            </AdminCompactBtn>
          ) : null}
          <AdminCompactBtn type="button" variant="outline" onClick={onClose}>
            Отмена
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="accent"
            disabled={!detail || !variantId || applying}
            onClick={() => void confirm()}
          >
            {applying ? 'Применение…' : 'Применить'}
          </AdminCompactBtn>
        </div>
      </div>
    </div>
  );
}

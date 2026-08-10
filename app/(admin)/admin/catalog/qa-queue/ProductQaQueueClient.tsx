'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminProductQaChatProducts,
  type ProductQaChatProductItem,
} from '@/lib/adminProductQa/adminProductQaApi';
import { ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT } from '@/lib/productQa/constants';
import {
  ProductChatInboxList,
  type ProductChatInboxItem,
} from '@/components/ProductChatInbox/ProductChatInboxList';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductQaQueueStrings } from '@/lib/admin-i18n/adminProductQaQueueI18n';
import catalogStyles from '../catalogAdmin.module.css';
import { AdminProductQaChatOverlay, type AdminQaChatTab } from './AdminProductQaChatOverlay';
import styles from './ProductQaQueueClient.module.css';

function defaultTab(row: ProductQaChatProductItem): AdminQaChatTab {
  if (row.correspondenceAwaitingPublish > 0) return 'correspondence';
  if (row.publicQaPending > 0) return 'qa';
  return 'correspondence';
}

export function ProductQaQueueClient() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductQaQueueStrings(locale), [locale]);

  const [items, setItems] = useState<ProductQaChatProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductQaChatProductItem | null>(null);
  const [initialTab, setInitialTab] = useState<AdminQaChatTab>('correspondence');

  const toInboxItem = useCallback(
    (row: ProductQaChatProductItem): ProductChatInboxItem => {
      const badges: ProductChatInboxItem['badges'] = [];
      if (row.awaitingStaffReply) {
        badges.push({ key: 'awaiting', label: s.badgeAwaitingReply, tone: 'pending' });
      }
      if (row.correspondenceAwaitingPublish > 0) {
        badges.push({
          key: 'unpublished',
          label: s.badgeUnpublished(row.correspondenceAwaitingPublish),
          tone: 'pending',
        });
      }
      if (row.publicQaPending > 0) {
        badges.push({
          key: 'pending',
          label: s.badgePendingModeration(row.publicQaPending),
          tone: 'pending',
        });
      }
      return {
        key: row.productId,
        productName: row.productName,
        productImageUrl: row.productImageUrl,
        lastMessageAt: row.lastMessageAt,
        lastMessagePreview: row.lastMessagePreview,
        badges,
      };
    },
    [s],
  );

  const load = useCallback(async (cursor?: string | null, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminProductQaChatProducts({
        cursor: cursor ?? undefined,
      });
      const pageItems = data.items ?? [];
      setItems((prev) => {
        const next = !append
          ? pageItems
          : (() => {
              const seen = new Set(prev.map((row) => row.productId));
              const merged = [...prev];
              for (const row of pageItems) {
                if (!seen.has(row.productId)) merged.push(row);
              }
              return merged;
            })();
        setSelected((sel) => {
          if (!sel) return sel;
          return next.find((row) => row.productId === sel.productId) ?? sel;
        });
        return next;
      });
      setHasMore(Boolean(data.hasMore));
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : s.loadError);
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [s.loadError]);

  useEffect(() => {
    void load(null, false);
    const onRefresh = () => {
      void load(null, false);
    };
    document.addEventListener(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT, onRefresh);
    return () => document.removeEventListener(ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT, onRefresh);
  }, [load]);

  const inboxItems = useMemo(() => items.map(toInboxItem), [items, toInboxItem]);

  const openRow = (row: ProductQaChatProductItem) => {
    setSelected(row);
    setInitialTab(defaultTab(row));
  };

  if (loading && items.length === 0) {
    return <p className={catalogStyles.muted}>{s.loading}</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className={styles.errorBlock}>
        <p className={catalogStyles.muted} role="alert">
          {error}
        </p>
        <button type="button" className={styles.retryBtn} onClick={() => void load(null, false)}>
          {s.retry}
        </button>
      </div>
    );
  }

  return (
    <>
      <ProductChatInboxList
        items={inboxItems}
        emptyLabel={s.empty}
        onSelect={(item) => {
          const row = items.find((r) => r.productId === item.key);
          if (row) openRow(row);
        }}
      />

      {hasMore ? (
        <button
          type="button"
          className={styles.loadMoreBtn}
          disabled={loadingMore}
          onClick={() => void load(nextCursor, true)}
        >
          {loadingMore ? s.loadMoreBusy : s.loadMore}
        </button>
      ) : null}

      {selected ? (
        <AdminProductQaChatOverlay
          key={selected.productId}
          productId={selected.productId}
          productName={selected.productName}
          initialTab={initialTab}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

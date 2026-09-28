'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProductQaChatPanel } from '@/components/ProductQa/ProductQaChatPanel';
import {
  ProductChatInboxList,
  type ProductChatInboxItem,
} from '@/components/ProductChatInbox/ProductChatInboxList';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { accountLoadErrorText } from '@/lib/account/loadErrorMessage';
import { fetchMyCorrespondenceProducts } from '@/lib/productCorrespondence/correspondenceApi';
import type { ProductCorrespondenceMyProductItem } from '@/lib/productCorrespondence/types';
import styles from './page.module.css';

/** Фоновое обновление статусов «Ожидает ответа» / «Есть ответ», пока вкладка видима. */
const INBOX_POLL_MS = 30_000;

function toInboxItem(item: ProductCorrespondenceMyProductItem): ProductChatInboxItem {
  const badges: ProductChatInboxItem['badges'] = [];
  if (item.awaitingStaffReply) {
    badges.push({ key: 'awaiting', label: 'Ожидает ответа', tone: 'pending' });
  } else if (item.hasStaffReply) {
    badges.push({ key: 'reply', label: 'Есть ответ', tone: 'neutral' });
  }
  return {
    key: item.productId,
    productName: item.productName,
    productImageUrl: item.productImageUrl,
    lastMessageAt: item.lastMessageAt,
    lastMessagePreview: item.lastMessagePreview,
    badges,
  };
}

export function AccountMyQuestionsPageClient() {
  const [items, setItems] = useState<ProductCorrespondenceMyProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openName, setOpenName] = useState('');
  const loadedOnceRef = useRef(false);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent && loadedOnceRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchMyCorrespondenceProducts();
      setItems(data.items ?? []);
      setError(null);
      loadedOnceRef.current = true;
    } catch (e: unknown) {
      if (silent) return;
      setError(accountLoadErrorText(e, 'вопросы'));
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void reload({ silent: true });
    };
    const timer = window.setInterval(refreshIfVisible, INBOX_POLL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [reload]);

  const inboxItems = useMemo(() => items.map(toInboxItem), [items]);

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.muted}>Загрузка…</p> : null}
      {error ? <AccountErrorState message={error} onRetry={() => void reload()} /> : null}

      {!loading && !error ? (
        <ProductChatInboxList
          items={inboxItems}
          emptyLabel="Вы ещё не задавали вопросов по товарам"
          onSelect={(item) => {
            const row = items.find((r) => r.productId === item.key);
            if (!row) return;
            setOpenSlug(row.productSlug);
            setOpenName(row.productName);
          }}
        />
      ) : null}

      {openSlug ? (
        <ProductQaChatPanel
          key={openSlug}
          presentation="overlay"
          chatOpen
          onChatClose={() => {
            setOpenSlug(null);
            void reload({ silent: true });
          }}
          enabled
          productSlug={openSlug}
          chatTitle={openName}
          loginReturnPath="/account/questions"
          postToCorrespondence
        />
      ) : null}
    </div>
  );
}

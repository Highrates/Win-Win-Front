'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductQaChatPanel } from '@/components/ProductQa/ProductQaChatPanel';
import {
  ProductChatInboxList,
  type ProductChatInboxItem,
} from '@/components/ProductChatInbox/ProductChatInboxList';
import { fetchMyCorrespondenceProducts } from '@/lib/productCorrespondence/correspondenceApi';
import type { ProductCorrespondenceMyProductItem } from '@/lib/productCorrespondence/types';
import styles from './page.module.css';

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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyCorrespondenceProducts();
      setItems(data.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить список');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const inboxItems = useMemo(() => items.map(toInboxItem), [items]);

  return (
    <div className={styles.page}>
      {loading ? <p className={styles.muted}>Загрузка…</p> : null}
      {error ? (
        <div className={styles.errorBlock}>
          <p className={styles.error} role="alert">
            {error}
          </p>
          <button type="button" className={styles.retryBtn} onClick={() => void reload()}>
            Повторить
          </button>
        </div>
      ) : null}

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
          onChatClose={() => setOpenSlug(null)}
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

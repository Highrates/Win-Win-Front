import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { PRODUCT_CARD_PLACEHOLDER, productCardImageOnError } from '@/lib/productCardImageUrls';
import { formatChatInboxWhen } from '@/lib/productChatInbox/formatWhen';
import styles from './ProductChatInboxList.module.css';

export type ProductChatInboxBadge = {
  key: string;
  label: string;
  tone: 'pending' | 'neutral';
};

export type ProductChatInboxItem = {
  key: string;
  productName: string;
  productImageUrl: string | null;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  badges?: ProductChatInboxBadge[];
};

type Props = {
  items: ProductChatInboxItem[];
  onSelect: (item: ProductChatInboxItem) => void;
  emptyLabel?: string;
  timeLocale?: string;
};

export function ProductChatInboxList({
  items,
  onSelect,
  emptyLabel = 'Пока нет чатов',
  timeLocale = 'ru-RU',
}: Props) {
  if (items.length === 0) {
    return <p className={styles.muted}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const imageSrc = item.productImageUrl
          ? resolveMediaUrlForServer(item.productImageUrl)
          : PRODUCT_CARD_PLACEHOLDER;
        return (
          <li key={item.key}>
            <button type="button" className={styles.row} onClick={() => onSelect(item)}>
              <img
                className={styles.thumb}
                src={imageSrc || PRODUCT_CARD_PLACEHOLDER}
                alt=""
                width={72}
                height={72}
                onError={productCardImageOnError}
              />
              <span className={styles.rowBody}>
                <span className={styles.productName}>{item.productName}</span>
                {item.lastMessagePreview ? (
                  <span className={styles.preview}>{item.lastMessagePreview}</span>
                ) : null}
                <span className={styles.meta}>
                  <time dateTime={item.lastMessageAt}>
                    {formatChatInboxWhen(item.lastMessageAt, timeLocale)}
                  </time>
                  {item.badges?.map((badge) => (
                    <span
                      key={badge.key}
                      className={
                        badge.tone === 'pending' ? styles.pendingBadge : styles.replyBadge
                      }
                    >
                      {badge.label}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

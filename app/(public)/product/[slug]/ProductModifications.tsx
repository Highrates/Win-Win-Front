'use client';

import styles from './ProductPage.module.css';

export type ProductModificationItem = {
  id: string;
  name: string;
  modificationSlug: string | null;
};

type Props = {
  modifications: ProductModificationItem[];
  selectedModificationId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Селектор модификаций. Стили переиспользуют `productSizeSelect`.
 * Переключение — чисто клиентское (через `onSelect`), без навигации, чтобы сохранять
 * локальный стейт selections; для SEO/deep-linking на бэке продолжаем читать `?m=`,
 * но здесь навигацию не триггерим.
 */
export default function ProductModifications({
  modifications,
  selectedModificationId,
  onSelect,
}: Props) {
  if (modifications.length <= 1) return null;
  return (
    <div className={styles.productModificationsSelect}>
      <span className={styles.productSizeTitle}>Модификация</span>
      <div className={styles.productSizeOptions} role="listbox" aria-label="Модификации">
        {modifications.map((m) => {
          const selected = selectedModificationId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`${styles.productSizeOption} ${selected ? styles.productSizeOptionSelected : ''}`}
              onClick={() => onSelect(m.id)}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

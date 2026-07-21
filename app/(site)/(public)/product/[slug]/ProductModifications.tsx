'use client';

import styles from './ProductModifications.module.css';

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
 * Селектор модификаций. Переключение — клиентское (toggle: повторный клик снимает выбор).
 * Для SEO/deep-linking на бэке читаем `?m=`; без query модификация не выбрана.
 */
export default function ProductModifications({
  modifications,
  selectedModificationId,
  onSelect,
}: Props) {
  if (modifications.length <= 1) return null;
  return (
    <div className={styles.select}>
      <span className={styles.title}>Модификация</span>
      <div className={styles.options} role="listbox" aria-label="Модификации">
        {modifications.map((m) => {
          const selected = selectedModificationId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
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

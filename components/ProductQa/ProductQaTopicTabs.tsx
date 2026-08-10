import { useCallback } from 'react';
import type { ProductQaTopic } from '@/lib/productQa/types';
import styles from './ProductQaTopicTabs.module.css';

type Props = {
  topics: ProductQaTopic[];
  activeTopicSlug: string;
  onSelect: (slug: string) => void;
  /** Префикс id для aria-controls (уникален на странице). */
  idPrefix?: string;
  /** Вариант стилей: storefront | admin */
  variant?: 'storefront' | 'admin';
  /** aria-label для вкладки (локализация счётчика). По умолчанию — RU plural. */
  formatTabAriaLabel?: (topic: ProductQaTopic) => string;
  tabListLabel?: string;
};

export function ProductQaTopicTabs({
  topics,
  activeTopicSlug,
  onSelect,
  idPrefix = 'product-qa',
  variant = 'storefront',
  tabListLabel = 'Темы вопросов',
  formatTabAriaLabel,
}: Props) {
  const panelId = `${idPrefix}-panel`;

  const focusTab = useCallback(
    (index: number) => {
      const topic = topics[index];
      if (!topic) return;
      onSelect(topic.slug);
      document.getElementById(`${idPrefix}-tab-${topic.slug}`)?.focus();
    },
    [idPrefix, onSelect, topics],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (topics.length <= 1) return;
      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % topics.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + topics.length) % topics.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = topics.length - 1;
      }
      if (nextIndex === null) return;
      e.preventDefault();
      focusTab(nextIndex);
    },
    [focusTab, topics.length],
  );

  if (topics.length <= 1) return null;

  return (
    <div className={styles.root} role="tablist" aria-label={tabListLabel} aria-orientation="horizontal">
      {topics.map((t, index) => {
        const selected = t.slug === activeTopicSlug;
        const tabId = `${idPrefix}-tab-${t.slug}`;
        const label = formatTabAriaLabel
          ? formatTabAriaLabel(t)
          : t.messageCount > 0
            ? `${t.title}, ${t.messageCount} ${messageWordRu(t.messageCount)}`
            : t.title;
        return (
          <button
            key={t.id}
            type="button"
            id={tabId}
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={label}
            tabIndex={selected ? 0 : -1}
            className={selected ? styles.tabActive : styles.tab}
            data-variant={variant}
            onClick={() => onSelect(t.slug)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <span aria-hidden>{t.title}</span>
            {t.messageCount > 0 ? (
              <span className={styles.tabCount} aria-hidden>
                {t.messageCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function productQaTopicPanelA11y(idPrefix = 'product-qa') {
  const active = `${idPrefix}-tab`;
  const panelId = `${idPrefix}-panel`;
  return { panelId, labelledBy: active };
}

function messageWordRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'сообщений';
  if (mod10 === 1) return 'сообщение';
  if (mod10 >= 2 && mod10 <= 4) return 'сообщения';
  return 'сообщений';
}

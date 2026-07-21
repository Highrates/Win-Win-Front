'use client';

import Link from 'next/link';
import styles from './CatalogZonesGrid.module.css';

export type CatalogHubGridItem = {
  key: string;
  href: string;
  name: string;
  imageSrc: string;
  /** Если не задано — счётчик на карточке не показываем. */
  productCount?: number;
};

type Props = {
  items: CatalogHubGridItem[];
  introCopy: string;
  ariaLabel: string;
  emptyLabel?: string;
};

type GridCell =
  | { kind: 'card'; key: string; item: CatalogHubGridItem; wide?: boolean }
  | { kind: 'text'; key: string }
  | { kind: 'empty'; key: string };

function formatProductCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return `[${n}]`;
}

/**
 * Ряд 1: карточка | текст | карточка | карточка
 * Ряд 2: wide (2) | пусто | карточка
 * дальше: карточка | пусто | карточка | карточка → wide | пусто | карточка → …
 */
function buildHubCells(items: CatalogHubGridItem[]): GridCell[] {
  const cells: GridCell[] = [];
  let i = 0;
  let seq = 0;
  let rowKind: 'intro' | 'wide' | 'plain' = 'intro';

  while (i < items.length) {
    if (rowKind === 'intro') {
      if (items[i]) {
        cells.push({ kind: 'card', key: items[i]!.key, item: items[i]! });
        i += 1;
      }
      cells.push({ kind: 'text', key: `text-${seq++}` });
      for (let n = 0; n < 2 && i < items.length; n += 1) {
        cells.push({ kind: 'card', key: items[i]!.key, item: items[i]! });
        i += 1;
      }
      rowKind = 'wide';
      continue;
    }

    if (rowKind === 'wide') {
      if (items[i]) {
        cells.push({ kind: 'card', key: items[i]!.key, item: items[i]!, wide: true });
        i += 1;
      }
      cells.push({ kind: 'empty', key: `empty-${seq++}` });
      if (items[i]) {
        cells.push({ kind: 'card', key: items[i]!.key, item: items[i]! });
        i += 1;
      }
      rowKind = 'plain';
      continue;
    }

    if (items[i]) {
      cells.push({ kind: 'card', key: items[i]!.key, item: items[i]! });
      i += 1;
    }
    cells.push({ kind: 'empty', key: `empty-${seq++}` });
    for (let n = 0; n < 2 && i < items.length; n += 1) {
      cells.push({ kind: 'card', key: items[i]!.key, item: items[i]! });
      i += 1;
    }
    rowKind = 'wide';
  }

  return cells;
}

function HubCard({
  item,
  wide,
  eager,
}: {
  item: CatalogHubGridItem;
  wide?: boolean;
  eager?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={wide ? `${styles.card} ${styles.cardWide}` : styles.card}
    >
      <div className={styles.cardImgWrap}>
        <img
          src={item.imageSrc || '/images/placeholder.svg'}
          alt=""
          className={styles.cardImg}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardName}>{item.name}</span>
        {typeof item.productCount === 'number' ? (
          <span className={styles.cardCount}>{formatProductCount(item.productCount)}</span>
        ) : null}
      </div>
    </Link>
  );
}

export function CatalogZonesGrid({
  items,
  introCopy,
  ariaLabel,
  emptyLabel = 'Пока пусто.',
}: Props) {
  if (!items.length) {
    return (
      <section className={styles.section} aria-label={ariaLabel}>
        <div className="padding-global">
          <article className={styles.textCell}>
            <p className={styles.textBody}>{introCopy}</p>
          </article>
          <p className={styles.status}>{emptyLabel}</p>
        </div>
      </section>
    );
  }

  const cells = buildHubCells(items);
  let cardIndex = 0;

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <div className="padding-global">
        <div className={styles.grid}>
          {cells.map((cell) => {
            if (cell.kind === 'text') {
              return (
                <article key={cell.key} className={styles.textCell}>
                  <p className={styles.textBody}>{introCopy}</p>
                </article>
              );
            }
            if (cell.kind === 'empty') {
              return <div key={cell.key} className={styles.emptyCell} aria-hidden />;
            }
            const eager = cardIndex < 3;
            cardIndex += 1;
            return (
              <HubCard key={cell.key} item={cell.item} wide={cell.wide} eager={eager} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

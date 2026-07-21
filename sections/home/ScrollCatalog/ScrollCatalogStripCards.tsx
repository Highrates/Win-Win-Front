import Link from 'next/link';
import { isScrollCatalogImgWide } from './scrollCatalogImgWide';
import styles from './ScrollCatalog.module.css';
import type { ScrollCatalogStripItem } from './scrollCatalogStripItems';

type Props = {
  items: ScrollCatalogStripItem[];
  cardsClassName: string;
  panelId?: string;
  panelLabelledBy?: string;
  eagerImageCount?: number;
  titleVariant?: 'default' | 'caption';
  uniformCards?: boolean;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  scrollRef?: React.Ref<HTMLDivElement>;
  scrollWrapperProps?: React.HTMLAttributes<HTMLDivElement>;
};

export function ScrollCatalogStripCards({
  items,
  cardsClassName,
  panelId,
  panelLabelledBy,
  eagerImageCount,
  titleVariant = 'default',
  uniformCards = false,
  onLinkClick,
  scrollRef,
  scrollWrapperProps,
}: Props) {
  const titleClass =
    titleVariant === 'caption'
      ? `${styles.cardTitle} ${styles.cardTitleCaption}`
      : styles.cardTitle;

  return (
    <div
      ref={scrollRef}
      id={panelId}
      role={panelId ? 'tabpanel' : undefined}
      aria-labelledby={panelLabelledBy}
      className={cardsClassName}
      {...scrollWrapperProps}
    >
      {items.map((card, index) => {
        const wide = !uniformCards && isScrollCatalogImgWide(card.key, index);
        const loading = eagerImageCount != null && index < eagerImageCount ? 'eager' : 'lazy';
        return (
          <Link
            key={card.key}
            href={card.href}
            className={styles.card}
            onClick={onLinkClick}
          >
            <div className={wide ? `${styles.imgWrap} ${styles.imgWrapWide}` : styles.imgWrap}>
              {card.imageSrc ? (
                <img
                  src={card.imageSrc}
                  alt=""
                  width={wide ? 306 : 242}
                  height={220}
                  className={styles.imgCover}
                  loading={loading}
                  decoding="async"
                />
              ) : null}
            </div>
            <span className={titleClass}>{card.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

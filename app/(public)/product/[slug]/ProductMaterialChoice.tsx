'use client';

import Link from 'next/link';
import type { MaterialChoiceGroup } from '@/lib/productMaterialChoiceGroups';
import styles from './ProductPage.module.css';

type Props = {
  productPath: string;
  groups: MaterialChoiceGroup[];
  selectedVariantId: string | null;
  /** При выборе только размера (`?sz=`) — карточки других размеров неактивны */
  selectedSizeOptionId: string | null;
};

export default function ProductMaterialChoice({
  productPath,
  groups,
  selectedVariantId,
  selectedSizeOptionId,
}: Props) {
  return (
    <div className={styles.productMaterialChoice}>
      <h2 className={styles.productMaterialChoiceHeading}>ВЫБОР МАТЕРИАЛА И ЦВЕТА</h2>
      <div className={styles.productMaterialChoiceGroupsScroll}>
        {groups.map((group, gi) => (
          <section
            key={`${group.materialTitle}-${gi}`}
            className={styles.productMaterialChoiceGroup}
            aria-labelledby={`material-group-${gi}`}
          >
            <h3 id={`material-group-${gi}`} className={styles.productMaterialChoiceMaterialTitle}>
              {group.materialTitle}
            </h3>
            <div className={styles.productMaterialChoiceCards} role="list">
              {group.cards.map((card) => {
                const href = card.variantSlug
                  ? `${productPath}?vs=${encodeURIComponent(card.variantSlug)}`
                  : `${productPath}?v=${encodeURIComponent(card.variantId)}`;
                const selected = card.variantId === selectedVariantId;
                const sizeFiltered =
                  selectedSizeOptionId != null &&
                  card.sizeOptionId != null &&
                  card.sizeOptionId !== selectedSizeOptionId;
                const inactive = sizeFiltered && !selected;
                return (
                  <Link
                    key={card.variantId}
                    href={href}
                    scroll={false}
                    role="listitem"
                    className={`${styles.productMaterialChoiceCard} ${selected ? styles.productMaterialChoiceCardSelected : ''} ${inactive ? styles.productMaterialChoiceCardDisabled : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    aria-disabled={inactive ? 'true' : undefined}
                    tabIndex={inactive ? -1 : undefined}
                  >
                    <img
                      src={card.imageUrl}
                      alt=""
                      width={120}
                      height={120}
                      className={styles.productMaterialChoiceCardImg}
                    />
                    <span className={styles.productMaterialChoiceColorName}>{card.colorLabel}</span>
                    <span className={styles.productMaterialChoicePrice}>{card.priceLabel}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

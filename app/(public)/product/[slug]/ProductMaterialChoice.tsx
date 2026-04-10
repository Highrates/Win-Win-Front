'use client';

import Link from 'next/link';
import type { MaterialChoiceGroup } from '@/lib/productMaterialChoiceGroups';
import styles from './ProductPage.module.css';

type Props = {
  productPath: string;
  groups: MaterialChoiceGroup[];
  selectedVariantId: string | null;
};

export default function ProductMaterialChoice({ productPath, groups, selectedVariantId }: Props) {
  return (
    <div className={styles.productMaterialChoice}>
      <h2 className={styles.productMaterialChoiceHeading}>Выбор материала</h2>
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
              return (
                <Link
                  key={card.variantId}
                  href={href}
                  scroll={false}
                  role="listitem"
                  className={`${styles.productMaterialChoiceCard} ${selected ? styles.productMaterialChoiceCardSelected : ''}`}
                  aria-current={selected ? 'true' : undefined}
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
  );
}

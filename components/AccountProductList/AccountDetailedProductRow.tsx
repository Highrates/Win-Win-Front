'use client';

import productListStyles from './AccountProductList.module.css';

export type AccountDetailedProductLine = {
  id: string;
  name: string;
  price: string;
  color: string;
  material: string;
  size: string;
};

type AccountDetailedProductRowProps = {
  product: AccountDetailedProductLine;
  selectionMode: boolean;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  imageSrc?: string;
};

const PLACEHOLDER = '/images/placeholder.svg';

export function AccountDetailedProductRow({
  product,
  selectionMode,
  selected,
  onSelectedChange,
  imageSrc = PLACEHOLDER,
}: AccountDetailedProductRowProps) {
  return (
    <div className={productListStyles.productCardDetailedRow}>
      {selectionMode ? (
        <input
          type="checkbox"
          className={productListStyles.productCardCheckbox}
          checked={selected}
          onChange={(e) => onSelectedChange(e.target.checked)}
          aria-label={`Выбрать «${product.name}»`}
        />
      ) : null}
      <div className={productListStyles.productCardDetailed}>
        <div className={productListStyles.productCardDetailedImageWrap}>
          <img
            src={imageSrc}
            alt={product.name}
            className={productListStyles.productCardDetailedImage}
          />
        </div>
        <div className={productListStyles.productCardDetailedBody}>
          <div className={productListStyles.productCardDetailedTitleRow}>
            <div className={productListStyles.productCardDetailedTitleTexts}>
              <span className={productListStyles.productCardDetailedName}>{product.name}</span>
              <span className={productListStyles.productCardDetailedPrice}>
                {product.price}
                {'\u00A0'}₽
              </span>
            </div>
            <button
              type="button"
              className={`${productListStyles.iconButton} ${productListStyles.productCardDetailedTitleMore}`}
              aria-label={`Ещё по товару: ${product.name}`}
            >
              <img src="/icons/more.svg" alt="" width={20} height={20} aria-hidden />
            </button>
          </div>
          <div className={productListStyles.productCardDetailedMeta}>
            <div className={productListStyles.productCardDetailedMetaItem}>
              <span className={productListStyles.productCardDetailedMetaLabel}>Цвет</span>
              <span>{product.color}</span>
            </div>
            <div className={productListStyles.productCardDetailedMetaItem}>
              <span className={productListStyles.productCardDetailedMetaLabel}>Материал</span>
              <span>{product.material}</span>
            </div>
            <div className={productListStyles.productCardDetailedMetaItem}>
              <span className={productListStyles.productCardDetailedMetaLabel}>Размер</span>
              <span>{product.size}</span>
            </div>
          </div>
          <div className={productListStyles.productCardDetailedFooter}>
            <div className={productListStyles.productCardDetailedQty}>
              <button type="button" className={productListStyles.qtyButton} aria-label="Уменьшить количество">
                -
              </button>
              <span className={productListStyles.qtyValue}>1</span>
              <button type="button" className={productListStyles.qtyButton} aria-label="Увеличить количество">
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AccordionBig } from '@/app/(account)/account/orders/AccordionBig';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { formatBudgetDigitsGrouped, parseBudgetDigits } from '@/lib/formatBudgetRub';
import {
  SOURCING_FILES_HINT,
  SOURCING_PRODUCT_DESCRIPTION_MAX,
  SOURCING_PRODUCT_FIELD_MAX,
  SOURCING_PRODUCT_NAME_MAX,
} from './sourcingLimits';
import { SourcingReferenceGrid } from './SourcingReferenceGrid';
import { DeleteIcon } from './SourcingFormIcons';
import {
  isSourcingUnit,
  SOURCING_UNIT_OPTIONS,
  type SourcingProductItem,
} from './types';
import { type SourcingFormErrors } from './validation';
import styles from './SourcingRequestModal.module.css';

function productAccordionTitle(item: SourcingProductItem, index: number): string {
  const name = item.name.trim();
  return name || `Товар ${index + 1}`;
}

type ProductFieldErrors = NonNullable<SourcingFormErrors['productErrors']>[string];

type Props = {
  product: SourcingProductItem;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDelete: boolean;
  onRemove: () => void;
  fieldErrors?: ProductFieldErrors;
  onUpdate: (patch: Partial<SourcingProductItem>) => void;
  onAddReferenceImages: (files: FileList | File[]) => void;
  onRemoveReferenceImage: (imageId: string) => void;
};

export function SourcingProductAccordion({
  product,
  index,
  open,
  onOpenChange,
  canDelete,
  onRemove,
  fieldErrors,
  onUpdate,
  onAddReferenceImages,
  onRemoveReferenceImage,
}: Props) {
  const title = productAccordionTitle(product, index);

  return (
    <AccordionBig
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      className={styles.accordionFullWidth}
      panelClassName={styles.accordionPanel}
      headerAction={
        canDelete ? (
          <button
            type="button"
            className={`${styles.deleteIconBtn} ${styles.deleteProductBtn}`}
            aria-label={`Удалить ${title}`}
            onClick={onRemove}
          >
            <DeleteIcon />
          </button>
        ) : null
      }
    >
      <div className={styles.formFields}>
        <TextField
          label="Наименование товара"
          id={`sourcing-product-name-${product.id}`}
          value={product.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          maxLength={SOURCING_PRODUCT_NAME_MAX}
        />

        <h4 className={styles.subsectionTitle}>Референсы (фото, скриншоты)</h4>
        <p className={styles.referenceHint}>{SOURCING_FILES_HINT}</p>
        <div className={styles.referenceBlock}>
          <SourcingReferenceGrid
            images={product.referenceImages}
            onAdd={onAddReferenceImages}
            onRemove={onRemoveReferenceImage}
          />
          <TextField
            label="Ссылка на товар или аналог"
            id={`sourcing-product-link-${product.id}`}
            type="text"
            value={product.productLink}
            onChange={(e) => onUpdate({ productLink: e.target.value })}
            placeholder="https://"
            error={fieldErrors?.productLink}
          />
        </div>

        <div className={styles.fieldRow}>
          <TextField
            label="Материал"
            id={`sourcing-product-material-${product.id}`}
            value={product.material}
            onChange={(e) => onUpdate({ material: e.target.value })}
            maxLength={SOURCING_PRODUCT_FIELD_MAX}
          />
          <TextField
            label="Цвет"
            id={`sourcing-product-color-${product.id}`}
            value={product.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            maxLength={SOURCING_PRODUCT_FIELD_MAX}
          />
        </div>
        <TextField
          label="Размер"
          id={`sourcing-product-size-${product.id}`}
          value={product.size}
          onChange={(e) => onUpdate({ size: e.target.value })}
          placeholder="Ш×Г×В, мм или «как на чертеже»"
          maxLength={SOURCING_PRODUCT_FIELD_MAX}
        />
        <div className={textFieldStyles.field}>
          <label className={textFieldStyles.label} htmlFor={`sourcing-product-desc-${product.id}`}>
            <span className={textFieldStyles.labelText}>Описание</span>
            <textarea
              id={`sourcing-product-desc-${product.id}`}
              className={`${textFieldStyles.input} ${styles.textarea}`}
              value={product.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={4}
              maxLength={SOURCING_PRODUCT_DESCRIPTION_MAX}
            />
          </label>
        </div>
        <div className={styles.fieldRow}>
          <TextField
            label="Количество"
            id={`sourcing-product-qty-${product.id}`}
            type="number"
            min={1}
            inputMode="numeric"
            value={product.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
          />
          <div className={textFieldStyles.field}>
            <label className={textFieldStyles.label} htmlFor={`sourcing-product-unit-${product.id}`}>
              <span className={textFieldStyles.labelText}>Ед. измерения</span>
              <select
                id={`sourcing-product-unit-${product.id}`}
                className={styles.unitSelect}
                value={product.unit}
                onChange={(e) => {
                  const next = e.target.value;
                  if (isSourcingUnit(next)) onUpdate({ unit: next });
                }}
              >
                {SOURCING_UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {fieldErrors?.unit ? (
                <p className={textFieldStyles.errorMessage} role="alert">
                  {fieldErrors.unit}
                </p>
              ) : null}
            </label>
          </div>
        </div>
        <div className={styles.budgetCheckboxRow}>
          <AccountCheckbox
            id={`sourcing-product-budget-toggle-${product.id}`}
            className={styles.budgetCheckboxForm}
            checked={product.showExpectedBudget}
            onChange={(e) => {
              const checked = e.target.checked;
              onUpdate({
                showExpectedBudget: checked,
                expectedBudget: checked ? product.expectedBudget : '',
              });
            }}
          />
          <label
            htmlFor={`sourcing-product-budget-toggle-${product.id}`}
            className={styles.budgetCheckboxLabel}
          >
            Указать ожидаемый бюджет
          </label>
        </div>
        {product.showExpectedBudget ? (
          <div className={textFieldStyles.field}>
            <label className={textFieldStyles.label} htmlFor={`sourcing-product-budget-${product.id}`}>
              <span className={textFieldStyles.labelText}>
                Ожидаемый бюджет <span className={styles.labelMuted}>(за единицу, ₽)</span>
              </span>
              <input
                id={`sourcing-product-budget-${product.id}`}
                className={textFieldStyles.input}
                inputMode="numeric"
                value={formatBudgetDigitsGrouped(product.expectedBudget)}
                onChange={(e) => onUpdate({ expectedBudget: parseBudgetDigits(e.target.value) })}
                placeholder="0"
              />
            </label>
          </div>
        ) : null}
      </div>
    </AccordionBig>
  );
}

export { productAccordionTitle };

'use client';

import productListStyles from './AccountProductList.module.css';

export type AccountCheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Чекбокс в стиле карточки товара в ЛК (`productCardCheckbox`). */
export function AccountCheckbox({ className, ...rest }: AccountCheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`${productListStyles.productCardCheckbox} ${className ?? ''}`.trim()}
      {...rest}
    />
  );
}

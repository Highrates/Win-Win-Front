'use client';

import { useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button/Button';
import projectStyles from '../projects/page.module.css';
import { AccordionBig } from './AccordionBig';
import styles from './page.module.css';

const ORDER_TABS = ['Подготовка заказа', 'В работе', 'Завершенные'] as const;

type OrderProduct = {
  id: string;
  name: string;
  price: string;
  color: string;
  material: string;
  size: string;
};

const ORDER_PRODUCTS: OrderProduct[] = [
  {
    id: '1',
    name: 'Кресло Otto Soft',
    price: '~ 185 990',
    color: 'Светло-серый',
    material: 'Массив дуба, текстиль',
    size: '82 × 76 × 90 см',
  },
  {
    id: '2',
    name: 'Диван Bergen',
    price: '~ 412 500',
    color: 'Тёмно-синий',
    material: 'Велюр, дерево',
    size: '240 × 95 × 85 см',
  },
  {
    id: '3',
    name: 'Стол обеденный Nord',
    price: '~ 89 900',
    color: 'Натуральный дуб',
    material: 'Массив дуба',
    size: '180 × 90 × 75 см',
  },
];

export function AccountOrdersPageClient() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectedCount = selectedIds.size;

  const onSelectAllToggle = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setSelectionMode(true);
      setSelectedIds(new Set(ORDER_PRODUCTS.map((p) => p.id)));
    }
  };

  const onProductCheckChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className={projectStyles.page}>
      <div className={projectStyles.toolbar}>
        <AccountProjectTabs
          projects={ORDER_TABS}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      <div className={`${projectStyles.productsTopRow} ${styles.productsTopRowOrders}`}>
        <button
          type="button"
          className={projectStyles.selectAllButton}
          onClick={onSelectAllToggle}
          aria-pressed={selectionMode}
        >
          {selectionMode ? (
            <>
              <span>Отменить</span>
              <img src="/icons/delete.svg" alt="" width={20} height={20} className={projectStyles.iconBlack} />
            </>
          ) : (
            'Выбрать все'
          )}
        </button>
      </div>

      <div className={styles.ordersMainContent}>
        <div className={`${projectStyles.productCardDetailedWrapper} ${styles.productCardDetailedWrapperOrders}`}>
          {ORDER_PRODUCTS.map((product) => (
            <div key={product.id} className={projectStyles.productCardDetailedRow}>
              {selectionMode ? (
                <input
                  type="checkbox"
                  className={projectStyles.productCardCheckbox}
                  checked={selectedIds.has(product.id)}
                  onChange={(e) => onProductCheckChange(product.id, e.target.checked)}
                  aria-label={`Выбрать «${product.name}»`}
                />
              ) : null}
              <div className={projectStyles.productCardDetailed}>
                <div className={projectStyles.productCardDetailedImageWrap}>
                  <img
                    src="/images/placeholder.svg"
                    alt={product.name}
                    className={projectStyles.productCardDetailedImage}
                  />
                </div>
                <div className={projectStyles.productCardDetailedBody}>
                  <div className={projectStyles.productCardDetailedTitleRow}>
                    <div className={projectStyles.productCardDetailedTitleTexts}>
                      <span className={projectStyles.productCardDetailedName}>{product.name}</span>
                      <span className={projectStyles.productCardDetailedPrice}>
                        {product.price}
                        {'\u00A0'}₽
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`${projectStyles.iconButton} ${projectStyles.productCardDetailedTitleMore}`}
                      aria-label={`Ещё по товару: ${product.name}`}
                    >
                      <img src="/icons/more.svg" alt="" width={20} height={20} aria-hidden />
                    </button>
                  </div>
                  <div className={projectStyles.productCardDetailedMeta}>
                    <div className={projectStyles.productCardDetailedMetaItem}>
                      <span className={projectStyles.productCardDetailedMetaLabel}>Цвет</span>
                      <span>{product.color}</span>
                    </div>
                    <div className={projectStyles.productCardDetailedMetaItem}>
                      <span className={projectStyles.productCardDetailedMetaLabel}>Материал</span>
                      <span>{product.material}</span>
                    </div>
                    <div className={projectStyles.productCardDetailedMetaItem}>
                      <span className={projectStyles.productCardDetailedMetaLabel}>Размер</span>
                      <span>{product.size}</span>
                    </div>
                  </div>
                  <div className={projectStyles.productCardDetailedFooter}>
                    <div className={projectStyles.productCardDetailedQty}>
                      <button type="button" className={projectStyles.qtyButton} aria-label="Уменьшить количество">
                        -
                      </button>
                      <span className={projectStyles.qtyValue}>1</span>
                      <button type="button" className={projectStyles.qtyButton} aria-label="Увеличить количество">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ordersSidebar}>
          <AccordionBig title="Адрес">
            ул. Красных молдавских партизан 16
          </AccordionBig>

          <div className={styles.orderSummaryCard}>
            <div className={styles.summaryTop}>
              <div className={styles.summaryTitle}>Итого</div>
              <div className={styles.summarySelected}>Вы выбрали: {selectedCount} товаров.</div>
              <div className={styles.summaryPrice}>~ 185 990 ₽</div>
              <div className={styles.summaryEta}>
                <img src="/icons/group.svg" alt="" width={16} height={16} className={styles.summaryEtaIcon} aria-hidden />
                <span>Ориентировочная поставка: 65-80 дней</span>
              </div>
            </div>

            <div className={styles.summaryBottom}>
              <div className={styles.bonusRow}>
                <div className={styles.bonusLeft}>
                  <img src="/icons/wallet-add.svg" alt="" width={16} height={16} aria-hidden />
                  <span className={styles.bonusText}>Ожидаемый бонус: 18 590 р.</span>
                </div>
              </div>
              <Button variant="primary">Отправить на согласование</Button>
              <div className={styles.summaryHint}>
                После запуска оформления менеджер свяжется с вами для подтверждения деталей поставки
              </div>
            </div>
          </div>

          <AccordionBig
            title="Итого"
            defaultOpen
            className={styles.orderSummaryAccordionMobile}
            panelClassName={styles.orderSummaryAccordionPanelMobile}
          >
            <div className={styles.summaryTop}>
              <div className={styles.summarySelected}>Вы выбрали: {selectedCount} товаров.</div>
              <div className={styles.summaryPrice}>~ 185 990 ₽</div>
              <div className={styles.summaryEta}>
                <img src="/icons/group.svg" alt="" width={16} height={16} className={styles.summaryEtaIcon} aria-hidden />
                <span>Ориентировочная поставка: 65-80 дней</span>
              </div>
            </div>

            <div className={styles.summaryBottom}>
              <div className={styles.bonusRow}>
                <div className={styles.bonusLeft}>
                  <img src="/icons/wallet-add.svg" alt="" width={16} height={16} aria-hidden />
                  <span className={styles.bonusText}>Ожидаемый бонус: 18 590 р.</span>
                </div>
              </div>
              <Button variant="primary">Отправить на согласование</Button>
              <div className={styles.summaryHint}>
                После запуска оформления менеджер свяжется с вами для подтверждения деталей поставки
              </div>
            </div>
          </AccordionBig>
        </div>
      </div>
    </div>
  );
}

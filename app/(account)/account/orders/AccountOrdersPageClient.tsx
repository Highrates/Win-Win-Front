'use client';

import { useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { AccountDetailedProductRow } from '@/components/AccountProductList/AccountDetailedProductRow';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import { Button } from '@/components/Button';
import { ORDER_PRODUCTS, ORDER_TABS } from '@/lib/account/orders';
import { AccordionBig } from './AccordionBig';
import styles from './page.module.css';

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
    <div className={productListStyles.page}>
      <div className={productListStyles.toolbar}>
        <AccountProjectTabs
          projects={ORDER_TABS}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      <div className={`${productListStyles.productsTopRow} ${styles.productsTopRowOrders}`}>
        <button
          type="button"
          className={productListStyles.selectAllButton}
          onClick={onSelectAllToggle}
          aria-pressed={selectionMode}
        >
          {selectionMode ? (
            <>
              <span>Отменить</span>
              <img src="/icons/delete.svg" alt="" width={20} height={20} className={productListStyles.iconBlack} />
            </>
          ) : (
            'Выбрать все'
          )}
        </button>
      </div>

      <div className={styles.ordersMainContent}>
        <div className={`${productListStyles.productCardDetailedWrapper} ${styles.productCardDetailedWrapperOrders}`}>
          {ORDER_PRODUCTS.map((product) => (
            <AccountDetailedProductRow
              key={product.id}
              product={product}
              selectionMode={selectionMode}
              selected={selectedIds.has(product.id)}
              onSelectedChange={(checked) => onProductCheckChange(product.id, checked)}
            />
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

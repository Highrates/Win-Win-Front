'use client';

import styles from '../page.module.css';

function CtaChevron({ open }: { open: boolean }) {
  return (
    <span className={styles.ctaAccordionChevron} data-open={open || undefined} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M11 4v14M4 11h14" />
      </svg>
    </span>
  );
}

function CtaBlock({
  count,
  total,
  expectedBonus,
}: {
  count: number;
  total: string;
  /** Отформатированная сумма бонуса или «—» */
  expectedBonus: string;
}) {
  const w = count === 1 ? 'товар' : count > 1 && count < 5 ? 'товара' : 'товаров';
  return (
    <>
      <div className={styles.ctaLeftInfo}>
        <div className={styles.ctaLabel}>Общая сумма:</div>
        <div className={styles.ctaCount}>
          ({count} {w})
        </div>
      </div>
      <div className={styles.ctaRightInfo}>
        <div className={styles.ctaPrice}>{total}</div>
        <div className={styles.ctaExpectedBonus}>
          <img src="/icons/wallet-add.svg" alt="" width={16} height={16} className={styles.ctaExpectedBonusIcon} aria-hidden />
          <span className={styles.ctaExpectedBonusLine}>
            <span className={styles.ctaExpectedBonusLabel}>Ожидаемый бонус: </span>
            <span className={styles.ctaExpectedBonusValue}>{expectedBonus}</span>
          </span>
        </div>
      </div>
    </>
  );
}

export type AccountProjectsCtaProps = {
  isAccordionLayout: boolean;
  ctaAccordionOpen: boolean;
  onToggleAccordion: () => void;
  itemCount: number;
  displayTotal: string;
  /** Отформатированная сумма («—», если недоступна) по настройкам программы своего заказа */
  expectedBonusDisplay: string;
  /** Перенос всех позиций проекта в черновик заказа и переход в «Подготовка заказа». */
  onCheckout?: () => void | Promise<void>;
  checkoutBusy?: boolean;
};

export function AccountProjectsCta({
  isAccordionLayout,
  ctaAccordionOpen,
  onToggleAccordion,
  itemCount,
  displayTotal,
  expectedBonusDisplay,
  onCheckout,
  checkoutBusy = false,
}: AccountProjectsCtaProps) {
  if (isAccordionLayout) {
    return (
      <div className={styles.ctaAccordionWrapper}>
        <div className={styles.ctaAccordion}>
          <button
            type="button"
            className={styles.ctaAccordionTrigger}
            onClick={onToggleAccordion}
            aria-expanded={ctaAccordionOpen}
            aria-controls="account-project-cta-panel"
            id="account-project-cta-trigger"
          >
            <div className={styles.ctaAccordionTriggerInner}>
              <div className={styles.ctaAccordionTriggerLeft}>
                <div className={styles.ctaLabel}>Общая сумма:</div>
                <div className={styles.ctaCount}>
                  ({itemCount}{' '}
                  {itemCount === 1 ? 'товар' : itemCount > 1 && itemCount < 5 ? 'товара' : 'товаров'})
                </div>
              </div>
              <span className={styles.ctaAccordionTriggerPrice}>{displayTotal}</span>
            </div>
            <CtaChevron open={ctaAccordionOpen} />
          </button>
          <div
            id="account-project-cta-panel"
            role="region"
            aria-labelledby="account-project-cta-trigger"
            className={styles.ctaAccordionPanel}
            data-open={ctaAccordionOpen || undefined}
          >
            <div className={styles.ctaAccordionContent}>
              <div className={styles.ctaAccordionSnowStack}>
                <CtaBlock count={itemCount} total={displayTotal} expectedBonus={expectedBonusDisplay} />
              </div>
              <button
                type="button"
                className={styles.ctaCheckoutBtn}
                disabled={checkoutBusy || itemCount < 1 || !onCheckout}
                onClick={() => void onCheckout?.()}
              >
                <span>{checkoutBusy ? 'Добавляем…' : 'Оформить'}</span>
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ctaRow}>
      <div className={styles.ctaSnowPanel}>
        <CtaBlock count={itemCount} total={displayTotal} expectedBonus={expectedBonusDisplay} />
      </div>
      <button
        type="button"
        className={styles.ctaCheckoutBtn}
        disabled={checkoutBusy || itemCount < 1 || !onCheckout}
        onClick={() => void onCheckout?.()}
      >
        <span>{checkoutBusy ? 'Добавляем…' : 'Оформить'}</span>
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

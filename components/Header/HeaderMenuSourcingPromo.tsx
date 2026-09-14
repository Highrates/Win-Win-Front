'use client';

import { Button } from '@/components/Button/Button';
import styles from './Header.module.css';

const EYEBROW = 'Предложения';
const TITLE = 'Индивидуальный подбор мебели';
const TEXT =
  'Не нашли нужную модель? Опишите задачу — подберём варианты по ТЗ, референсам или аналогам.';
const CTA = 'Заказать подбор';

type Props = {
  variant: 'desktop' | 'mobile';
  onClick: () => void;
};

/** Общий sourcing CTA для desktop burger и mobile menu. */
export function HeaderMenuSourcingPromo({ variant, onClick }: Props) {
  if (variant === 'mobile') {
    return (
      <aside className={styles.menuSourcingPromoMobile} aria-label={CTA}>
        <span className={styles.menuSourcingEyebrow}>{EYEBROW}</span>
        <p className={styles.menuSourcingTitle}>{TITLE}</p>
        <p className={styles.menuSourcingText}>{TEXT}</p>
        <Button type="button" variant="secondary" className={styles.menuSourcingBtn} onClick={onClick}>
          {CTA}
        </Button>
      </aside>
    );
  }

  return (
    <aside className={styles.desktopMenuSourcing} aria-label={CTA}>
      <span className={styles.menuSourcingEyebrow}>{EYEBROW}</span>
      <p className={styles.menuSourcingTitle}>{TITLE}</p>
      <p className={styles.menuSourcingText}>{TEXT}</p>
      <Button type="button" variant="secondary" className={styles.menuSourcingBtn} onClick={onClick}>
        {CTA}
      </Button>
    </aside>
  );
}

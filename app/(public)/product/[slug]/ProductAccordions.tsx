'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';

const ACCORDIONS = [
  {
    id: 'delivery',
    title: 'Доставка',
    icon: '/icons/group.svg',
  },
  {
    id: 'specs',
    title: 'Технические параметры',
    icon: '/icons/weight.svg',
  },
  {
    id: 'extra',
    title: 'Дополнительная информация',
    icon: '/icons/task-square.svg',
  },
] as const;

function AccordionChevronIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.accordionChevron} data-open={open || undefined} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M11 4v14M4 11h14" />
      </svg>
    </span>
  );
}

export default function ProductAccordions() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      {ACCORDIONS.map(({ id, title, icon }) => {
        const isOpen = openId === id;
        return (
          <div key={id} className={styles.accordion}>
            <button
              type="button"
              className={styles.accordionTrigger}
              onClick={() => setOpenId(isOpen ? null : id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${id}`}
              id={`accordion-trigger-${id}`}
            >
              <div className={styles.accordionTriggerInner}>
                <img src={icon} alt="" width={20} height={20} className={styles.accordionIcon} aria-hidden />
                <span className={styles.accordionTitle}>{title}</span>
              </div>
              <AccordionChevronIcon open={isOpen} />
            </button>
            <div
              id={`accordion-panel-${id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${id}`}
              className={styles.accordionPanel}
              data-open={isOpen || undefined}
            >
              <div className={styles.accordionContent}>
                  {id === 'delivery' && (
                    <>
                      <h3>Способы доставки</h3>
                      <p>Доставка по Москве и МО — 1–2 рабочих дня. Подъём на этаж и сборка оплачиваются отдельно.</p>
                      <h3>Сроки</h3>
                      <p>При наличии на складе отгрузка в течение 3 рабочих дней. Изготовление на заказ — от 14 дней.</p>
                    </>
                  )}
                  {id === 'specs' && (
                    <>
                      <h3>Характеристики</h3>
                      <ul>
                        <li>Ширина: 200 см</li>
                        <li>Глубина: 90 см</li>
                        <li>Высота: 80 см</li>
                        <li>Материал каркаса: массив бука</li>
                        <li>Обивка: ткань / кожа</li>
                      </ul>
                    </>
                  )}
                  {id === 'extra' && (
                    <>
                      <p>Гарантия 24 месяца. Возврат и обмен в течение 14 дней при сохранении товарного вида.</p>
                      <p>Возможна индивидуальная комплектация и выбор ткани из каталога.</p>
                    </>
                  )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

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

function EmptyAccordionBody() {
  return <p className={styles.accordionEmpty}>Данные не указаны.</p>;
}

export type ProductAccordionsProps = {
  deliveryText?: string | null;
  technicalSpecs?: string | null;
  additionalInfoHtml?: string | null;
};

export default function ProductAccordions({
  deliveryText,
  technicalSpecs,
  additionalInfoHtml,
}: ProductAccordionsProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const deliveryTrim = deliveryText?.trim() ?? '';
  const specsTrim = technicalSpecs?.trim() ?? '';
  const extraTrim = additionalInfoHtml?.trim() ?? '';

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
              <div className={`${styles.accordionContent} rich-content`}>
                {id === 'delivery' &&
                  (deliveryTrim ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{deliveryTrim}</div>
                  ) : (
                    <EmptyAccordionBody />
                  ))}
                {id === 'specs' &&
                  (specsTrim ? (
                    specsTrim.includes('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: specsTrim }} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{specsTrim}</div>
                    )
                  ) : (
                    <EmptyAccordionBody />
                  ))}
                {id === 'extra' &&
                  (extraTrim ? (
                    <div dangerouslySetInnerHTML={{ __html: extraTrim }} />
                  ) : (
                    <EmptyAccordionBody />
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

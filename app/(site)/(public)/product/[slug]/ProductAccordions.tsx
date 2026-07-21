'use client';

import { useMemo, useState } from 'react';
import styles from './ProductAccordions.module.css';

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
    <span className={styles.chevron} data-open={open || undefined} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M11 4v14M4 11h14" />
      </svg>
    </span>
  );
}

export type ProductAccordionsProps = {
  deliveryText?: string | null;
  technicalSpecs?: string | null;
  additionalInfoHtml?: string | null;
};

function accordionContentForId(
  id: (typeof ACCORDIONS)[number]['id'],
  deliveryTrim: string,
  specsTrim: string,
  extraTrim: string,
): string {
  if (id === 'delivery') return deliveryTrim;
  if (id === 'specs') return specsTrim;
  return extraTrim;
}

export default function ProductAccordions({
  deliveryText,
  technicalSpecs,
  additionalInfoHtml,
}: ProductAccordionsProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const deliveryTrim = deliveryText?.trim() ?? '';
  const specsTrim = technicalSpecs?.trim() ?? '';
  const extraTrim = additionalInfoHtml?.trim() ?? '';

  const visibleAccordions = useMemo(
    () =>
      ACCORDIONS.filter(({ id }) =>
        Boolean(accordionContentForId(id, deliveryTrim, specsTrim, extraTrim)),
      ),
    [deliveryTrim, specsTrim, extraTrim],
  );

  if (visibleAccordions.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      {visibleAccordions.map(({ id, title, icon }) => {
        const isOpen = openId === id;
        return (
          <div key={id} className={styles.accordion}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setOpenId(isOpen ? null : id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${id}`}
              id={`accordion-trigger-${id}`}
            >
              <div className={styles.triggerInner}>
                <img src={icon} alt="" width={20} height={20} className={styles.icon} aria-hidden />
                <span className={styles.title}>{title}</span>
              </div>
              <AccordionChevronIcon open={isOpen} />
            </button>
            <div
              id={`accordion-panel-${id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${id}`}
              className={styles.panel}
              data-open={isOpen || undefined}
            >
              <div className={`${styles.content} rich-content`}>
                {id === 'delivery' && (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{deliveryTrim}</div>
                )}
                {id === 'specs' &&
                  (specsTrim.includes('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: specsTrim }} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{specsTrim}</div>
                  ))}
                {id === 'extra' && <div dangerouslySetInnerHTML={{ __html: extraTrim }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

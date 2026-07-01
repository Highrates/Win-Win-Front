'use client';

import { useMemo, useState } from 'react';
import { resolveSourcingProductDisplayName } from '@win-win/sourcing-request';
import { AccordionBig } from '@/app/(account)/account/orders/AccordionBig';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminSourcingStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { formatBudgetDigitsGrouped } from '@/lib/formatBudgetRub';
import type { SourcingRequestItemApi } from '@/lib/userSourcingRequests/types';
import { AdminSourcingImpliedCny } from './AdminSourcingImpliedCny';
import sd from './sourcingAdminDetail.module.css';

function formatBudget(value: string | null): string {
  if (!value?.trim()) return '—';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '—';
  return `${formatBudgetDigitsGrouped(digits)} ₽`;
}

type Props = {
  items: SourcingRequestItemApi[];
  requestTitle: string;
};

export function AdminSourcingProductAccordion({ items, requestTitle }: Props) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminSourcingStrings(locale), [locale]);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={sd.productAccordionList}>
      {items.map((item, index) => {
        const title = resolveSourcingProductDisplayName({
          name: item.name,
          requestTitle,
          productIndex: index,
          productCount: items.length,
        });
        return (
          <AccordionBig
            key={item.id}
            title={title}
            open={openId === item.id}
            onOpenChange={(open) => setOpenId(open ? item.id : null)}
            className={sd.productAccordion}
            panelClassName={sd.productBody}
          >
            {item.productLink?.trim() ? (
              <div className={sd.productRow}>
                <p className={sd.productLabel}>{t.linkLabel}</p>
                <a href={item.productLink} target="_blank" rel="noopener noreferrer" className={sd.productValue}>
                  {item.productLink}
                </a>
              </div>
            ) : null}
            {item.material?.trim() ? (
              <div className={sd.productRow}>
                <p className={sd.productLabel}>{t.materialLabel}</p>
                <p className={sd.productValue}>{item.material}</p>
              </div>
            ) : null}
            {item.color?.trim() ? (
              <div className={sd.productRow}>
                <p className={sd.productLabel}>{t.colorLabel}</p>
                <p className={sd.productValue}>{item.color}</p>
              </div>
            ) : null}
            {item.size?.trim() ? (
              <div className={sd.productRow}>
                <p className={sd.productLabel}>{t.sizeLabel}</p>
                <p className={sd.productValue}>{item.size}</p>
              </div>
            ) : null}
            <div className={sd.productRow}>
              <p className={sd.productLabel}>{t.quantityLabel}</p>
              <p className={sd.productValue}>{item.quantity}</p>
            </div>
            <div className={sd.productRow}>
              <p className={sd.productLabel}>{t.unitLabel}</p>
              <p className={sd.productValue}>{item.unit}</p>
            </div>
            {item.expectedBudget ? (
              <>
                <div className={sd.productRow}>
                  <p className={sd.productLabel}>{t.expectedBudgetLabel}</p>
                  <p className={sd.productValue}>{formatBudget(item.expectedBudget)}</p>
                </div>
                <AdminSourcingImpliedCny expectedBudget={item.expectedBudget} />
              </>
            ) : null}
            {item.description?.trim() ? (
              <div className={sd.productRowFull}>
                <p className={sd.productLabel}>{t.descriptionLabel}</p>
                <p className={sd.productDescription}>{item.description}</p>
              </div>
            ) : null}
            {item.referenceImages.length > 0 ? (
              <div className={sd.productRowFull}>
                <p className={sd.productLabel}>{t.referencesLabel}</p>
                <div className={sd.thumbs}>
                  {item.referenceImages.map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={img.filename} className={sd.thumb} loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </AccordionBig>
        );
      })}
    </div>
  );
}

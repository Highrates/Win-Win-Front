'use client';

import { resolveSourcingProductDisplayName } from '@win-win/sourcing-request';
import { AccordionBig } from '@/app/(site)/(account)/account/orders/AccordionBig';
import { AccountGalleryThumb } from '@/components/AccountOrders/AccountGalleryThumb';
import { formatBudgetDigitsGrouped } from '@/lib/formatBudgetRub';
import { privateFileHref, privateFileLinkProps } from '@/lib/privateFiles';
import type { UserSourcingRequestDetailApi } from '@/lib/userSourcingRequests/types';
import styles from './AccountSourcingRequestDetailModal.module.css';

function formatBudget(value: string | null): string {
  if (!value?.trim()) return '—';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '—';
  return `${formatBudgetDigitsGrouped(digits)} ₽`;
}

type Attachment = UserSourcingRequestDetailApi['attachments'][number];

export function isSourcingImageAttachment(a: Attachment): boolean {
  return a.inline && (a.mimeType ?? '').toLowerCase().startsWith('image/');
}

type Props = {
  detail: UserSourcingRequestDetailApi;
  /** Тема и город — когда сводка сверху их уже не показывает (после КП). */
  showRequestMeta?: boolean;
};

/** Товары, референсы и вложения заявки в том виде, как их отправил клиент. */
export function AccountSourcingRequestOriginal({ detail, showRequestMeta = false }: Props) {
  const imageAttachments = detail.attachments.filter(isSourcingImageAttachment);
  const fileAttachments = detail.attachments.filter((a) => !isSourcingImageAttachment(a));
  const imageAttachmentUrls = imageAttachments.map((a) => privateFileHref(`sourcing:${a.id}`));

  return (
    <>
      {showRequestMeta ? (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.label}>Тема</span>
            <span>{detail.title}</span>
          </div>
          {detail.deliveryCity?.trim() ? (
            <div className={styles.summaryRow}>
              <span className={styles.label}>Город доставки</span>
              <span>{detail.deliveryCity}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Товары</h3>
        <div className={styles.accordionList}>
          {detail.items.map((item, index) => {
            const title = resolveSourcingProductDisplayName({
              name: item.name,
              requestTitle: detail.title,
              productIndex: index,
              productCount: detail.items.length,
            });
            const galleryUrls = item.referenceImages.map((img) => privateFileHref(`sourcing:${img.id}`));
            return (
              <AccordionBig
                key={item.id}
                title={title}
                defaultOpen={index === 0}
                className={styles.accordionFullWidth}
                panelClassName={styles.itemGrid}
              >
                {item.productLink?.trim() ? (
                  <div className={styles.itemRow}>
                    <span className={styles.label}>Ссылка</span>
                    <a href={item.productLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      {item.productLink}
                    </a>
                  </div>
                ) : null}
                {item.material?.trim() ? (
                  <div className={styles.itemRow}>
                    <span className={styles.label}>Материал</span>
                    <span>{item.material}</span>
                  </div>
                ) : null}
                {item.color?.trim() ? (
                  <div className={styles.itemRow}>
                    <span className={styles.label}>Цвет</span>
                    <span>{item.color}</span>
                  </div>
                ) : null}
                {item.size?.trim() ? (
                  <div className={styles.itemRow}>
                    <span className={styles.label}>Размер</span>
                    <span>{item.size}</span>
                  </div>
                ) : null}
                <div className={styles.itemRow}>
                  <span className={styles.label}>Количество</span>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.expectedBudget ? (
                  <div className={styles.itemRow}>
                    <span className={styles.label}>Бюджет за ед.</span>
                    <span>{formatBudget(item.expectedBudget)}</span>
                  </div>
                ) : null}
                {item.description?.trim() ? (
                  <div className={styles.itemRowFull}>
                    <span className={styles.label}>Описание</span>
                    <p className={styles.description}>{item.description}</p>
                  </div>
                ) : null}
                {item.referenceImages.length > 0 ? (
                  <div className={styles.itemRowFull}>
                    <span className={styles.label}>Референсы · {item.referenceImages.length}</span>
                    <div className={styles.thumbs}>
                      {item.referenceImages.map((img, i) => (
                        <AccountGalleryThumb
                          key={img.id}
                          src={galleryUrls[i]!}
                          galleryUrls={galleryUrls}
                          className={styles.thumb}
                          alt={img.filename}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </AccordionBig>
            );
          })}
        </div>
      </div>

      {detail.attachments.length > 0 ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Вложения</h3>
          {imageAttachments.length > 0 ? (
            <div className={styles.thumbs}>
              {imageAttachments.map((a, i) => (
                <AccountGalleryThumb
                  key={a.id}
                  src={imageAttachmentUrls[i]!}
                  galleryUrls={imageAttachmentUrls}
                  className={styles.thumb}
                  alt={a.filename}
                />
              ))}
            </div>
          ) : null}
          {fileAttachments.length > 0 ? (
            <ul className={styles.attachments}>
              {fileAttachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={privateFileHref(`sourcing:${a.id}`)}
                    {...privateFileLinkProps(a.inline)}
                    className={styles.link}
                  >
                    {a.filename}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

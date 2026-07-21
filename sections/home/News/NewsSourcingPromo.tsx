'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SourcingRequestModal } from '@/components/SourcingRequest/SourcingRequestModal';
import { SourcingDraftBanner } from '@/components/SourcingRequest/SourcingDraftBanner';
import { useSourcingPromoFlow } from '@/components/SourcingRequest/useSourcingPromoFlow';
import styles from './News.module.css';

const TITLE = 'Индивидуальный подбор мебели';
const EYEBROW = 'Предложения';
const DESCRIPTION =
  'Не нашли нужную модель в каталоге? Опишите задачу — подберём варианты по вашему ТЗ, референсам, чертежам или аналогам. Работаем с фабриками, проверяем соответствие бюджету и срокам, подготовим предложение для согласования.';
const FEATURE_IMAGE_SRC = '/images/news-sourcing.webp';

export function NewsSourcingPromo() {
  const { draftRefreshKey, openFreshModal, openDraftModal, modalProps } = useSourcingPromoFlow();

  return (
    <>
      <div className={styles.sourcingPromo}>
        <div className={styles.sourcingCopy}>
          <span className={styles.sourcingEyebrow}>{EYEBROW}</span>
          <h2 id="news-sourcing-title" className={styles.sourcingTitle}>
            {TITLE}
          </h2>
          <p className={styles.sourcingDescription}>{DESCRIPTION}</p>
          <SourcingDraftBanner
            className={styles.sourcingDraft}
            refreshKey={draftRefreshKey}
            onContinue={openDraftModal}
          />
          <Button
            type="button"
            variant="primary"
            className={styles.sourcingBtn}
            onClick={openFreshModal}
          >
            Заказать подбор
          </Button>
        </div>
        <div className={styles.sourcingVisual}>
          <img
            className={styles.sourcingImage}
            src={FEATURE_IMAGE_SRC}
            alt=""
            width={360}
            height={547}
            decoding="async"
          />
        </div>
      </div>
      <SourcingRequestModal {...modalProps} />
    </>
  );
}

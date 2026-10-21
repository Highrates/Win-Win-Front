'use client';

import cta from '@/components/AccountOrders/AccountOrderCta.module.css';
import { OrderCtaEditIcon, OrderCtaMessageIcon, OrderCtaRejectIcon } from './OrderKpCtaIcons';
import styles from './OrderKpActionFooter.module.css';

type Props = {
  /** `modal` — футер модалки; `card` — колонка CTA на work-card. */
  variant?: 'modal' | 'card';
  staffUnreadCount?: number;
  canRespondKp?: boolean;
  onOpenChat: () => void;
  onConfirm?: () => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
  /** Скачать КП PDF (если задан — кнопка в футере; на card обычно не используется). */
  onDownloadPdf?: () => void;
  pdfBusy?: boolean;
  /** Подпись на кнопке PDF, пока идёт сборка (например «Готовим PDF… 40%»). */
  pdfBusyLabel?: string;
  chatAriaLabel?: string;
};

export function OrderKpActionFooter({
  variant = 'modal',
  staffUnreadCount = 0,
  canRespondKp = false,
  onOpenChat,
  onConfirm,
  onRequestChanges,
  onReject,
  onDownloadPdf,
  pdfBusy = false,
  pdfBusyLabel,
  chatAriaLabel = 'Написать по заказу',
}: Props) {
  const unread = staffUnreadCount > 0;

  if (variant === 'card') {
    return (
      <div className={`${styles.card}${canRespondKp ? ` ${styles.cardKp}` : ''}`}>
        <button
          type="button"
          className={`${cta.ctaButton} ${styles.btn}${unread ? ` ${cta.ctaButtonUnread}` : ''}`}
          aria-label={
            unread ? `${chatAriaLabel}, непрочитанных сообщений: ${staffUnreadCount}` : chatAriaLabel
          }
          onClick={onOpenChat}
        >
          <OrderCtaMessageIcon className={`${cta.ctaIcon}${unread ? ` ${cta.ctaIconUnread}` : ''}`} />
          {unread ? <span className={styles.cardUnreadCount}>({staffUnreadCount})</span> : null}
        </button>
        {canRespondKp ? (
          <>
            <button
              type="button"
              className={`${cta.ctaKpConfirm} ${styles.btn} ${styles.confirm}`}
              onClick={onConfirm}
            >
              Подтвердить
            </button>
            <div className={styles.cardKpRow}>
              <button
                type="button"
                className={`${cta.ctaButton} ${styles.btn}`}
                aria-label="Запросить изменения"
                title="Запросить изменения"
                onClick={onRequestChanges}
              >
                <OrderCtaEditIcon className={cta.ctaIcon} />
                <span className={styles.cardLabel}>Изменения</span>
              </button>
              <button
                type="button"
                className={`${cta.ctaButton} ${styles.btn}`}
                aria-label="Отклонить"
                title="Отклонить"
                onClick={onReject}
              >
                <OrderCtaRejectIcon className={cta.ctaIcon} />
                <span className={styles.cardLabel}>Отклонить</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <footer className={`${styles.footer}${canRespondKp ? ` ${styles.footerKp}` : ''}`}>
      {canRespondKp ? (
        <button
          type="button"
          className={`${cta.ctaKpConfirm} ${styles.btn} ${styles.confirm}`}
          onClick={onConfirm}
        >
          Подтвердить
        </button>
      ) : null}
      <button
        type="button"
        className={`${cta.ctaButton} ${styles.btn}${unread ? ` ${cta.ctaButtonUnread}` : ''}`}
        aria-label={unread ? `${chatAriaLabel}, непрочитанных: ${staffUnreadCount}` : chatAriaLabel}
        onClick={onOpenChat}
      >
        <OrderCtaMessageIcon className={`${cta.ctaIcon}${unread ? ` ${cta.ctaIconUnread}` : ''}`} />
        <span className={styles.label}>{unread ? `Чат (${staffUnreadCount})` : 'Написать'}</span>
      </button>
      {canRespondKp ? (
        <>
          <button
            type="button"
            className={`${cta.ctaButton} ${styles.btn}`}
            aria-label="Запросить изменения"
            onClick={onRequestChanges}
          >
            <OrderCtaEditIcon className={cta.ctaIcon} />
            <span className={styles.label}>Изменения</span>
          </button>
          <button
            type="button"
            className={`${cta.ctaButton} ${styles.btn}`}
            aria-label="Отклонить"
            onClick={onReject}
          >
            <OrderCtaRejectIcon className={cta.ctaIcon} />
            <span className={styles.label}>Отклонить</span>
          </button>
        </>
      ) : null}
      {onDownloadPdf ? (
        <button
          type="button"
          className={styles.pdfBtn}
          onClick={onDownloadPdf}
          disabled={pdfBusy}
          aria-label="Скачать коммерческое предложение в PDF"
        >
          <img src="/icons/document-download.svg" alt="" width={16} height={16} aria-hidden />
          <span>{pdfBusy ? pdfBusyLabel || 'PDF…' : 'PDF'}</span>
        </button>
      ) : null}
    </footer>
  );
}

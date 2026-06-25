'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat, type OrderChatSubject } from '@/hooks/useOrderChat';
import { ACCOUNT_WORK_NOTIFICATIONS_EVENT, type AccountWorkNotificationsDetail } from '@/lib/account/orders';
import { openOrderChatPhotoSwipe } from '@/lib/orderChat/openOrderChatPhotoSwipe';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import styles from './AccountOrderWorkCard.module.css';

export type AccountOrderWorkMetaRow = { label: string; value: ReactNode; valueTitle?: string };

export type AccountOrderWorkOffer = {
  discountLabel: string;
  finalPrice: string;
  oldPrice: string;
  expectedBonus: string;
  /** Показывать блок скидки и «старую» цену (если false — только итог). */
  showDiscountStrip?: boolean;
};

export type AccountOrderWorkCardProps = {
  /** ID заказа для API чата */
  orderId: string;
  statusLabel: string;
  /** Доп. текст под статусом (например, подсказка по отклонённому заказу) */
  statusNotice?: string;
  dateLine: string;
  metaRows: AccountOrderWorkMetaRow[];
  productThumbSrcs: string[];
  /** Ссылка на страницу заказа, если не задан onOpenDetails */
  detailHref?: string;
  /** Открыть детали в модалке (приоритетнее detailHref) */
  onOpenDetails?: () => void;
  /** Блок цен и бонуса справа от меты */
  offer?: AccountOrderWorkOffer;
  /** Заголовок окна чата (кнопка сообщения) */
  chatTitle?: string;
  /** Скрыть меню «⋯» (для статусов без доп. действий) */
  hideMoreMenu?: boolean;
  /** Красная подсветка статуса (отклонённый заказ) */
  statusRejected?: boolean;
  /** Непрочитанные входящие сообщения от сотрудника (по данным списка заказов). */
  staffUnreadCount?: number;
  /** Есть непросмотренная версия опубликованного КП. */
  hasUnseenCommercialProposal?: boolean;
  /** Показывать чат справа (по умолчанию — да). */
  chatEnabled?: boolean;
  /** Тип сущности для API чата (заказ или заявка на подбор). */
  chatSubject?: OrderChatSubject;
  /** Текст ссылки на детали (по умолчанию — «Подробнее о заказе»). */
  detailLinkLabel?: string;
  /** Чип в правом верхнем углу (например «Подбор»). */
  cornerChipLabel?: string;
};

const PLACEHOLDER = '/images/placeholder.svg';

function isZoomableThumb(src: string): boolean {
  return Boolean(src?.trim()) && src !== PLACEHOLDER && !src.includes('placeholder.svg');
}

function MessageCtaButton({
  staffUnreadCount,
  onClick,
  ariaLabel,
}: {
  staffUnreadCount: number;
  onClick: () => void;
  ariaLabel: string;
}) {
  const unread = staffUnreadCount > 0;
  return (
    <button
      type="button"
      className={`${styles.ctaButton}${unread ? ` ${styles.ctaButtonUnread}` : ''}`}
      aria-label={
        unread ? `${ariaLabel}, непрочитанных сообщений: ${staffUnreadCount}` : ariaLabel
      }
      onClick={onClick}
    >
      <OrderCtaMessageIcon className={`${styles.ctaIcon}${unread ? ` ${styles.ctaIconUnread}` : ''}`} />
      {unread ? <span className={styles.ctaUnreadCount}>({staffUnreadCount})</span> : null}
    </button>
  );
}

function OrderCtaMessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.83335 15.3582H9.16669L12.875 17.8249C13.425 18.1916 14.1667 17.7999 14.1667 17.1332V15.3582C16.6667 15.3582 18.3334 13.6916 18.3334 11.1916V6.19157C18.3334 3.69157 16.6667 2.0249 14.1667 2.0249H5.83335C3.33335 2.0249 1.66669 3.69157 1.66669 6.19157V11.1916C1.66669 13.6916 3.33335 15.3582 5.83335 15.3582Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderMeta(metaRows: AccountOrderWorkMetaRow[]) {
  return (
    <div className={productListStyles.productCardDetailedMeta}>
      {metaRows.map((row, index) => (
        <div key={`${row.label}-${index}`} className={productListStyles.productCardDetailedMetaItem}>
          <span className={productListStyles.productCardDetailedMetaLabel}>{row.label}</span>
          <span title={row.valueTitle}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AccountOrderWorkCard({
  orderId,
  statusLabel,
  statusNotice,
  dateLine,
  metaRows,
  productThumbSrcs,
  detailHref,
  onOpenDetails,
  offer,
  chatTitle = 'Сообщения',
  hideMoreMenu = false,
  statusRejected = false,
  staffUnreadCount = 0,
  hasUnseenCommercialProposal = false,
  chatEnabled = true,
  chatSubject = 'order',
  detailLinkLabel = 'Подробнее о заказе',
  cornerChipLabel,
}: AccountOrderWorkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [displayUnread, setDisplayUnread] = useState(staffUnreadCount);
  const [displayKpUnseen, setDisplayKpUnseen] = useState(hasUnseenCommercialProposal);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages,
    chatLoading,
    chatError,
    chatComposerDisabled,
    chatAttachPickerDisabled,
    pendingAttachmentsHint,
    pendingOutgoingAttachments,
    canSendAttachmentMessage,
    sendChatText,
    attachChatFiles,
    removePendingChatAttachment,
    deleteChatMessage,
    chatHasOlderHistory,
    chatLoadingOlderHistory,
    loadOlderChatMessages,
  } = useOrderChat({
    orderId,
    enabled: chatOpen,
    variant: 'account',
    chatSubject,
    timeLocale: 'ru-RU',
  });

  useEffect(() => {
    setDisplayUnread(staffUnreadCount);
  }, [staffUnreadCount, orderId]);

  useEffect(() => {
    setDisplayKpUnseen(hasUnseenCommercialProposal);
  }, [hasUnseenCommercialProposal, orderId]);

  useEffect(() => {
    const onWorkNotifications = (ev: Event) => {
      const detail = (ev as CustomEvent<AccountWorkNotificationsDetail>).detail;
      if (detail?.entityId !== orderId) return;
      if ((detail.chatSubject ?? 'order') !== chatSubject) return;
      setDisplayUnread(0);
      setDisplayKpUnseen(false);
    };
    window.addEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
    return () => window.removeEventListener(ACCOUNT_WORK_NOTIFICATIONS_EVENT, onWorkNotifications);
  }, [orderId, chatSubject]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = menuWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const thumbs = productThumbSrcs.length > 0 ? productThumbSrcs : [PLACEHOLDER];
  const galleryUrls = thumbs.filter(isZoomableThumb);

  function openThumbGallery(startSrc: string) {
    const idx = galleryUrls.indexOf(startSrc);
    if (idx < 0) return;
    void openOrderChatPhotoSwipe(galleryUrls, idx);
  }

  const metaBlock = offer ? (
    <div className={styles.metaOfferRow}>
      <div className={styles.metaOfferRowMeta}>{renderMeta(metaRows)}</div>
      <div className={styles.orderOffer}>
        <div className={styles.priceDetails}>
          {offer.showDiscountStrip !== false ? (
            <>
              <span className={styles.priceDiscount}>{offer.discountLabel}</span>
              <span className={styles.priceFinal}>{offer.finalPrice}</span>
              <span className={styles.priceOld}>{offer.oldPrice}</span>
            </>
          ) : (
            <span className={styles.priceFinal}>{offer.finalPrice}</span>
          )}
        </div>
        <div className={styles.orderOfferExpectedBonus}>
          <img
            src="/icons/wallet-add.svg"
            alt=""
            width={16}
            height={16}
            className={styles.orderOfferExpectedBonusIcon}
            aria-hidden
          />
          <span className={styles.orderOfferExpectedBonusLine}>
            <span className={styles.orderOfferExpectedBonusLabel}>Ожидаемый бонус: </span>
            <span className={styles.orderOfferExpectedBonusValue}>{offer.expectedBonus}</span>
          </span>
        </div>
      </div>
    </div>
  ) : (
    renderMeta(metaRows)
  );

  const openChat = () => setChatOpen(true);

  return (
    <div className={chatEnabled ? styles.orderWrapper : `${styles.orderWrapper} ${styles.orderWrapperNoChat}`}>
      {chatEnabled ? (
        <ChatWindow
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={chatTitle}
        messages={chatMessages}
        messageEmptyHint={chatLoading ? 'Загрузка…' : 'Пока нет сообщений'}
        errorText={chatError}
        composerDisabled={chatComposerDisabled}
        attachPickerDisabled={chatAttachPickerDisabled}
        attachmentsEnabled
        pendingAttachmentsHint={pendingAttachmentsHint}
        pendingOutgoing={pendingOutgoingAttachments}
        allowEmptySend={canSendAttachmentMessage}
        onSend={sendChatText}
        onAttachFiles={attachChatFiles}
        onRemovePendingAttachment={removePendingChatAttachment}
        onDeleteMessage={deleteChatMessage}
        hasOlderHistory={chatHasOlderHistory}
        loadingOlderHistory={chatLoadingOlderHistory}
        onLoadOlderHistory={loadOlderChatMessages}
        />
      ) : null}
      <div className={styles.orderCard}>
        <div className={styles.orderCardTop}>
          <div className={styles.orderCardTopLeft}>
            <span className={statusRejected ? `${styles.orderStatus} ${styles.orderStatusRejected}` : styles.orderStatus}>
              {statusLabel}
            </span>
            <span className={styles.orderDate}>{dateLine}</span>
            {statusNotice ? <p className={styles.orderStatusNotice}>{statusNotice}</p> : null}
          </div>
          {!hideMoreMenu || cornerChipLabel ? (
            <div className={styles.orderCardTopActions}>
              {cornerChipLabel ? (
                <span className={styles.orderCardCornerChip}>{cornerChipLabel}</span>
              ) : null}
              {!hideMoreMenu ? (
                <div className={productListStyles.productCardDetailedMoreWrap} ref={menuWrapRef}>
                  <button
                    type="button"
                    className={`${productListStyles.iconButton} ${productListStyles.productCardDetailedMoreTrigger}`}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label={chatSubject === 'sourcing' ? 'Действия по заявке' : 'Действия по заказу'}
                    onClick={() => setMenuOpen((o) => !o)}
                  >
                    <img src="/icons/more.svg" alt="" width={20} height={20} className={productListStyles.iconBlack} />
                  </button>
                  {menuOpen ? (
                    <div className={productListStyles.productCardDetailedMoreMenu} role="menu">
                      <button type="button" className={productListStyles.productCardDetailedMoreItem} role="menuitem">
                        Архивировать
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {metaBlock}

        <div className={styles.orderProductImgs}>
          {thumbs.map((src, i) => {
            const zoomable = isZoomableThumb(src);
            return (
              <div key={`${src}-${i}`} className={styles.orderProductImg}>
                {zoomable ? (
                  <button
                    type="button"
                    className={styles.orderProductImgBtn}
                    aria-label="Открыть фото"
                    onClick={() => openThumbGallery(src)}
                  >
                    <img src={src} alt="" width={68} height={73} loading="lazy" />
                  </button>
                ) : (
                  <img src={src} alt="" width={68} height={73} loading="lazy" />
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.orderDetailLinkRow}>
          {onOpenDetails ? (
            <button type="button" className={styles.orderDetailLink} onClick={onOpenDetails}>
              <span className={styles.orderDetailLinkText}>{detailLinkLabel}</span>
              {displayKpUnseen ? (
                <span className={styles.kpUnseenBadge} aria-label="Новое коммерческое предложение">
                  КП
                </span>
              ) : null}
            </button>
          ) : detailHref ? (
            <Link href={detailHref} className={styles.orderDetailLink}>
              <span className={styles.orderDetailLinkText}>{detailLinkLabel}</span>
              {displayKpUnseen ? (
                <span className={styles.kpUnseenBadge} aria-label="Новое коммерческое предложение">
                  КП
                </span>
              ) : null}
            </Link>
          ) : null}
          <img src="/icons/arrow-right.svg" alt="" width={10} height={5} className={styles.orderDetailArrow} aria-hidden />
        </div>
      </div>

      {chatEnabled ? (
        <div className={styles.orderCTA}>
          <MessageCtaButton
            staffUnreadCount={displayUnread}
            onClick={openChat}
            ariaLabel={chatSubject === 'sourcing' ? 'Написать по заявке' : 'Написать по заказу'}
          />
        </div>
      ) : null}
    </div>
  );
}

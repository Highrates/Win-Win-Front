'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat, type OrderChatSubject } from '@/hooks/useOrderChat';
import {
  ACCOUNT_WORK_NOTIFICATIONS_EVENT,
  dispatchAccountWorkFeedRefreshEvent,
  type AccountWorkNotificationsDetail,
} from '@/lib/account/orders';
import { openOrderChatPhotoSwipe } from '@/lib/orderChat/openOrderChatPhotoSwipe';
import { downloadCommercialProposalPdf } from '@/lib/commercialProposal/exportCommercialProposalPdf';
import {
  cacheOrderCommercialProposal,
  cacheSourcingCommercialProposal,
  getCachedOrderCommercialProposal,
  getCachedSourcingCommercialProposal,
} from '@/lib/commercialProposal/kpProposalCache';
import { downloadSourcingCommercialProposalPdf } from '@/lib/commercialProposal/downloadSourcingCommercialProposalPdf';
import {
  archiveUserOrder,
  fetchUserOrder,
} from '@/lib/userOrders/clientApi';
import { fetchUserSourcingRequest } from '@/lib/userSourcingRequests/clientApi';
import { useOrderKpResponse } from '@/hooks/useOrderKpResponse';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import { OrderKpAcceptModal } from './OrderKpAcceptModal';
import { OrderKpActionFooter } from './OrderKpActionFooter';
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
  /** Показать кнопки ответа на КП (подтвердить / правки / отклонить). */
  canRespondToCommercialProposal?: boolean;
  /** Версия опубликованного КП для optimistic concurrency при ответе. */
  commercialProposalVersion?: number | null;
  /** Есть опубликованное КП — показать «Скачать PDF». */
  canDownloadCommercialProposalPdf?: boolean;
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
  canRespondToCommercialProposal = false,
  commercialProposalVersion = null,
  canDownloadCommercialProposalPdf = false,
  chatEnabled = true,
  chatSubject = 'order',
  detailLinkLabel = 'Подробнее о заказе',
  cornerChipLabel,
}: AccountOrderWorkCardProps) {
  const sendChatTextRef = useRef<(text: string) => Promise<boolean>>(async () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayUnread, setDisplayUnread] = useState(staffUnreadCount);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  const {
    chatOpen,
    acceptOpen,
    setAcceptOpen,
    openAccept,
    canRespondKp,
    displayKpUnseen,
    setDisplayKpUnseen,
    chatSeedDraft,
    composerBanner,
    chatInputPlaceholder,
    openChat,
    openKpChat,
    closeChat,
    handleChatSend,
    markAccepted,
    showKpActions: showKpActionsFromHook,
  } = useOrderKpResponse({
    orderId,
    commercialProposalVersion,
    canRespondToCommercialProposal,
    hasUnseenCommercialProposal,
    sendChatText: (text) => sendChatTextRef.current(text),
  });

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
  sendChatTextRef.current = sendChatText;

  useEffect(() => {
    setDisplayUnread(staffUnreadCount);
  }, [staffUnreadCount, orderId]);

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
  }, [orderId, chatSubject, setDisplayKpUnseen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = menuWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
    };
  }, [menuOpen]);

  /**
   * Capture Escape: accept → chat → ⋯ меню (как в DetailModal).
   * stopImmediatePropagation, чтобы bubble-слушатели ChatWindow / useModalBodyLock не снимали второй слой.
   */
  useEffect(() => {
    if (!acceptOpen && !chatOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (acceptOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAcceptOpen(false);
        return;
      }
      if (chatOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeChat();
        return;
      }
      if (menuOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [acceptOpen, chatOpen, menuOpen, closeChat, setAcceptOpen]);

  const thumbs = productThumbSrcs.filter(isZoomableThumb);
  const galleryUrls = thumbs;

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

  async function handleArchive() {
    if (chatSubject !== 'order' || archiveBusy) return;
    setArchiveBusy(true);
    setArchiveError(null);
    setMenuOpen(false);
    try {
      await archiveUserOrder(orderId);
      dispatchAccountWorkFeedRefreshEvent();
    } catch (e) {
      setArchiveError(e instanceof Error ? e.message : 'Не удалось архивировать');
    } finally {
      setArchiveBusy(false);
    }
  }

  async function handleDownloadKpPdf() {
    if (!canDownloadCommercialProposalPdf || pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      if (chatSubject === 'sourcing') {
        const cachedSrc = getCachedSourcingCommercialProposal(orderId);
        if (cachedSrc?.lines?.length) {
          await downloadSourcingCommercialProposalPdf({ requestId: orderId, proposal: cachedSrc });
          return;
        }
        const detail = await fetchUserSourcingRequest(orderId);
        const proposal = detail.latestCommercialProposal;
        if (!proposal?.lines?.length) {
          throw new Error('Коммерческое предложение ещё не опубликовано');
        }
        cacheSourcingCommercialProposal(orderId, proposal);
        await downloadSourcingCommercialProposalPdf({ requestId: orderId, proposal });
        return;
      }
      const cached = getCachedOrderCommercialProposal(orderId);
      if (cached?.lines?.length) {
        await downloadCommercialProposalPdf({ orderId, proposal: cached });
        return;
      }
      const detail = await fetchUserOrder(orderId);
      const proposal = detail.latestCommercialProposal;
      if (!proposal?.lines?.length) {
        throw new Error('Коммерческое предложение ещё не опубликовано');
      }
      cacheOrderCommercialProposal(orderId, proposal);
      await downloadCommercialProposalPdf({ orderId, proposal });
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Не удалось сформировать PDF');
    } finally {
      setPdfBusy(false);
    }
  }

  const showKpActions = chatEnabled && chatSubject === 'order' && showKpActionsFromHook;
  const showPdfDownload = canDownloadCommercialProposalPdf;

  return (
    <div className={chatEnabled ? styles.orderWrapper : `${styles.orderWrapper} ${styles.orderWrapperNoChat}`}>
      {chatEnabled ? (
        <ChatWindow
          open={chatOpen}
          onClose={closeChat}
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
          onSend={handleChatSend}
          seedDraft={chatSeedDraft}
          composerBanner={composerBanner}
          inputPlaceholder={chatInputPlaceholder}
          onAttachFiles={attachChatFiles}
          onRemovePendingAttachment={removePendingChatAttachment}
          onDeleteMessage={deleteChatMessage}
          hasOlderHistory={chatHasOlderHistory}
          loadingOlderHistory={chatLoadingOlderHistory}
          onLoadOlderHistory={loadOlderChatMessages}
        />
      ) : null}

      {chatSubject === 'order' ? (
        <OrderKpAcceptModal
          open={acceptOpen}
          orderId={orderId}
          expectedVersion={commercialProposalVersion}
          onClose={() => setAcceptOpen(false)}
          onAccepted={markAccepted}
        />
      ) : null}

      <div className={styles.orderCard}>
        <div className={styles.orderCardTop}>
          <div className={styles.orderCardTopLeft}>
            <span className={statusRejected ? `${styles.orderStatus} ${styles.orderStatusRejected}` : styles.orderStatus}>
              {statusLabel}
            </span>
            <span className={styles.orderDate}>{dateLine}</span>
            {statusNotice ? (
              <p
                className={
                  statusRejected
                    ? `${styles.orderStatusNotice} ${styles.orderStatusNoticeRejected}`
                    : styles.orderStatusNotice
                }
              >
                {statusNotice}
              </p>
            ) : null}
            {archiveError ? (
              <p className={`${styles.orderStatusNotice} ${styles.orderStatusNoticeRejected}`} role="alert">
                {archiveError}
              </p>
            ) : null}
          </div>
          {!hideMoreMenu || cornerChipLabel ? (
            <div className={styles.orderCardTopActions}>
              {cornerChipLabel ? (
                <span className={styles.orderCardCornerChip}>{cornerChipLabel}</span>
              ) : null}
              {!hideMoreMenu && chatSubject === 'order' ? (
                <div className={productListStyles.productCardDetailedMoreWrap} ref={menuWrapRef}>
                  <button
                    type="button"
                    className={`${productListStyles.iconButton} ${productListStyles.productCardDetailedMoreTrigger}`}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Действия по заказу"
                    onClick={() => setMenuOpen((o) => !o)}
                  >
                    <img src="/icons/more.svg" alt="" width={20} height={20} className={productListStyles.iconBlack} />
                  </button>
                  {menuOpen ? (
                    <div className={productListStyles.productCardDetailedMoreMenu} role="menu">
                      <button
                        type="button"
                        className={productListStyles.productCardDetailedMoreItem}
                        role="menuitem"
                        disabled={archiveBusy}
                        onClick={() => void handleArchive()}
                      >
                        {archiveBusy ? 'Архивация…' : 'Архивировать'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {metaBlock}

        {thumbs.length > 0 ? (
          <div className={styles.orderProductImgs}>
            {thumbs.map((src, i) => (
              <div key={`${src}-${i}`} className={styles.orderProductImg}>
                <button
                  type="button"
                  className={styles.orderProductImgBtn}
                  aria-label="Открыть фото"
                  onClick={() => openThumbGallery(src)}
                >
                  <img src={src} alt="" width={68} height={73} loading="lazy" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.orderDetailLinkRow}>
          {onOpenDetails ? (
            <button type="button" className={styles.orderDetailLink} onClick={onOpenDetails}>
              <span className={styles.orderDetailLinkText}>{detailLinkLabel}</span>
              {displayKpUnseen ? (
                <span className={styles.kpUnseenBadge} aria-label="Новое коммерческое предложение">
                  КП
                </span>
              ) : null}
              <img
                src="/icons/arrow-right.svg"
                alt=""
                width={12}
                height={7}
                className={styles.orderDetailArrow}
                aria-hidden
              />
            </button>
          ) : detailHref ? (
            <Link href={detailHref} className={styles.orderDetailLink}>
              <span className={styles.orderDetailLinkText}>{detailLinkLabel}</span>
              {displayKpUnseen ? (
                <span className={styles.kpUnseenBadge} aria-label="Новое коммерческое предложение">
                  КП
                </span>
              ) : null}
              <img
                src="/icons/arrow-right.svg"
                alt=""
                width={12}
                height={7}
                className={styles.orderDetailArrow}
                aria-hidden
              />
            </Link>
          ) : null}
          {showPdfDownload ? (
            <button
              type="button"
              className={styles.orderDetailLink}
              onClick={() => void handleDownloadKpPdf()}
              disabled={pdfBusy}
              aria-label="Скачать коммерческое предложение в PDF"
            >
              <img
                src="/icons/document-download.svg"
                alt=""
                width={14}
                height={14}
                className={styles.orderDetailPdfIcon}
                aria-hidden
              />
              <span className={styles.orderDetailLinkText}>{pdfBusy ? 'PDF…' : 'Скачать PDF'}</span>
            </button>
          ) : null}
        </div>
        {pdfError ? (
          <p className={`${styles.orderStatusNotice} ${styles.orderStatusNoticeRejected}`} role="alert">
            {pdfError}
          </p>
        ) : null}
      </div>

      {chatEnabled ? (
        <OrderKpActionFooter
          variant="card"
          staffUnreadCount={displayUnread}
          canRespondKp={showKpActions}
          onOpenChat={openChat}
          onConfirm={openAccept}
          onRequestChanges={() => openKpChat('CHANGES_REQUESTED')}
          onReject={() => openKpChat('REJECTED')}
          chatAriaLabel={chatSubject === 'sourcing' ? 'Написать по заявке' : 'Написать по заказу'}
        />
      ) : null}
    </div>
  );
}

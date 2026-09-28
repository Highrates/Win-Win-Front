'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import {
  ProductQaTopicTabs,
  productQaTopicPanelA11y,
} from '@/components/ProductQa/ProductQaTopicTabs';
import { ProductQaTurnstile } from '@/components/ProductQaTurnstile/ProductQaTurnstile';
import { ProductChatStaffBanner } from '@/components/ProductQa/ProductChatStaffBanner';
import { useProductQaChat } from '@/hooks/useProductQaChat';
import styles from './ProductQaChatPanel.module.css';

type Props = {
  productSlug: string;
  enabled?: boolean;
  productVariantId?: string | null;
  initialTopicSlug?: string;
  initialMessageCount?: number;
  onMessageCountChange?: (count: number) => void;
  chatTitle?: string;
  idPrefix?: string;
  /** Путь для login callback (PDP vs account). */
  loginReturnPath?: string;
  /** Отправка вопроса в private correspondence (PDP), не в публичный тред. */
  postToCorrespondence?: boolean;
  /** inline fill (default) или floating overlay (portal, правый нижний угол). */
  presentation?: 'inline' | 'overlay';
  chatOpen?: boolean;
  onChatClose?: () => void;
  sectionId?: string;
};

export function ProductQaChatPanel({
  productSlug,
  enabled = true,
  productVariantId,
  initialTopicSlug,
  initialMessageCount = 0,
  onMessageCountChange,
  chatTitle = 'Вопросы и ответы',
  idPrefix = 'product-qa',
  loginReturnPath,
  postToCorrespondence = false,
  presentation = 'inline',
  chatOpen = false,
  onChatClose,
  sectionId,
}: Props) {
  const isOverlay = presentation === 'overlay';
  const dataEnabled = enabled && (!isOverlay || chatOpen);
  const panelOpen = isOverlay ? chatOpen : enabled;
  const panelA11y = productQaTopicPanelA11y(idPrefix);
  const chat = useProductQaChat({
    productSlug,
    enabled: dataEnabled,
    productVariantId,
    initialTopicSlug,
    initialMessageCount,
    onMessageCountChange,
    postToCorrespondence,
  });

  const loginHref = useMemo(() => {
    const path =
      loginReturnPath ??
      (typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/product/${productSlug}`);
    return `/login?callbackUrl=${encodeURIComponent(path)}`;
  }, [loginReturnPath, productSlug]);

  const activeTabId = `${panelA11y.panelId.replace('-panel', '')}-tab-${chat.activeTopicSlug}`;

  const inputPlaceholder =
    postToCorrespondence || !chat.preModerationEnabled
      ? 'Напишите вопрос…'
      : 'Ваш вопрос будет опубликован после модерации';

  const chatWindow = (
    <ChatWindow
      variant={isOverlay ? 'portal' : 'embedded'}
      embeddedLayout="fill"
      open={panelOpen}
      onClose={onChatClose ?? (() => undefined)}
      hideCloseButton={!isOverlay}
      title={chatTitle}
      titleTransform="none"
      messages={chat.messages}
      messageEmptyHint={chat.loading ? 'Загрузка…' : 'Пока нет сообщений'}
      errorText={chat.error}
      composerDisabled={chat.composerDisabled}
      attachPickerDisabled={chat.attachPickerDisabled}
      attachmentsEnabled={chat.authenticated === true}
      pendingAttachmentsHint={chat.pendingAttachmentsHint}
      pendingOutgoing={chat.pendingOutgoingAttachments}
      allowEmptySend={chat.canSendAttachmentMessage}
      onSend={chat.sendChatText}
      onAttachFiles={chat.attachChatFiles}
      onRemovePendingAttachment={chat.removePendingChatAttachment}
      hasOlderHistory={chat.hasOlderHistory}
      loadingOlderHistory={chat.loadingOlderHistory}
      onLoadOlderHistory={chat.loadOlderChatMessages}
      composerBanner={
        chat.viewerIsStaff ? (
          <ProductChatStaffBanner />
        ) : chat.authenticated !== true ? (
          chat.authenticated === null ? (
            'Загрузка…'
          ) : (
            <>
              <Link href={loginHref} className={styles.guestLink}>
                Войдите
              </Link>
              , чтобы задать вопрос по товару
            </>
          )
        ) : undefined
      }
      inputPlaceholder={inputPlaceholder}
    />
  );

  if (isOverlay) {
    return (
      <>
        {chatWindow}
        {chat.authenticated === true && chat.turnstileRequired ? (
          <ProductQaTurnstile resetKey={chat.turnstileResetKey} onToken={chat.onTurnstileToken} />
        ) : null}
      </>
    );
  }

  return (
    <div className={styles.root} id={sectionId}>
      {chat.topics.length > 1 ? (
        <ProductQaTopicTabs
          topics={chat.topics}
          activeTopicSlug={chat.activeTopicSlug}
          onSelect={chat.setActiveTopicSlug}
          idPrefix={idPrefix}
        />
      ) : null}

      <div
        id={panelA11y.panelId}
        role="tabpanel"
        aria-labelledby={activeTabId}
        className={styles.chatShell}
      >
        {chatWindow}
      </div>

      {chat.authenticated === true && chat.turnstileRequired ? (
        <ProductQaTurnstile resetKey={chat.turnstileResetKey} onToken={chat.onTurnstileToken} />
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { ChatMessageBodyEdit } from '@/components/ChatWindow/ChatMessageBodyEdit';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { ProductQaTurnstile } from '@/components/ProductQaTurnstile/ProductQaTurnstile';
import { useProductCorrespondenceChat } from '@/hooks/useProductCorrespondenceChat';
import { canUserEditCorrespondenceMessage } from '@/lib/productQa/editHelpers';
import { patchProductCorrespondenceMessage } from '@/lib/productCorrespondence/correspondenceApi';
import styles from '@/components/ProductQa/ProductQaChatPanel.module.css';

type Props = {
  productSlug: string;
  enabled?: boolean;
  productVariantId?: string | null;
  chatTitle?: string;
  loginReturnPath?: string;
  /** inline fill (default) или floating overlay (portal, правый нижний угол). */
  presentation?: 'inline' | 'overlay';
  chatOpen?: boolean;
  onChatClose?: () => void;
};

export function ProductCorrespondenceChatPanel({
  productSlug,
  enabled = true,
  productVariantId,
  chatTitle = 'Переписка по товару',
  loginReturnPath,
  presentation = 'inline',
  chatOpen = false,
  onChatClose,
}: Props) {
  const isOverlay = presentation === 'overlay';
  const dataEnabled = enabled && (!isOverlay || chatOpen);
  const panelOpen = isOverlay ? chatOpen : enabled;

  const chat = useProductCorrespondenceChat({
    productSlug,
    enabled: dataEnabled,
    productVariantId,
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBusyId, setEditBusyId] = useState<string | null>(null);

  const displayMessages = useMemo(() => {
    const rawById = new Map(chat.rawMessages.map((r) => [r.id, r]));
    return chat.messages.map((m) => {
      const raw = rawById.get(m.id);
      if (!raw || !canUserEditCorrespondenceMessage(raw, chat.viewerUserId)) return m;
      if (editingMessageId === raw.id) {
        return {
          ...m,
          footerSlot: (
            <ChatMessageBodyEdit
              initialBody={raw.body}
              busy={editBusyId === raw.id}
              onCancel={() => setEditingMessageId(null)}
              onSave={async (body) => {
                setEditBusyId(raw.id);
                try {
                  const updated = await patchProductCorrespondenceMessage(productSlug, raw.id, body);
                  chat.patchMessage(updated);
                  setEditingMessageId(null);
                } finally {
                  setEditBusyId(null);
                }
              }}
            />
          ),
        };
      }
      return {
        ...m,
        footerSlot: (
          <AdminCompactBtn type="button" onClick={() => setEditingMessageId(raw.id)}>
            Редактировать
          </AdminCompactBtn>
        ),
      };
    });
  }, [chat, editingMessageId, editBusyId, productSlug]);

  const loginHref = useMemo(() => {
    const path =
      loginReturnPath ??
      (typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/account/questions`);
    return `/login?callbackUrl=${encodeURIComponent(path)}`;
  }, [loginReturnPath]);

  const chatWindow = (
    <ChatWindow
      variant={isOverlay ? 'portal' : 'embedded'}
      embeddedLayout="fill"
      open={panelOpen}
      onClose={onChatClose ?? (() => undefined)}
      hideCloseButton={!isOverlay}
      title={chatTitle}
      titleTransform="none"
      messages={displayMessages}
      messageEmptyHint={chat.loading ? 'Загрузка…' : 'Напишите вопрос — ответ придёт сюда'}
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
        chat.authenticated === false ? (
          <>
            <Link href={loginHref} className={styles.guestLink}>
              Войдите
            </Link>
            , чтобы переписываться с магазином по этому товару
          </>
        ) : undefined
      }
      inputPlaceholder="Напишите вопрос…"
    />
  );

  const turnstile =
    chat.authenticated === true && chat.turnstileRequired ? (
      <ProductQaTurnstile resetKey={chat.turnstileResetKey} onToken={chat.onTurnstileToken} />
    ) : null;

  if (isOverlay) {
    return (
      <>
        {chatWindow}
        {turnstile}
      </>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.chatShell}>
        {chatWindow}
      </div>
      {turnstile}
    </div>
  );
}

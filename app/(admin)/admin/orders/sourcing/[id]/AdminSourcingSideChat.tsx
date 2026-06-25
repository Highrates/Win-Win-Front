'use client';

import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat } from '@/hooks/useOrderChat';
import od from '../../[id]/orderAdminDetail.module.css';

export function AdminSourcingSideChat({ sourcingRequestId }: { sourcingRequestId: string }) {
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
    orderId: sourcingRequestId,
    enabled: true,
    variant: 'admin',
    chatSubject: 'sourcing',
    timeLocale: 'ru-RU',
  });

  return (
    <div className={od.sideRoot}>
      <div className={od.tabPanels}>
        <div className={od.chatWrap}>
          <ChatWindow
            variant="embedded"
            open
            hideCloseButton
            onClose={() => {}}
            title="Чат по заявке"
            messages={chatMessages}
            messageEmptyHint={chatLoading ? 'Загрузка…' : 'Пока нет сообщений'}
            inputPlaceholder="Сообщение клиенту…"
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
        </div>
      </div>
    </div>
  );
}

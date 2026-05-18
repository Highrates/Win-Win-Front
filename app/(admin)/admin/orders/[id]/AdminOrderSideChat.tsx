'use client';

import { useMemo, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import od from './orderAdminDetail.module.css';

type Tab = 'chat' | 'notes';

export function AdminOrderSideChat({ orderId }: { orderId: string }) {
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const [tab, setTab] = useState<Tab>('chat');
  const [notes, setNotes] = useState('');

  const timeLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const chatEnabled = tab === 'chat';

  const loadingHint = locale === 'zh' ? '加载中…' : 'Загрузка…';

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
    enabled: chatEnabled,
    variant: 'admin',
    timeLocale,
  });

  return (
    <div className={od.sideRoot}>
      <div className={od.tabs} role="tablist" aria-label={d.chatAsideAria}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={`${od.tab} ${tab === 'chat' ? od.tabActive : ''}`}
          onClick={() => setTab('chat')}
        >
          {d.tabChat}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'notes'}
          className={`${od.tab} ${tab === 'notes' ? od.tabActive : ''}`}
          onClick={() => setTab('notes')}
        >
          {d.tabNotes}
        </button>
      </div>
      <div className={od.tabPanels}>
        {tab === 'chat' ? (
          <div className={od.chatWrap}>
            <ChatWindow
              variant="embedded"
              open
              hideCloseButton
              title={d.tabChat}
              messages={chatMessages}
              messageEmptyHint={chatLoading ? loadingHint : d.chatEmpty}
              inputPlaceholder={d.chatPlaceholder}
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
              loadOlderHistoryLabel={d.chatLoadOlder}
              messageDayLocale={timeLocale}
              onClose={() => {}}
            />
          </div>
        ) : (
          <>
            <textarea
              className={od.notesArea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={d.notesPlaceholder}
              aria-label={d.notesPlaceholder}
            />
            <p className={od.notesHint}>{d.notesHint}</p>
          </>
        )}
      </div>
    </div>
  );
}

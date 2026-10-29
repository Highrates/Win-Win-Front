'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminTextArea } from '@/components/AdminTextField/AdminTextField';
import { useOrderChat } from '@/hooks/useOrderChat';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useUnsavedChangesGuard } from '@/lib/adminConfirm/useUnsavedChangesGuard';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import od from './orderAdminDetail.module.css';

type Tab = 'chat' | 'notes';

type Props = {
  orderId: string;
  initialAdminNotes?: string | null;
};

export function AdminOrderSideChat({ orderId, initialAdminNotes = '' }: Props) {
  const { locale } = useAdminLocale();
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const [tab, setTab] = useState<Tab>('chat');
  const [notes, setNotes] = useState(initialAdminNotes ?? '');
  const [savedNotes, setSavedNotes] = useState(initialAdminNotes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSavedFlash, setNotesSavedFlash] = useState(false);
  const saveSeq = useRef(0);
  const notesRef = useRef(notes);
  const notesDirtyRef = useRef(false);
  const saveNotesRef = useRef<(value: string) => Promise<void>>(async () => {});

  const timeLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const chatEnabled = tab === 'chat';
  const notesDirty = notes !== savedNotes;
  notesRef.current = notes;
  notesDirtyRef.current = notesDirty;

  const loadingHint = locale === 'zh' ? '加载中…' : 'Загрузка…';

  useUnsavedChangesGuard(notesDirty);

  useEffect(() => {
    const next = initialAdminNotes ?? '';
    setNotes(next);
    setSavedNotes(next);
    setNotesError(null);
    setNotesSavedFlash(false);
  }, [orderId, initialAdminNotes]);

  const saveNotes = useCallback(
    async (value: string) => {
      const seq = ++saveSeq.current;
      setNotesSaving(true);
      setNotesError(null);
      setNotesSavedFlash(false);
      try {
        const res = await adminBackendJson<{ adminNotes: string | null }>(
          `orders/admin/${encodeURIComponent(orderId)}/admin-notes`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminNotes: value }),
          },
        );
        if (seq !== saveSeq.current) return;
        const persisted = res.adminNotes ?? '';
        setSavedNotes(persisted);
        setNotes((cur) => (cur === value ? persisted : cur));
        setNotesSavedFlash(true);
      } catch (e) {
        if (seq !== saveSeq.current) return;
        setNotesError(e instanceof Error ? e.message : d.notesSaveError);
      } finally {
        if (seq === saveSeq.current) setNotesSaving(false);
      }
    },
    [d.notesSaveError, orderId],
  );
  saveNotesRef.current = saveNotes;

  useEffect(() => {
    if (!notesDirty || tab !== 'notes') return;
    const timer = window.setTimeout(() => {
      void saveNotes(notes);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [notes, notesDirty, saveNotes, tab]);

  useEffect(() => {
    if (!notesSavedFlash) return;
    const timer = window.setTimeout(() => setNotesSavedFlash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [notesSavedFlash]);

  useEffect(() => {
    const flushIfDirty = () => {
      if (!notesDirtyRef.current) return;
      void saveNotesRef.current(notesRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushIfDirty();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushIfDirty);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushIfDirty);
    };
  }, []);

  function changeTab(next: Tab) {
    if (tab === 'notes' && next !== 'notes' && notesDirty) {
      void saveNotes(notes);
    }
    setTab(next);
  }

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

  const notesStatus = notesError
    ? notesError
    : notesSaving
      ? d.notesSaving
      : notesSavedFlash
        ? d.notesSaved
        : d.notesHint;

  return (
    <div className={od.sideRoot}>
      <AdminTabs
        variant="pill"
        ariaLabel={d.chatAsideAria}
        items={[
          { id: 'chat' as const, label: d.tabChat },
          { id: 'notes' as const, label: d.tabNotes },
        ]}
        activeId={tab}
        onChange={changeTab}
        className={od.sideTabs}
      />
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
            <AdminTextArea
              className={od.notesField}
              controlClassName={od.notesControl}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesSavedFlash(false);
                setNotesError(null);
              }}
              onBlur={() => {
                if (notesDirty && !notesSaving) void saveNotes(notes);
              }}
              placeholder={d.notesPlaceholder}
              aria-label={d.notesPlaceholder}
            />
            <div className={od.notesFooter}>
              <p
                className={notesError ? catalogStyles.error : catalogStyles.muted}
                role={notesError ? 'alert' : undefined}
              >
                {notesStatus}
              </p>
              {notesDirty ? (
                <AdminCompactBtn
                  type="button"
                  variant="outline"
                  disabled={notesSaving}
                  onClick={() => void saveNotes(notes)}
                >
                  {notesSaving ? d.notesSaving : d.notesSave}
                </AdminCompactBtn>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

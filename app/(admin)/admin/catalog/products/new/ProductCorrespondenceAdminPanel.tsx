'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminMessageIconBtn } from './AdminMessageIconBtn';
import { ChatMessageBodyEdit } from '@/components/ChatWindow/ChatMessageBodyEdit';
import { useAdminProductCorrespondenceChat } from '@/hooks/useAdminProductCorrespondenceChat';
import {
  publishAdminCorrespondencePairToQa,
  publishAdminCorrespondenceToQa,
  patchAdminCorrespondenceMessageBody,
} from '@/lib/adminProductCorrespondence/adminProductCorrespondenceApi';
import { markAdminProductQaSeen } from '@/lib/adminProductQa/adminProductQaApi';
import { AdminBackendRequestError } from '@/lib/adminBackendFetch';
import { PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID, PRODUCT_QA_DEFAULT_TOPIC_SLUG } from '@/lib/productQa/constants';
import type { ProductCorrespondenceMessage } from '@/lib/productCorrespondence/types';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';
import qaStyles from './productQaAdmin.module.css';

type Props = {
  productId: string;
  presentation?: 'page' | 'queue';
};

function findPublishablePair(
  rows: ProductCorrespondenceMessage[],
): { questionId: string; answerId: string } | null {
  const chronological = [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (let i = 0; i < chronological.length; i += 1) {
    const q = chronological[i];
    if (q.authorRole !== 'USER' || q.isPublishedToStorefront) continue;
    const answer = chronological.slice(i + 1).find(
      (m) =>
        m.authorRole === 'STAFF' &&
        !m.isPublishedToStorefront &&
        m.createdAt >= q.createdAt,
    );
    if (answer) return { questionId: q.id, answerId: answer.id };
  }
  return null;
}

export function ProductCorrespondenceAdminPanel({
  productId,
  presentation = 'page',
}: Props) {
  const isQueue = presentation === 'queue';
  const chat = useAdminProductCorrespondenceChat({ productId });
  const panelRef = useRef<HTMLDivElement>(null);
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null);
  const [pairBusy, setPairBusy] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBusyId, setEditBusyId] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const publishablePair = useMemo(
    () => findPublishablePair(chat.rawMessages),
    [chat.rawMessages],
  );

  const publishMessage = useCallback(
    async (messageId: string) => {
      setPublishBusyId(messageId);
      setPanelError(null);
      try {
        const updated = await publishAdminCorrespondenceToQa(productId, messageId, {
          topicSlug: PRODUCT_QA_DEFAULT_TOPIC_SLUG,
        });
        chat.patchMessage(updated);
      } catch (e: unknown) {
        const msg =
          e instanceof AdminBackendRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Ошибка публикации';
        setPanelError(msg);
      } finally {
        setPublishBusyId(null);
      }
    },
    [chat, productId],
  );

  const publishPair = useCallback(async () => {
    if (!publishablePair) return;
    setPairBusy(true);
    setPanelError(null);
    try {
      const result = await publishAdminCorrespondencePairToQa(productId, {
        questionMessageId: publishablePair.questionId,
        answerMessageId: publishablePair.answerId,
        topicSlug: PRODUCT_QA_DEFAULT_TOPIC_SLUG,
      });
      chat.patchMessage(result.question);
      chat.patchMessage(result.answer);
    } catch (e: unknown) {
      const msg =
        e instanceof AdminBackendRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Ошибка публикации пары';
      setPanelError(msg);
    } finally {
      setPairBusy(false);
    }
  }, [chat, productId, publishablePair]);

  const messagesWithActions = useMemo(() => {
    const rawById = new Map(chat.rawMessages.map((r) => [r.id, r]));
    return chat.messages.map((m) => {
      const raw = rawById.get(m.id);
      if (!raw) return m;

      if (editingMessageId === raw.id) {
        return {
          ...m,
          footerSlot: (
            <ChatMessageBodyEdit
              initialBody={raw.body}
              busy={editBusyId === raw.id}
              onCancel={() => setEditingMessageId(null)}
              onSave={async (body) => {
                if (!chat.activeCustomerUserId) return;
                setEditBusyId(raw.id);
                setPanelError(null);
                try {
                  const updated = await patchAdminCorrespondenceMessageBody(
                    productId,
                    chat.activeCustomerUserId,
                    raw.id,
                    body,
                  );
                  chat.patchMessage(updated);
                  setEditingMessageId(null);
                } catch (e: unknown) {
                  const msg =
                    e instanceof AdminBackendRequestError
                      ? e.message
                      : e instanceof Error
                        ? e.message
                        : 'Ошибка редактирования';
                  setPanelError(msg);
                } finally {
                  setEditBusyId(null);
                }
              }}
            />
          ),
        };
      }

      const actionButtons: React.ReactNode[] = [];
      if (isQueue) {
        actionButtons.push(
          <AdminMessageIconBtn
            key="edit"
            iconSrc="/icons/edit.svg"
            label="Редактировать"
            disabled={editBusyId === raw.id}
            onClick={() => setEditingMessageId(raw.id)}
          />,
        );
        if (!raw.isPublishedToStorefront && raw.authorRole === 'USER') {
          actionButtons.push(
            <AdminMessageIconBtn
              key="publish"
              iconSrc="/icons/direct-up.svg"
              label="Только это сообщение"
              disabled={publishBusyId === raw.id}
              onClick={() => void publishMessage(raw.id)}
            />,
          );
        }
      } else {
        actionButtons.push(
          <AdminCompactBtn
            key="edit"
            type="button"
            disabled={editBusyId === raw.id}
            onClick={() => setEditingMessageId(raw.id)}
          >
            Редактировать
          </AdminCompactBtn>,
        );
        if (!raw.isPublishedToStorefront && raw.authorRole === 'USER') {
          actionButtons.push(
            <AdminCompactBtn
              key="publish"
              type="button"
              disabled={publishBusyId === raw.id}
              onClick={() => void publishMessage(raw.id)}
            >
              {publishBusyId === raw.id ? 'Публикация…' : 'Только это сообщение'}
            </AdminCompactBtn>,
          );
        }
      }

      return {
        ...m,
        footerSlot: <div className={qaStyles.messageIconActions}>{actionButtons}</div>,
      };
    });
  }, [
    chat.activeCustomerUserId,
    chat.messages,
    chat.rawMessages,
    editBusyId,
    editingMessageId,
    patchAdminCorrespondenceMessageBody,
    productId,
    publishBusyId,
    publishMessage,
    isQueue,
  ]);

  const activeThread = chat.threads.find((t) => t.customerUserId === chat.activeCustomerUserId);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return undefined;

    let marked = false;
    const markSeenIfVisible = () => {
      if (marked || document.visibilityState !== 'visible') return;
      marked = true;
      void markAdminProductQaSeen(productId).catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          markSeenIfVisible();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);

    if (
      typeof window !== 'undefined' &&
      window.location.hash === `#${PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID}`
    ) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return () => observer.disconnect();
  }, [productId]);

  return (
    <div
      ref={panelRef}
      className={isQueue ? qaStyles.queuePanelRoot : pn.section}
      id={PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID}
    >
      {!isQueue ? (
        <>
          <h2 className={pn.sectionTitle}>Переписка с покупателями</h2>
          <p className={catalogStyles.muted}>
            Приватный канал 1:1 — не путать с HIDDEN на публичной витрине. Рекомендуемый способ на
            витрину: curated-пара «вопрос → ответ».
          </p>
        </>
      ) : null}

      {panelError ? (
        <p className={qaStyles.error} role="alert">
          {panelError}
        </p>
      ) : null}

      {publishablePair && !isQueue ? (
        <div className={qaStyles.pairPublishRow}>
          <AdminCompactBtn type="button" disabled={pairBusy} onClick={() => void publishPair()}>
            {pairBusy ? 'Публикация…' : 'Опубликовать пару Q→A на витрине'}
          </AdminCompactBtn>
        </div>
      ) : null}

      {publishablePair && isQueue ? (
        <div className={qaStyles.pairPublishRow}>
          <AdminMessageIconBtn
            iconSrc="/icons/direct-up.svg"
            label="Опубликовать пару Q→A на витрине"
            disabled={pairBusy}
            onClick={() => void publishPair()}
          />
        </div>
      ) : null}

      <div className={qaStyles.correspondenceLayout}>
        <aside className={qaStyles.threadList} aria-label="Диалоги">
          {chat.loadingThreads ? (
            <p className={catalogStyles.muted}>Загрузка…</p>
          ) : chat.threads.length === 0 ? (
            <p className={catalogStyles.muted}>Переписок пока нет</p>
          ) : (
            <ul className={qaStyles.threadListUl}>
              {chat.threads.map((t) => (
                <li key={t.correspondenceId}>
                  <button
                    type="button"
                    className={
                      t.customerUserId === chat.activeCustomerUserId
                        ? qaStyles.threadBtnActive
                        : qaStyles.threadBtn
                    }
                    onClick={() => chat.setActiveCustomerUserId(t.customerUserId)}
                  >
                    <span className={qaStyles.threadLabel}>{t.customerLabel}</span>
                    {t.lastMessagePreview ? (
                      <span className={qaStyles.threadPreview}>{t.lastMessagePreview}</span>
                    ) : null}
                    {t.unpublishedCount > 0 ? (
                      <span className={qaStyles.threadBadge}>{t.unpublishedCount} не на витрине</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className={qaStyles.chatShell}>
          {activeThread ? (
            <p className={catalogStyles.muted} style={{ marginBottom: 8 }}>
              {activeThread.customerLabel}
            </p>
          ) : null}
          <ChatWindow
            variant="embedded"
            embeddedLayout="fill"
            open
            onClose={() => undefined}
            hideCloseButton
            title=""
            messages={messagesWithActions}
            messageEmptyHint={chat.loading ? 'Загрузка…' : 'Выберите диалог или дождитесь первого вопроса'}
            errorText={chat.error}
            composerDisabled={chat.composerDisabled}
            attachPickerDisabled={chat.attachPickerDisabled}
            attachmentsEnabled={Boolean(chat.activeCustomerUserId)}
            pendingOutgoing={chat.pendingOutgoingAttachments}
            allowEmptySend={chat.canSendAttachmentMessage}
            onSend={chat.sendChatText}
            onAttachFiles={chat.attachChatFiles}
            onRemovePendingAttachment={chat.removePendingChatAttachment}
            hasOlderHistory={chat.hasOlderHistory}
            loadingOlderHistory={chat.loadingOlderHistory}
            onLoadOlderHistory={chat.loadOlderChatMessages}
            inputPlaceholder="Приватный ответ (не публикуется автоматически)…"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow/ChatWindow';
import {
  ProductQaTopicTabs,
  productQaTopicPanelA11y,
} from '@/components/ProductQa/ProductQaTopicTabs';
import { useAdminProductQaChat } from '@/hooks/useAdminProductQaChat';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminMessageIconBtn } from './AdminMessageIconBtn';
import { ChatMessageBodyEdit } from '@/components/ChatWindow/ChatMessageBodyEdit';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import {
  approveAdminProductQaMessage,
  createAdminProductQaTopic,
  deleteAdminProductQaMessage,
  fetchAdminProductQaMessageRevisions,
  markAdminProductQaSeen,
  patchAdminProductQaMessageBody,
  patchAdminProductQaMessageStatus,
  patchAdminProductQaTopic,
  rejectAdminProductQaMessage,
  type ProductQaMessage,
  type ProductQaMessageRevision,
} from '@/lib/adminProductQa/adminProductQaApi';
import { AdminBackendRequestError } from '@/lib/adminBackendFetch';
import { adminProductQaStrings } from '@/lib/admin-i18n/adminProductQaI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { mapProductQaToChatWindow } from '@/lib/productQa/mapProductQaToChatWindow';
import {
  PRODUCT_QA_ADMIN_PANEL_ID,
} from '@/lib/productQa/constants';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';
import qaStyles from './productQaAdmin.module.css';

type Props = {
  productId: string;
  presentation?: 'page' | 'queue';
};

function statusBadgeClass(status: ProductQaMessage['status']): string {
  if (status === 'VISIBLE') return qaStyles.statusVisible;
  if (status === 'HIDDEN') return qaStyles.statusHidden;
  if (status === 'PENDING') return qaStyles.statusPending;
  if (status === 'REJECTED') return qaStyles.statusRejected;
  return qaStyles.statusDeleted;
}

function statusLabel(
  s: ReturnType<typeof adminProductQaStrings>,
  status: ProductQaMessage['status'],
): string {
  if (status === 'VISIBLE') return s.statusVisible;
  if (status === 'HIDDEN') return s.statusHidden;
  if (status === 'PENDING') return s.statusPending;
  if (status === 'REJECTED') return s.statusRejected;
  return s.statusDeleted;
}

export function ProductQaAdminPanel({
  productId,
  presentation = 'page',
}: Props) {
  const isQueue = presentation === 'queue';
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductQaStrings(locale), [locale]);
  const timeLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';
  const panelA11y = productQaTopicPanelA11y('admin-product-qa');
  const panelRef = useRef<HTMLDivElement>(null);

  const chat = useAdminProductQaChat({
    productId,
    timeLocale,
    loadErrorFallback: s.loadError,
  });
  const {
    topics,
    activeTopicSlug,
    setActiveTopicSlug,
    messageFilter,
    setMessageFilter,
    messages,
    patchMessage,
    loading,
    error,
    hasOlderHistory,
    loadingOlderHistory,
    loadOlderChatMessages,
    viewerUserId,
    viewerStaffAvatar,
    refreshTopics,
  } = chat;

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [topicBusy, setTopicBusy] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicSort, setEditTopicSort] = useState('');
  const [topicPatchBusy, setTopicPatchBusy] = useState(false);
  const [topicEditOpen, setTopicEditOpen] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [revisionsByMessageId, setRevisionsByMessageId] = useState<
    Record<string, ProductQaMessageRevision[]>
  >({});
  const [panelError, setPanelError] = useState<string | null>(null);

  useEffect(() => {
    if (isQueue) setMessageFilter('all');
  }, [isQueue, setMessageFilter]);

  const activeTopic = useMemo(
    () => topics.find((t) => t.slug === activeTopicSlug) ?? null,
    [activeTopicSlug, topics],
  );

  useEffect(() => {
    if (!activeTopic) return;
    setEditTopicTitle(activeTopic.title);
    setEditTopicSort(String(activeTopic.sortOrder));
    setTopicEditOpen(false);
  }, [activeTopic?.id, activeTopic?.title, activeTopic?.sortOrder]);

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

    if (typeof window !== 'undefined' && window.location.hash === `#${PRODUCT_QA_ADMIN_PANEL_ID}`) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return () => observer.disconnect();
  }, [productId]);

  const runAction = useCallback(
    async (messageId: string, fn: () => Promise<ProductQaMessage>) => {
      setActionBusyId(messageId);
      setPanelError(null);
      try {
        const updated = await fn();
        patchMessage(updated);
        if (updated.status !== 'PENDING') {
          void markAdminProductQaSeen(productId).catch(() => undefined);
        }
      } catch (e) {
        const msg =
          e instanceof AdminBackendRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : s.loadError;
        setPanelError(msg);
      } finally {
        setActionBusyId(null);
      }
    },
    [patchMessage, productId, s.loadError],
  );

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTopicTitle.trim();
    if (!title || topicBusy) return;
    setTopicBusy(true);
    setPanelError(null);
    try {
      const created = await createAdminProductQaTopic(productId, { title });
      setNewTopicTitle('');
      await refreshTopics();
      setActiveTopicSlug(created.slug);
    } catch (err) {
      const msg =
        err instanceof AdminBackendRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : s.loadError;
      setPanelError(msg);
    } finally {
      setTopicBusy(false);
    }
  };

  const handlePatchTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic || topicPatchBusy) return;
    const title = editTopicTitle.trim();
    const sortParsed = parseInt(editTopicSort, 10);
    if (!title) return;
    setTopicPatchBusy(true);
    setPanelError(null);
    try {
      await patchAdminProductQaTopic(productId, activeTopic.id, {
        title,
        sortOrder: Number.isFinite(sortParsed) ? sortParsed : activeTopic.sortOrder,
      });
      await refreshTopics();
      setTopicEditOpen(false);
    } catch (err) {
      const msg =
        err instanceof AdminBackendRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : s.loadError;
      setPanelError(msg);
    } finally {
      setTopicPatchBusy(false);
    }
  };

  const loadRevisions = useCallback(
    async (messageId: string) => {
      try {
        const res = await fetchAdminProductQaMessageRevisions(productId, messageId);
        setRevisionsByMessageId((prev) => ({ ...prev, [messageId]: res.items }));
      } catch {
        /* optional audit UI */
      }
    },
    [productId],
  );

  const chatMessages = useMemo(() => {
    return messages.map((m) => {
      const busy = actionBusyId === m.id;
      const base = mapProductQaToChatWindow(
        m,
        viewerUserId,
        timeLocale,
        'admin',
        viewerStaffAvatar,
      );
      if (editingMessageId === m.id) {
        return {
          ...base,
          footerSlot: (
            <ChatMessageBodyEdit
              initialBody={m.body}
              busy={busy}
              onCancel={() => setEditingMessageId(null)}
              onSave={async (body) => {
                await runAction(m.id, () => patchAdminProductQaMessageBody(productId, m.id, body));
                setEditingMessageId(null);
              }}
            />
          ),
        };
      }
      const revisions = revisionsByMessageId[m.id];
      if (isQueue) {
        if (m.status === 'DELETED' || m.status === 'REJECTED') return base;
        const iconActions: React.ReactNode[] = [
          <AdminMessageIconBtn
            key="edit"
            iconSrc="/icons/edit.svg"
            label="Редактировать"
            disabled={busy}
            onClick={() => setEditingMessageId(m.id)}
          />,
        ];
        if (m.status === 'PENDING') {
          iconActions.push(
            <AdminMessageIconBtn
              key="approve"
              iconSrc="/icons/task-square.svg"
              label={s.actionApprove}
              disabled={busy}
              onClick={() =>
                void runAction(m.id, () => approveAdminProductQaMessage(productId, m.id))
              }
            />,
            <AdminMessageIconBtn
              key="reject"
              iconSrc="/icons/delete.svg"
              label={s.actionReject}
              disabled={busy}
              onClick={() =>
                void runAction(m.id, () => rejectAdminProductQaMessage(productId, m.id))
              }
            />,
          );
        }
        if (m.status === 'VISIBLE') {
          iconActions.push(
            <AdminMessageIconBtn
              key="hide"
              iconSrc="/icons/note.svg"
              label={s.actionHide}
              disabled={busy}
              onClick={() =>
                void runAction(m.id, () =>
                  patchAdminProductQaMessageStatus(productId, m.id, 'HIDDEN'),
                )
              }
            />,
          );
        }
        if (m.status === 'HIDDEN') {
          iconActions.push(
            <AdminMessageIconBtn
              key="restore"
              iconSrc="/icons/direct-up.svg"
              label={s.actionRestore}
              disabled={busy}
              onClick={() =>
                void runAction(m.id, () =>
                  patchAdminProductQaMessageStatus(productId, m.id, 'VISIBLE'),
                )
              }
            />,
          );
        }
        iconActions.push(
          <AdminMessageIconBtn
            key="history"
            iconSrc="/icons/document-download.svg"
            label="История"
            disabled={busy}
            onClick={() => void loadRevisions(m.id)}
          />,
        );
        iconActions.push(
          <AdminMessageIconBtn
            key="delete"
            iconSrc="/icons/delete.svg"
            label={s.actionDelete}
            disabled={busy}
            onClick={() =>
              void runAction(m.id, () => deleteAdminProductQaMessage(productId, m.id))
            }
          />,
        );
        return {
          ...base,
          headExtra: (
            <span className={`${qaStyles.status} ${statusBadgeClass(m.status)}`}>
              {statusLabel(s, m.status)}
            </span>
          ),
          footerSlot: (
            <>
              <div className={qaStyles.messageIconActions}>{iconActions}</div>
              {revisions && revisions.length > 0 ? (
                <ul className={qaStyles.revisionList}>
                  {revisions.map((rev) => (
                    <li key={rev.id}>
                      <span className={catalogStyles.muted}>
                        {rev.editedByLabel} · {new Date(rev.createdAt).toLocaleString(timeLocale)}
                      </span>
                      <p>{rev.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ),
        };
      }
      return {
        ...base,
        headExtra: (
          <>
            <span className={`${qaStyles.status} ${statusBadgeClass(m.status)}`}>
              {statusLabel(s, m.status)}
            </span>
          </>
        ),
        footerSlot: (
          <div className={qaStyles.actions}>
            {m.status === 'PENDING' ? (
              <>
                <AdminCompactBtn
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(m.id, () => approveAdminProductQaMessage(productId, m.id))
                  }
                >
                  {busy ? s.actionBusy : s.actionApprove}
                </AdminCompactBtn>
                <AdminCompactBtn
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(m.id, () => rejectAdminProductQaMessage(productId, m.id))
                  }
                >
                  {busy ? s.actionBusy : s.actionReject}
                </AdminCompactBtn>
              </>
            ) : null}
            {m.status === 'VISIBLE' ? (
              <AdminCompactBtn
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction(m.id, () =>
                    patchAdminProductQaMessageStatus(productId, m.id, 'HIDDEN'),
                  )
                }
              >
                {busy ? s.actionBusy : s.actionHide}
              </AdminCompactBtn>
            ) : null}
            {m.status === 'HIDDEN' || m.status === 'DELETED' ? (
              <AdminCompactBtn
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction(m.id, () =>
                    patchAdminProductQaMessageStatus(productId, m.id, 'VISIBLE'),
                  )
                }
              >
                {busy ? s.actionBusy : s.actionRestore}
              </AdminCompactBtn>
            ) : null}
            {m.status !== 'DELETED' ? (
              <AdminCompactBtn
                type="button"
                disabled={busy}
                onClick={() => setEditingMessageId(m.id)}
              >
                Редактировать
              </AdminCompactBtn>
            ) : null}
            {m.status !== 'DELETED' ? (
              <AdminCompactBtn
                type="button"
                disabled={busy}
                onClick={() => void loadRevisions(m.id)}
              >
                История
              </AdminCompactBtn>
            ) : null}
            {m.status !== 'DELETED' ? (
              <AdminCompactBtn
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction(m.id, () => deleteAdminProductQaMessage(productId, m.id))
                }
              >
                {busy ? s.actionBusy : s.actionDelete}
              </AdminCompactBtn>
            ) : null}
            {revisions && revisions.length > 0 ? (
              <ul className={qaStyles.revisionList}>
                {revisions.map((rev) => (
                  <li key={rev.id}>
                    <span className={catalogStyles.muted}>
                      {rev.editedByLabel} · {new Date(rev.createdAt).toLocaleString(timeLocale)}
                    </span>
                    <p>{rev.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ),
      };
    });
  }, [
    actionBusyId,
    editingMessageId,
    loadRevisions,
    messages,
    productId,
    revisionsByMessageId,
    runAction,
    s,
    timeLocale,
    viewerStaffAvatar,
    viewerUserId,
    isQueue,
  ]);

  const activeTabId = `admin-product-qa-tab-${activeTopicSlug}`;
  const displayError = panelError || error;

  return (
    <div
      ref={panelRef}
      id={PRODUCT_QA_ADMIN_PANEL_ID}
      className={isQueue ? qaStyles.queuePanelRoot : pn.section}
    >
      {!isQueue ? (
        <>
          <div className={catalogStyles.sectionHead}>
            <div>
              <h2 className={catalogStyles.groupHeading}>{s.sectionTitle}</h2>
              <p className={catalogStyles.muted}>
                {s.sectionHint} Ответы staff — только через блок «Переписка с покупателями» и curated publish.
              </p>
            </div>
          </div>

          <form className={qaStyles.topicCreateForm} onSubmit={(e) => void handleCreateTopic(e)}>
            <AdminTextField
              label={s.topicCreateTitle}
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder={s.topicCreatePlaceholder}
              disabled={topicBusy}
            />
            <AdminCompactBtn type="submit" disabled={topicBusy || !newTopicTitle.trim()}>
              {topicBusy ? s.topicCreateBusy : s.topicCreateSend}
            </AdminCompactBtn>
          </form>
        </>
      ) : null}

      <ProductQaTopicTabs
        topics={topics}
        activeTopicSlug={activeTopicSlug}
        onSelect={setActiveTopicSlug}
        idPrefix="admin-product-qa"
        variant="admin"
        tabListLabel={s.topicsLabel}
        formatTabAriaLabel={(t) => s.formatTopicTabAriaLabel(t.title, t.messageCount)}
      />

      {activeTopic && !activeTopic.isDefault && !isQueue ? (
        <div className={qaStyles.topicEditWrap}>
          {!topicEditOpen ? (
            <div className={qaStyles.topicEditToggleRow}>
              <button
                type="button"
                className={qaStyles.topicEditMenuBtn}
                aria-label={s.topicEditToggle}
                aria-expanded={false}
                onClick={() => setTopicEditOpen(true)}
              >
                ⋯
              </button>
              <button
                type="button"
                className={qaStyles.topicEditLinkBtn}
                onClick={() => setTopicEditOpen(true)}
              >
                {s.topicEditToggle}
              </button>
            </div>
          ) : (
            <form className={qaStyles.topicEditForm} onSubmit={(e) => void handlePatchTopic(e)}>
              <AdminTextField
                label={s.topicEditName}
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
                disabled={topicPatchBusy}
              />
              <AdminTextField
                label={s.topicEditSort}
                type="number"
                value={editTopicSort}
                onChange={(e) => setEditTopicSort(e.target.value)}
                disabled={topicPatchBusy}
              />
              <div className={qaStyles.topicEditActions}>
                <AdminCompactBtn type="submit" disabled={topicPatchBusy || !editTopicTitle.trim()}>
                  {topicPatchBusy ? s.topicEditBusy : s.topicEditSave}
                </AdminCompactBtn>
                <AdminCompactBtn
                  type="button"
                  disabled={topicPatchBusy}
                  onClick={() => setTopicEditOpen(false)}
                >
                  {s.topicEditCancel}
                </AdminCompactBtn>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {!isQueue ? (
        <div className={qaStyles.filterRow}>
          <button
            type="button"
            className={
              messageFilter === 'storefront' ? qaStyles.filterBtnActive : qaStyles.filterBtn
            }
            onClick={() => setMessageFilter('storefront')}
          >
            {s.filterStorefront}
          </button>
          <button
            type="button"
            className={messageFilter === 'all' ? qaStyles.filterBtnActive : qaStyles.filterBtn}
            onClick={() => setMessageFilter('all')}
          >
            {s.filterAll}
          </button>
          <button
            type="button"
            className={
              messageFilter === 'pending' ? qaStyles.filterBtnActive : qaStyles.filterBtn
            }
            onClick={() => setMessageFilter('pending')}
          >
            {s.filterPending}
          </button>
        </div>
      ) : null}

      <div id={panelA11y.panelId} role="tabpanel" aria-labelledby={activeTabId} tabIndex={0}>
        <div className={qaStyles.chatShell}>
          <ChatWindow
            variant="embedded"
            embeddedLayout="fill"
            open
            onClose={() => undefined}
            hideCloseButton
            title={isQueue ? '' : s.sectionTitle}
            messages={chatMessages}
            messageEmptyHint={loading ? s.loading : s.empty}
            errorText={displayError}
            composerDisabled
            attachPickerDisabled
            attachmentsEnabled={false}
            hasOlderHistory={hasOlderHistory}
            loadingOlderHistory={loadingOlderHistory}
            onLoadOlderHistory={loadOlderChatMessages}
            composerBanner={
              isQueue ? undefined : (
                <span>Только модерация витрины — новые ответы пишите в переписке ниже.</span>
              )
            }
            loadOlderHistoryLabel={s.loadOlder}
            messageDayLocale={timeLocale}
          />
        </div>
      </div>
    </div>
  );
}

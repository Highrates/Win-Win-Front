'use client';

import { createPortal } from 'react-dom';
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { OrderChatPendingUiAttachment } from '@/lib/orderChat/types';
import { openOrderChatPhotoSwipe } from '@/lib/orderChat/openOrderChatPhotoSwipe';
import styles from './ChatWindow.module.css';

export type ChatDocAttachment = { id: string; filename: string; url?: string };
export type ChatImageAttachment = { id: string; src: string; alt?: string };

export type ChatWindowMessage = {
  id: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  timeLabel: string;
  content?: string;
  documents?: ChatDocAttachment[];
  images?: ChatImageAttachment[];
  /** Сообщение удалено (soft delete на сервере) */
  isDeleted?: boolean;
  /** Показать кнопку удаления (если задан onDeleteMessage) */
  deletable?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  messages?: ChatWindowMessage[];
  /** Вызывается при нажатии «Отправить» (текст из поля) */
  onSend?: (text: string) => void;
  /** Боковая колонка: без портала и без fixed-позиционирования */
  variant?: 'portal' | 'embedded';
  hideCloseButton?: boolean;
  messageEmptyHint?: string;
  inputPlaceholder?: string;
  /** Баннер ошибки над лентой сообщений */
  errorText?: string | null;
  /** Заблокировать ввод и отправку */
  composerDisabled?: boolean;
  /** Блокировка только для поля выбора файла (напр. не блокировать на время loading чата) */
  attachPickerDisabled?: boolean;
  /** Показать кнопку вложений и вызывать при выборе файлов */
  attachmentsEnabled?: boolean;
  /** Подсказка под полем (напр. файлы к отправке) */
  pendingAttachmentsHint?: string | null;
  /** Превью вложений до нажатия «Отправить» */
  pendingOutgoing?: OrderChatPendingUiAttachment[];
  /** Разрешить отправку пустого текста (когда есть вложения «к отправке» у родителя) */
  allowEmptySend?: boolean;
  onAttachFiles?: (files: File[]) => void | Promise<void>;
  /** Убрать файл из очереди перед отправкой (по clientKey из pendingOutgoing) */
  onRemovePendingAttachment?: (clientKey: string) => void;
  onDeleteMessage?: (messageId: string) => void | Promise<void>;
};

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessageBetweenDivider() {
  return (
    <div className={styles.dividerWrap} aria-hidden>
      <div className={styles.dividerLine} />
    </div>
  );
}

function SendDirectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M17.0717 8.42582L6.29151 15.8639C3.73132 17.6275 4.94006 21.6355 8.04765 21.6936L11.6694 21.7614C12.6755 21.7802 13.6146 22.2719 14.2031 23.0881L16.322 26.0261C18.14 28.5471 22.1138 27.2527 22.1138 24.1485L22.086 11.0513C22.0805 8.4748 19.1924 6.9626 17.0717 8.42582Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageAttachments({
  message,
  onOpenChatImage,
}: {
  message: ChatWindowMessage;
  onOpenChatImage: (images: ChatImageAttachment[], index: number) => void;
}) {
  const docs = message.documents ?? [];
  const imgs = message.images ?? [];
  if (docs.length === 0 && imgs.length === 0) return null;

  const singleImage = imgs.length === 1;

  return (
    <div className={styles.messageAttachments}>
      {docs.length > 0 ? (
        <div className={styles.docRow}>
          {docs.map((d) =>
            d.url ? (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={styles.docChip}
                title={d.filename}
              >
                <img className={styles.docChipIcon} src="/icons/doc.svg" alt="" width={16} height={16} />
                <span className={styles.docChipName}>{d.filename}</span>
              </a>
            ) : (
              <div key={d.id} className={styles.docChip} title={d.filename}>
                <img className={styles.docChipIcon} src="/icons/doc.svg" alt="" width={16} height={16} />
                <span className={styles.docChipName}>{d.filename}</span>
              </div>
            ),
          )}
        </div>
      ) : null}
      {imgs.length > 0 ? (
        <div className={singleImage ? styles.imgRowSingle : styles.imgRow}>
          {imgs.map((im, idx) => (
            <button
              key={im.id}
              type="button"
              className={styles.imgThumbBtn}
              onClick={() => onOpenChatImage(imgs, idx)}
              aria-label="Открыть изображение"
            >
              <img
                className={singleImage ? styles.imgThumbSingle : styles.imgThumb}
                src={im.src}
                alt={im.alt ?? ''}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ChatWindow({
  open,
  onClose,
  title,
  messages = [],
  onSend,
  variant = 'portal',
  hideCloseButton = false,
  messageEmptyHint = 'Пока нет сообщений',
  inputPlaceholder = 'Сообщение',
  errorText = null,
  composerDisabled = false,
  attachPickerDisabled,
  attachmentsEnabled = false,
  pendingAttachmentsHint = null,
  pendingOutgoing = [],
  allowEmptySend = false,
  onAttachFiles,
  onRemovePendingAttachment,
  onDeleteMessage,
}: Props) {
  const titleId = useId();
  const fileInputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  /** Два rAF: даём браузеру собрать слой с backdrop-filter до плавного появления */
  const [blendReady, setBlendReady] = useState(false);
  const embedded = variant === 'embedded';

  useEffect(() => {
    if (!open) {
      setBlendReady(false);
      return;
    }
    if (embedded) {
      setBlendReady(true);
      return;
    }
    setBlendReady(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setBlendReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open, embedded]);

  useEffect(() => {
    if (!open || embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, embedded]);

  useEffect(() => {
    if (open) setDraft('');
  }, [open]);

  const syncComposerHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const maxPx = 192;
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  }, []);

  useLayoutEffect(() => {
    syncComposerHeight();
  }, [draft, open, syncComposerHeight]);

  const submit = useCallback(() => {
    if (composerDisabled) return;
    const t = draft.trim();
    if (!t && !allowEmptySend) return;
    onSend?.(t);
    setDraft('');
  }, [draft, onSend, composerDisabled, allowEmptySend]);

  const openChatImage = useCallback((images: ChatImageAttachment[], index: number) => {
    const urls = images.map((i) => i.src.trim()).filter(Boolean);
    if (urls.length === 0) return;
    void openOrderChatPhotoSwipe(urls, index);
  }, []);

  if (!open) return null;

  const attachBlocked =
    attachPickerDisabled !== undefined ? attachPickerDisabled : composerDisabled;

  const panelSection = (
    <section
      className={`${styles.panel} ${embedded ? styles.panelEmbedded : ''}`}
      {...(embedded
        ? ({ role: 'region' as const } as const)
        : ({ role: 'dialog' as const, 'aria-modal': true as const } as const))}
      aria-labelledby={titleId}
    >
      <div className={styles.panelInner}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {!hideCloseButton ? (
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть чат">
                <CloseIcon />
              </button>
            ) : null}
          </div>
          <div className={styles.headerMainRule} aria-hidden />
        </header>

        <div className={styles.messagesScroll}>
          {errorText ? (
            <p className={styles.chatErrorBanner} role="alert">
              {errorText}
            </p>
          ) : null}
          {messages.length === 0 ? (
            <p className={styles.emptyHint}>{messageEmptyHint}</p>
          ) : null}
          {messages.length > 0 ? (
              <div className={styles.messagesList}>
                {messages.map((m, index) => (
                  <Fragment key={m.id}>
                    <article className={styles.message}>
                      <div className={styles.senderInfo}>
                        <div className={styles.senderLeft}>
                          {m.senderAvatarUrl ? (
                            <img className={styles.avatar} src={m.senderAvatarUrl} alt="" width={24} height={24} />
                          ) : (
                            <div className={styles.avatar} aria-hidden />
                          )}
                          <span className={styles.senderName}>{m.senderName}</span>
                        </div>
                        {m.deletable && onDeleteMessage ? (
                          <button
                            type="button"
                            className={styles.messageDeleteBtn}
                            aria-label="Удалить сообщение"
                            onClick={() => void onDeleteMessage(m.id)}
                          >
                            ×
                          </button>
                        ) : null}
                        <span className={styles.messageTime}>{m.timeLabel}</span>
                      </div>
                      {!m.isDeleted &&
                      ((m.documents?.length ?? 0) > 0 || (m.images?.length ?? 0) > 0) ? (
                        <MessageAttachments message={m} onOpenChatImage={openChatImage} />
                      ) : null}
                      {m.isDeleted ? (
                        <p className={styles.messageDeleted}>Сообщение удалено</p>
                      ) : m.content?.trim() ? (
                        <p className={styles.messageBody}>{m.content.trim()}</p>
                      ) : null}
                    </article>
                    {index < messages.length - 1 ? <MessageBetweenDivider /> : null}
                  </Fragment>
                ))}
              </div>
            ) : null}
        </div>

        <footer className={styles.footer}>
          {pendingOutgoing.length > 0 ? (
            <div className={styles.pendingOutgoingStrip} aria-label="Вложения к отправке">
              {pendingOutgoing.map((a) =>
                a.kind === 'IMAGE' && (a.imageSrc || a.uploading) ? (
                  <div key={a.clientKey} className={styles.pendingOutgoingThumbWrap}>
                    {a.imageSrc ? (
                      <img
                        className={styles.pendingOutgoingThumb}
                        src={a.imageSrc}
                        alt=""
                        width={56}
                        height={56}
                      />
                    ) : null}
                    {a.uploading ? (
                      <div className={styles.pendingOutgoingUploadingOverlay} aria-hidden>
                        <span className={styles.pendingOutgoingSpinner} />
                      </div>
                    ) : null}
                    {!a.uploading && onRemovePendingAttachment ? (
                      <button
                        type="button"
                        className={styles.pendingOutgoingRemoveBtn}
                        aria-label="Убрать изображение"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemovePendingAttachment(a.clientKey);
                        }}
                      >
                        <span className={styles.pendingOutgoingRemoveIcon} aria-hidden>
                          ×
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div key={a.clientKey} className={styles.pendingOutgoingDoc} title={a.filename}>
                    <img className={styles.docChipIcon} src="/icons/doc.svg" alt="" width={16} height={16} />
                    <span className={styles.pendingOutgoingDocName}>{a.filename}</span>
                    {a.uploading ? (
                      <span className={styles.pendingOutgoingDocSpinner} aria-label="Загрузка" />
                    ) : null}
                  </div>
                ),
              )}
            </div>
          ) : null}
          {pendingAttachmentsHint ? (
            <p className={styles.footerPendingHint}>{pendingAttachmentsHint}</p>
          ) : null}
          <div className={styles.footerMainTopRule} aria-hidden />
          <div className={styles.footerMain}>
            <input
              id={fileInputId}
              type="file"
              className={styles.fileInputHidden}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              tabIndex={-1}
              disabled={attachBlocked}
              aria-hidden
              onChange={(e) => {
                const input = e.target;
                const files = input.files?.length ? Array.from(input.files) : [];
                if (!files.length || !onAttachFiles) {
                  input.value = '';
                  return;
                }
                /* Микрозадача: не очищать value синхронно в WebKit до передачи списка в обработчик */
                queueMicrotask(() => {
                  void onAttachFiles(files);
                  input.value = '';
                });
              }}
            />
            {attachmentsEnabled ? (
              <label
                htmlFor={attachBlocked ? undefined : fileInputId}
                className={`${styles.attachBtn} ${attachBlocked ? styles.attachBtnBlocked : ''}`}
                aria-label="Прикрепить файл"
              >
                <img
                  src="/icons/attach.svg"
                  alt=""
                  className={styles.attachIcon}
                  width={22}
                  height={22}
                  draggable={false}
                />
              </label>
            ) : null}
            <textarea
              ref={textareaRef}
              rows={1}
              className={styles.input}
              placeholder={inputPlaceholder}
              value={draft}
              disabled={composerDisabled}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              aria-label={inputPlaceholder}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={submit}
              disabled={composerDisabled}
              aria-label="Отправить"
            >
              <SendDirectIcon className={styles.sendIcon} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );

  if (embedded) {
    return (
      <div className={`${styles.embedShell} ${blendReady ? styles.embedShellVisible : ''}`}>{panelSection}</div>
    );
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`${styles.root} ${blendReady ? styles.rootVisible : ''}`}>{panelSection}</div>,
    document.body,
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import buttonStyles from '@/components/Button/Button.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { formatTourDateRange } from '@/lib/chinaTours/formatTourDate';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './TourApplyModal.module.css';

const COMMENT_MAX = 4000;
const COMMENT_COUNTER_FROM = 3500;

function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}–${d.slice(7, 9)}–${d.slice(9, 11)}`;
  }
  if (d.length === 10) {
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}–${d.slice(6, 8)}–${d.slice(8, 10)}`;
  }
  return raw;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ContactInfo = {
  email: string | null;
  phone: string | null;
};

type Props = {
  open: boolean;
  view: 'form' | 'success';
  tourTitle: string;
  startsAt: string;
  endsAt: string;
  seatsTaken: number;
  seatsTotal: number;
  comment: string;
  busy: boolean;
  error: string | null;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function TourApplyModal({
  open,
  view,
  tourTitle,
  startsAt,
  endsAt,
  seatsTaken,
  seatsTotal,
  comment,
  busy,
  error,
  onCommentChange,
  onClose,
  onSubmit,
}: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);
  const [contacts, setContacts] = useState<ContactInfo | null>(null);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  useModalBodyLock(open, () => {
    if (busy) return;
    onClose();
  });
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open || view !== 'form') return;
    let cancelled = false;
    setContactsLoaded(false);
    void fetch('/api/user/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          const j = (await res.json()) as {
            authenticated?: boolean;
            user?: { email?: string | null; phone?: string | null };
          };
          if (!j.authenticated || !j.user) return null;
          return {
            email: j.user.email?.trim() || null,
            phone: j.user.phone?.trim() || null,
          } satisfies ContactInfo;
        } catch {
          return null;
        }
      })
      .then((info) => {
        if (cancelled) return;
        setContacts(info);
        setContactsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setContacts(null);
          setContactsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, view]);

  useEffect(() => {
    if (!open || view !== 'success') return;
    const t = window.setTimeout(() => successTitleRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, view]);

  if (!open) return null;

  const dateLine = formatTourDateRange(startsAt, endsAt);
  const seatsLine = `${seatsTaken}/${seatsTotal} мест`;
  const email = contacts?.email ?? null;
  const phoneDisplay = contacts?.phone ? formatPhoneDisplay(contacts.phone) : null;
  const contactParts = [email, phoneDisplay].filter(Boolean) as string[];

  return (
    <>
      <button
        type="button"
        className={panelModal.backdrop}
        aria-label="Закрыть"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <section
        ref={panelRef}
        className={`${panelModal.panel} ${panelModal.panelMax560}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={view === 'success' ? 'tour-apply-success-title' : 'tour-apply-title'}
        tabIndex={-1}
      >
        <header className={panelModal.header}>
          <button
            type="button"
            className={panelModal.iconBtn}
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="Закрыть"
            disabled={busy}
          >
            <CloseIcon />
          </button>
        </header>

        <div className={panelModal.inner}>
          {view === 'success' ? (
            <>
              <h2
                id="tour-apply-success-title"
                ref={successTitleRef}
                className={`${panelModal.title} ${styles.successTitle}`}
                tabIndex={-1}
              >
                Заявка отправлена
              </h2>
              <p className={styles.successMessage} role="status">
                Менеджер свяжется с вами по контактам из профиля. Статус заявки можно смотреть в разделе «Туры в
                Китай».
              </p>
              <div className={panelModal.actions}>
                <Link
                  href="/account/tours"
                  className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
                  onClick={onClose}
                >
                  Мои заявки
                </Link>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Закрыть
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 id="tour-apply-title" className={panelModal.title}>
                Заявка на «{tourTitle}»
              </h2>
              <p className={styles.meta}>
                {dateLine} · {seatsLine}
              </p>
              <p className={styles.hint}>
                Менеджер свяжется с вами после проверки заявки. Статус можно отслеживать в{' '}
                <Link href="/account/tours" className={styles.hintLink}>
                  личном кабинете
                </Link>
                .
              </p>

              <div className={styles.contacts}>
                <p className={styles.contactsLabel}>Свяжемся по</p>
                {contactsLoaded ? (
                  contactParts.length > 0 ? (
                    <p className={styles.contactsValue}>{contactParts.join(' · ')}</p>
                  ) : (
                    <p className={`${styles.contactsValue} ${styles.contactsEmpty}`}>
                      Email или телефон не указаны в профиле
                    </p>
                  )
                ) : (
                  <p className={`${styles.contactsValue} ${styles.contactsEmpty}`}>Загрузка контактов…</p>
                )}
                <Link href="/account/profile?tab=settings" className={styles.contactsEdit}>
                  Изменить в профиле
                </Link>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="tour-apply-comment">
                  Комментарий
                  <span aria-hidden> (необязательно)</span>
                </label>
                <textarea
                  id="tour-apply-comment"
                  className={styles.textarea}
                  value={comment}
                  onChange={(e) => onCommentChange(e.target.value.slice(0, COMMENT_MAX))}
                  placeholder="Напишите вопрос или пожелание к программе"
                  disabled={busy}
                  maxLength={COMMENT_MAX}
                  aria-describedby={
                    [
                      'tour-apply-hint',
                      comment.length > COMMENT_COUNTER_FROM ? 'tour-apply-charcount' : null,
                      error ? 'tour-apply-error' : null,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                />
                <span id="tour-apply-hint" className={styles.srOnly}>
                  Необязательное поле. Заявку можно отправить без комментария. Максимум {COMMENT_MAX}{' '}
                  символов.
                </span>
                {comment.length > COMMENT_COUNTER_FROM ? (
                  <p
                    id="tour-apply-charcount"
                    className={`${styles.charCount}${
                      comment.length >= COMMENT_MAX ? ` ${styles.charCountWarn}` : ''
                    }`}
                  >
                    {comment.length}/{COMMENT_MAX}
                  </p>
                ) : null}
              </div>

              {error ? (
                <p id="tour-apply-error" className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={panelModal.actions}>
                <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                  Отмена
                </Button>
                <Button type="button" variant="primary" disabled={busy} onClick={onSubmit}>
                  {busy ? 'Отправка…' : 'Отправить'}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

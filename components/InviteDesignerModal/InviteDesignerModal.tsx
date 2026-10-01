'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import btnStyles from '@/components/Button/Button.module.css';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { useInviteDesigner } from '@/hooks/useInviteDesigner';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import profileSheetStyles from '@/app/(site)/(account)/account/profile/page.module.css';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { PartnerReferralLinkTab } from './PartnerReferralLinkTab';
import styles from './InviteDesignerModal.module.css';

export type InviteDesignerModalProps = {
  open: boolean;
  onClose: () => void;
  referralCode: string | null;
  /** После успешной отправки (обновить список активных инвайтов). */
  onSent?: () => void;
};

type InviteTab = 'email' | 'public';

const TAB_ORDER: InviteTab[] = ['email', 'public'];

export function InviteDesignerModal({ open, onClose, referralCode, onSent }: InviteDesignerModalProps) {
  const invite = useInviteDesigner();
  const { reset, resetForAnother, submit, setEmail, setError, setCopied, email, sending, error, done, sentEmail, inviteLink, copied } =
    invite;
  const [tab, setTab] = useState<InviteTab>('email');
  const emailTabId = useId();
  const publicTabId = useId();
  const emailPanelId = useId();
  const publicPanelId = useId();
  const emailTabRef = useRef<HTMLButtonElement>(null);
  const publicTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      reset();
      setTab('email');
    }
  }, [open, reset]);

  useEffect(() => {
    if (done) onSent?.();
  }, [done, onSent]);

  const handleClose = useCallback(() => {
    reset();
    setTab('email');
    onClose();
  }, [reset, onClose]);

  const copyDesignerInviteLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await copyTextToClipboard(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  }, [inviteLink, setCopied]);

  const submitInviteDesigner = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void submit();
    },
    [submit],
  );

  const focusTab = (next: InviteTab) => {
    setTab(next);
    window.setTimeout(() => {
      (next === 'email' ? emailTabRef : publicTabRef).current?.focus();
    }, 0);
  };

  const onTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const idx = TAB_ORDER.indexOf(tab);
    if (e.key === 'Home') {
      focusTab(TAB_ORDER[0]!);
      return;
    }
    if (e.key === 'End') {
      focusTab(TAB_ORDER[TAB_ORDER.length - 1]!);
      return;
    }
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length]!;
    focusTab(next);
  };

  const isFieldValidationError =
    error === 'Введите email' || error === 'Некорректный email';
  const formAlertError = error && !isFieldValidationError ? error : null;

  return (
    <SlideInPanelModal open={open} onClose={handleClose} ariaLabel="Пригласить дизайнера">
      <div className={panelModal.inner}>
        {done ? (
          <>
            <h3 className={panelModal.title}>
              {sentEmail ? `Приглашение отправлено на ${sentEmail}` : 'Приглашение отправлено'}
            </h3>
            <p className={profileSheetStyles.partnerSuccessText}>
              Ссылку с приглашением можно скопировать и отправить напрямую! Срок действия — 14 дней, одно
              использование.
            </p>
            <div className={panelModal.actions}>
              {inviteLink ? (
                <button
                  type="button"
                  className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${copied ? profileSheetStyles.inviteLinkCopyBtnDone : ''}`}
                  onClick={() => {
                    void copyDesignerInviteLink();
                  }}
                >
                  {copied ? 'Скопировано!' : 'Скопировать ссылку с приглашением'}
                </button>
              ) : null}
              <Button type="button" variant="primary" onClick={resetForAnother}>
                Пригласить ещё одного
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Понятно
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className={panelModal.title}>Пригласить дизайнера</h3>
            <div
              className={styles.tabList}
              role="tablist"
              aria-label="Способ приглашения"
              onKeyDown={onTabListKeyDown}
            >
              <button
                ref={emailTabRef}
                type="button"
                id={emailTabId}
                role="tab"
                aria-selected={tab === 'email'}
                aria-controls={emailPanelId}
                tabIndex={tab === 'email' ? 0 : -1}
                className={`${styles.tab} ${tab === 'email' ? styles.tabActive : ''}`}
                onClick={() => setTab('email')}
              >
                По email
              </button>
              <button
                ref={publicTabRef}
                type="button"
                id={publicTabId}
                role="tab"
                aria-selected={tab === 'public'}
                aria-controls={publicPanelId}
                tabIndex={tab === 'public' ? 0 : -1}
                className={`${styles.tab} ${tab === 'public' ? styles.tabActive : ''}`}
                onClick={() => setTab('public')}
              >
                По ссылке
              </button>
            </div>
            {tab === 'email' ? (
              <form
                id={emailPanelId}
                role="tabpanel"
                aria-labelledby={emailTabId}
                onSubmit={submitInviteDesigner}
                noValidate
              >
                <div className={profileSheetStyles.partnerFormField}>
                  <TextField
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    error={isFieldValidationError ? error || undefined : undefined}
                  />
                </div>
                {referralCode ? (
                  <p className={profileSheetStyles.partnerReferralExemptNote}>
                    Приглашённый будет закреплён под вашим номером{' '}
                    <strong>{referralCode}</strong>.
                  </p>
                ) : null}
                {formAlertError ? (
                  <p className={flowStyles.formError} role="alert">
                    {formAlertError}
                  </p>
                ) : null}
                <div className={panelModal.actions}>
                  <Button type="submit" variant="primary" disabled={sending}>
                    {sending ? 'Отправка…' : 'Отправить приглашение'}
                  </Button>
                </div>
              </form>
            ) : (
              <div id={publicPanelId} role="tabpanel" aria-labelledby={publicTabId}>
                <PartnerReferralLinkTab referralCode={referralCode} />
              </div>
            )}
          </>
        )}
      </div>
    </SlideInPanelModal>
  );
}

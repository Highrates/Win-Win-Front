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
import {
  INVITE_TAB_EMAIL_CAPTION,
} from '@/lib/referral/partnerRegistrationLink';
import { PartnerReferralLinkTab } from './PartnerReferralLinkTab';
import styles from './InviteDesignerModal.module.css';

export type InviteDesignerModalProps = {
  open: boolean;
  onClose: () => void;
  referralCode: string | null;
  /** Пока код ещё грузится (команда / профиль) — не показывать ложную ошибку на вкладке «По ссылке». */
  referralCodeLoading?: boolean;
  /** После успешной отправки (обновить список активных инвайтов). */
  onSent?: () => void;
};

type InviteTab = 'email' | 'public';

const TAB_ORDER: InviteTab[] = ['email', 'public'];

export function InviteDesignerModal({
  open,
  onClose,
  referralCode,
  referralCodeLoading = false,
  onSent,
}: InviteDesignerModalProps) {
  const invite = useInviteDesigner();
  const {
    reset,
    resetForAnother,
    submit,
    setEmail,
    clearErrors,
    email,
    sending,
    error,
    fieldError,
    done,
    sentEmail,
    inviteLink,
    emailSent,
    pendingWarning,
    dismissPendingWarning,
    confirmDespiteWarning,
    inviteTtlLabel,
    copied,
    setCopied,
    copyError,
    setCopyError,
  } = invite;
  const [tab, setTab] = useState<InviteTab>('email');
  const emailTabId = useId();
  const publicTabId = useId();
  const emailPanelId = useId();
  const publicPanelId = useId();
  const emailTabRef = useRef<HTMLButtonElement>(null);
  const publicTabRef = useRef<HTMLButtonElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) {
      reset();
      setTab('email');
    }
  }, [open, reset]);

  const onSentRef = useRef(onSent);
  onSentRef.current = onSent;
  const prevDoneRef = useRef(false);
  useEffect(() => {
    if (done && !prevDoneRef.current) {
      onSentRef.current?.();
      window.setTimeout(() => {
        successTitleRef.current?.focus();
      }, 0);
    }
    prevDoneRef.current = done;
  }, [done]);

  const handleClose = useCallback(() => {
    reset();
    setTab('email');
    onClose();
  }, [reset, onClose]);

  const copyDesignerInviteLink = useCallback(async () => {
    if (!inviteLink) return;
    setCopyError(null);
    try {
      await copyTextToClipboard(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
      setCopyError('Не удалось скопировать. Выделите ссылку и скопируйте вручную.');
    }
  }, [inviteLink, setCopied, setCopyError]);

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

  const successBody = emailSent
    ? sentEmail
      ? `Ссылка работает только для ${sentEmail}. Срок — ${inviteTtlLabel}, одно использование.`
      : `Ссылка одноразовая. Срок — ${inviteTtlLabel}.`
    : sentEmail
      ? `Письмо не удалось отправить — передайте ссылку сами. Ссылка работает только для ${sentEmail}. Срок — ${inviteTtlLabel}, одно использование.`
      : `Письмо не удалось отправить — передайте ссылку сами. Срок — ${inviteTtlLabel}, одно использование.`;

  return (
    <SlideInPanelModal open={open} onClose={handleClose} ariaLabel="Пригласить дизайнера-партнёра">
      <div className={panelModal.inner}>
        {done ? (
          <>
            <div role="status">
              <h3 ref={successTitleRef} className={panelModal.title} tabIndex={-1}>
                {emailSent
                  ? sentEmail
                    ? `Приглашение отправлено на ${sentEmail}`
                    : 'Приглашение отправлено'
                  : 'Письмо не отправлено'}
              </h3>
            </div>
            <p className={profileSheetStyles.partnerSuccessText}>{successBody}</p>
            {inviteLink ? (
              <div className={styles.successLinkRow}>
                <p className={styles.linkPreview}>{inviteLink}</p>
                <button
                  type="button"
                  className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${copied ? profileSheetStyles.inviteLinkCopyBtnDone : ''} ${styles.copyBesideLink}`}
                  onClick={() => {
                    void copyDesignerInviteLink();
                  }}
                >
                  {copied ? 'Скопировано!' : 'Копировать ссылку'}
                </button>
                {copyError ? (
                  <p className={flowStyles.formError} role="alert">
                    {copyError}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className={panelModal.actions}>
              <Button type="button" variant="primary" onClick={handleClose}>
                Готово
              </Button>
              <button type="button" className={styles.textLink} onClick={resetForAnother}>
                Пригласить ещё
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={panelModal.title}>Пригласить дизайнера-партнёра</h3>
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
                <p className={styles.tabCaption}>{INVITE_TAB_EMAIL_CAPTION}</p>
                <div className={profileSheetStyles.partnerFormField}>
                  <TextField
                    label="Email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearErrors();
                      if (pendingWarning) dismissPendingWarning();
                    }}
                    error={fieldError || undefined}
                  />
                </div>
                {referralCode ? (
                  <p className={profileSheetStyles.partnerReferralExemptNote}>
                    Приглашённый будет закреплён под вашим реферальным кодом{' '}
                    <strong>{referralCode}</strong>.
                  </p>
                ) : null}
                {pendingWarning ? (
                  <div className={styles.confirmWarning} role="status">
                    <p className={flowStyles.formError}>{pendingWarning}</p>
                    <p className={styles.confirmHint}>Отправить приглашение всё равно?</p>
                    <div className={panelModal.actions}>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={sending}
                        onClick={() => {
                          void confirmDespiteWarning();
                        }}
                      >
                        {sending ? 'Отправка…' : 'Всё равно отправить'}
                      </Button>
                      <button
                        type="button"
                        className={styles.textLink}
                        disabled={sending}
                        onClick={dismissPendingWarning}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : null}
                {error ? (
                  <p className={flowStyles.formError} role="alert">
                    {error}
                  </p>
                ) : null}
                {!pendingWarning ? (
                  <div className={panelModal.actions}>
                    <Button type="submit" variant="primary" disabled={sending}>
                      {sending ? 'Отправка…' : 'Отправить приглашение'}
                    </Button>
                  </div>
                ) : null}
              </form>
            ) : (
              <div id={publicPanelId} role="tabpanel" aria-labelledby={publicTabId}>
                <PartnerReferralLinkTab
                  referralCode={referralCode}
                  referralCodeLoading={referralCodeLoading}
                />
              </div>
            )}
          </>
        )}
      </div>
    </SlideInPanelModal>
  );
}

import { useCallback, useState } from 'react';
import { DESIGNER_INVITE_TTL_LABEL } from '@/lib/designerInvites/inviteLimits';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { validateEmailRequired } from '@/lib/validation';

export function useInviteDesigner() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);
  const [inviteTtlLabel, setInviteTtlLabel] = useState(DESIGNER_INVITE_TTL_LABEL);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldError(null);
    setCopyError(null);
  }, []);

  const reset = useCallback(() => {
    setEmail('');
    clearErrors();
    setDone(false);
    setSentEmail(null);
    setInviteLink(null);
    setEmailSent(true);
    setPendingWarning(null);
    setInviteTtlLabel(DESIGNER_INVITE_TTL_LABEL);
    setCopied(false);
  }, [clearErrors]);

  /** Вернуться к форме после успеха, не закрывая модалку. */
  const resetForAnother = useCallback(() => {
    setEmail('');
    clearErrors();
    setDone(false);
    setSentEmail(null);
    setInviteLink(null);
    setEmailSent(true);
    setPendingWarning(null);
    setInviteTtlLabel(DESIGNER_INVITE_TTL_LABEL);
    setCopied(false);
  }, [clearErrors]);

  const submit = useCallback(
    async (opts?: { force?: boolean }) => {
      clearErrors();
      if (!opts?.force) setPendingWarning(null);
      const em = email.trim().toLowerCase();
      const emailErr = validateEmailRequired(em);
      if (emailErr) {
        setFieldError(emailErr);
        return;
      }
      setSending(true);
      try {
        const res = await fetch('/api/user/designer-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: em, ...(opts?.force ? { force: true } : {}) }),
          credentials: 'same-origin',
        });
        if (!res.ok) {
          setError(await readApiErrorMessage(res));
          return;
        }
        const data = (await res.json()) as {
          ok?: boolean;
          needsConfirmation?: boolean;
          recipientWarning?: string | null;
          inviteLink?: string;
          emailSent?: boolean;
          inviteTtlLabel?: string;
          inviteTtlDays?: number;
        };
        if (data.needsConfirmation && data.ok === false) {
          const warn =
            typeof data.recipientWarning === 'string' && data.recipientWarning.trim()
              ? data.recipientWarning.trim()
              : 'Проверьте получателя перед отправкой.';
          setPendingWarning(warn);
          return;
        }
        setPendingWarning(null);
        setInviteLink(typeof data.inviteLink === 'string' && data.inviteLink.length > 0 ? data.inviteLink : null);
        setEmailSent(data.emailSent !== false);
        if (typeof data.inviteTtlLabel === 'string' && data.inviteTtlLabel.trim()) {
          setInviteTtlLabel(data.inviteTtlLabel.trim());
        } else if (typeof data.inviteTtlDays === 'number' && data.inviteTtlDays > 0) {
          setInviteTtlLabel(`${data.inviteTtlDays} дней`);
        } else {
          setInviteTtlLabel(DESIGNER_INVITE_TTL_LABEL);
        }
        setSentEmail(em);
        setDone(true);
      } catch {
        setError('Не удалось отправить. Повторите позже.');
      } finally {
        setSending(false);
      }
    },
    [clearErrors, email],
  );

  const confirmDespiteWarning = useCallback(() => submit({ force: true }), [submit]);

  const dismissPendingWarning = useCallback(() => {
    setPendingWarning(null);
  }, []);

  return {
    email,
    setEmail,
    sending,
    error,
    setError,
    fieldError,
    setFieldError,
    clearErrors,
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
    reset,
    resetForAnother,
    submit,
  };
}

import { useCallback, useState } from 'react';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { validateEmailRequired } from '@/lib/validation';

export function useInviteDesigner() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setEmail('');
    setError(null);
    setDone(false);
    setSentEmail(null);
    setInviteLink(null);
    setCopied(false);
  }, []);

  /** Вернуться к форме после успеха, не закрывая модалку. */
  const resetForAnother = useCallback(() => {
    setEmail('');
    setError(null);
    setDone(false);
    setSentEmail(null);
    setInviteLink(null);
    setCopied(false);
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    const em = email.trim().toLowerCase();
    const emailErr = validateEmailRequired(em);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/user/designer-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setError(await readApiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { inviteLink?: string };
      setInviteLink(typeof data.inviteLink === 'string' && data.inviteLink.length > 0 ? data.inviteLink : null);
      setSentEmail(em);
      setDone(true);
    } catch {
      setError('Не удалось отправить. Повторите позже.');
    } finally {
      setSending(false);
    }
  }, [email]);

  return {
    email,
    setEmail,
    sending,
    error,
    setError,
    done,
    sentEmail,
    inviteLink,
    copied,
    setCopied,
    reset,
    resetForAnother,
    submit,
  };
}

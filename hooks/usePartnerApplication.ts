import { useCallback, useState } from 'react';
import type { ProfileDto } from '@/app/(account)/account/profile/profileTypes';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';

export function usePartnerApplication(onSuccessProfile: (p: ProfileDto) => void) {
  const [phase, setPhase] = useState<'form' | 'success'>('form');
  const [about, setAbout] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setPhase('form');
    setAbout('');
    setReferralCode('');
    setFile(null);
    setError(null);
  }, []);

  const submit = useCallback(
    async (params: {
      coverLetter: string;
      referralInviteExempt: boolean;
      referralCode: string;
      file: File | null;
    }) => {
      setError(null);
      const text = params.coverLetter.trim();
      if (text.length < 20) {
        setError('Расскажите о себе: не меньше 20 символов');
        return;
      }
      if (!params.referralInviteExempt) {
        const ref = params.referralCode.trim();
        if (ref.length < 3) {
          setError('Укажите реферальный номер приглашающего');
          return;
        }
      }
      if (!params.file) {
        setError('Прикрепите CV в формате PDF');
        return;
      }
      const isPdf =
        params.file.type === 'application/pdf' || params.file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setError('Нужен файл в формате PDF (.pdf)');
        return;
      }

      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.set('coverLetter', text);
        if (!params.referralInviteExempt) {
          fd.set('referralCode', params.referralCode.trim());
        }
        fd.set('file', params.file);
        const res = await fetch('/api/user/partner-application', {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
        });
        if (!res.ok) {
          setError(await readApiErrorMessage(res));
          return;
        }
        const next = (await res.json()) as ProfileDto;
        onSuccessProfile(next);
        setPhase('success');
      } catch {
        setError('Не удалось отправить заявку. Повторите попытку.');
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccessProfile],
  );

  return {
    phase,
    setPhase,
    about,
    setAbout,
    referralCode,
    setReferralCode,
    file,
    setFile,
    error,
    setError,
    submitting,
    reset,
    submit,
  };
}

'use client';

import { useCallback, useEffect } from 'react';
import type { ProfileDto } from '@/app/(account)/account/profile/profileTypes';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { usePartnerApplication } from '@/hooks/usePartnerApplication';
import profileSheetStyles from '@/app/(account)/account/profile/page.module.css';

export type PartnerApplicationModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (profile: ProfileDto) => void;
  referralInviteExempt: boolean;
  storedReferralCode: string | null;
  profileEmail: string;
  /** Prefill ref при открытии (deep link ?prefillRef=) */
  prefillReferralCode?: string;
  onOpenSettings?: () => void;
};

export function PartnerApplicationModal({
  open,
  onClose,
  onSuccess,
  referralInviteExempt,
  storedReferralCode,
  profileEmail,
  prefillReferralCode,
  onOpenSettings,
}: PartnerApplicationModalProps) {
  const partnerApp = usePartnerApplication(onSuccess);
  const { reset, setReferralCode, submit, about, setAbout, referralCode, setFile, file, error, submitting, phase } =
    partnerApp;

  useEffect(() => {
    if (!open) return;
    reset();
    const prefill = (prefillReferralCode ?? '').trim();
    if (prefill) setReferralCode(prefill);
  }, [open, prefillReferralCode, reset, setReferralCode]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const submitPartnerApplication = useCallback(() => {
    void submit({
      coverLetter: about,
      referralInviteExempt,
      referralCode,
      storedReferralCode,
      file,
    });
  }, [about, file, referralCode, referralInviteExempt, storedReferralCode, submit]);

  return (
    <SlideInPanelModal open={open} onClose={handleClose} ariaLabel="Заявка на партнёра Win-Win">
      <div className={panelModal.inner}>
        {phase === 'form' ? (
          <>
            <h3 className={panelModal.title}>Стать партнёром Win-Win</h3>
            <div className={profileSheetStyles.partnerFormField}>
              <label className={profileSheetStyles.fieldLabel} htmlFor="partner-app-about">
                Расскажите о себе
              </label>
              <textarea
                id="partner-app-about"
                className={profileSheetStyles.partnerFormTextarea}
                rows={6}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Образование, проекты..."
              />
            </div>
            {referralInviteExempt ? (
              <p className={profileSheetStyles.partnerReferralExemptNote}>
                Реферальный номер приглашающего для вашего аккаунта не требуется — вы в числе первых партнёров на
                платформе.
              </p>
            ) : (
              <div className={profileSheetStyles.partnerFormField}>
                <TextField
                  label="Реферальный номер приглашающего"
                  id="partner-app-referral"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Введите номер"
                  autoComplete="off"
                  readOnly={Boolean(storedReferralCode?.trim())}
                />
                {storedReferralCode?.trim() ? (
                  <p className={profileSheetStyles.partnerReferralExemptNote}>
                    Спонсор закреплён по приглашению или ссылке регистрации.
                  </p>
                ) : null}
              </div>
            )}
            <div className={profileSheetStyles.partnerFormField}>
              <span className={profileSheetStyles.fieldLabel}>Прикрепите CV (PDF)</span>
              <label className={profileSheetStyles.partnerFilePick}>
                <input
                  type="file"
                  className={profileSheetStyles.partnerFileInput}
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    e.currentTarget.value = '';
                  }}
                />
                <span className={profileSheetStyles.partnerFilePickText}>
                  {file ? file.name : 'Выбрать файл'}
                </span>
              </label>
            </div>
            {error ? (
              <p className={flowStyles.formError} role="alert">
                {error}
              </p>
            ) : null}
            <div className={panelModal.actions}>
              <Button type="button" variant="primary" onClick={submitPartnerApplication} disabled={submitting}>
                {submitting ? 'Отправка…' : 'Подать заявку'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className={panelModal.title}>Заявка отправлена</h3>
            <p className={profileSheetStyles.partnerSuccessText}>
              {profileEmail ? (
                <>
                  Ваша заявка успешно отправлена! О статусе заявки пришлём уведомление на почту:{' '}
                  <strong>{profileEmail}</strong>.
                </>
              ) : (
                <>
                  Ваша заявка успешно отправлена! Укажите email в разделе «Настройки» профиля, чтобы получать
                  уведомления о статусе заявки.
                </>
              )}
            </p>
            <div className={panelModal.actions}>
              {profileEmail ? null : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    onOpenSettings?.();
                    handleClose();
                  }}
                >
                  Открыть настройки
                </Button>
              )}
              <Button type="button" variant="primary" onClick={handleClose}>
                Понятно
              </Button>
            </div>
          </>
        )}
      </div>
    </SlideInPanelModal>
  );
}

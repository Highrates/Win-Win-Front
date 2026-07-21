'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/Button';
import btnStyles from '@/components/Button/Button.module.css';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import {
  buildPartnerRegistrationUrl,
  partnerReferralQrFilename,
} from '@/lib/referral/partnerRegistrationLink';
import profileSheetStyles from '@/app/(site)/(account)/account/profile/page.module.css';
import styles from './InviteDesignerModal.module.css';

type PartnerReferralLinkTabProps = {
  referralCode: string | null;
};

export function PartnerReferralLinkTab({ referralCode }: PartnerReferralLinkTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  const code = referralCode?.trim() ?? '';
  const registrationUrl = useMemo(
    () => (code ? buildPartnerRegistrationUrl(code) : null),
    [code],
  );

  useEffect(() => {
    if (!registrationUrl || !canvasRef.current) return;
    let cancelled = false;
    setQrError(false);
    void QRCode.toCanvas(canvasRef.current, registrationUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => {
      if (!cancelled) setQrError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [registrationUrl]);

  const copyLink = useCallback(async () => {
    if (!registrationUrl) return;
    try {
      await copyTextToClipboard(registrationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  }, [registrationUrl]);

  const downloadQr = useCallback(async () => {
    if (!registrationUrl || !code) return;
    try {
      const dataUrl = await QRCode.toDataURL(registrationUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = partnerReferralQrFilename(code);
      a.click();
    } catch {
      /* ignore */
    }
  }, [registrationUrl, code]);

  if (!code) {
    return (
      <p className={profileSheetStyles.partnerReferralExemptNote} role="status">
        Реферальный номер недоступен. Обратитесь в поддержку.
      </p>
    );
  }

  return (
    <>
      {registrationUrl ? (
        <p className={styles.linkPreview}>{registrationUrl}</p>
      ) : null}
      <div className={styles.qrWrap}>
        {qrError ? (
          <p className={profileSheetStyles.partnerReferralExemptNote} role="alert">
            Не удалось сформировать QR-код. Скопируйте ссылку вручную.
          </p>
        ) : (
          <canvas ref={canvasRef} className={styles.qrCanvas} aria-label="QR-код ссылки регистрации" />
        )}
      </div>
      <div className={styles.publicActions}>
        <button
          type="button"
          className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${copied ? profileSheetStyles.inviteLinkCopyBtnDone : ''}`}
          onClick={() => {
            void copyLink();
          }}
        >
          {copied ? 'Скопировано!' : 'Скопировать ссылку'}
        </button>
        <Button type="button" variant="primary" onClick={() => void downloadQr()} disabled={qrError}>
          Скачать QR (PNG)
        </Button>
      </div>
    </>
  );
}

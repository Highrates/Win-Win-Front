'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProfileDto } from '@/app/(account)/account/profile/profileTypes';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { Button } from '@/components/Button';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { useProfileUploads } from '@/hooks/useProfileUploads';

function ExpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.75 9.25V3.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.25 12.75V18.25H12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66678 4.66665L9.55566 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4441 12.4444L17.333 17.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.25 18.25V12.75H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 3.75V9.25H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.333 17.3333L12.4444 12.4444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66699 4.66665L9.55588 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type ProfileAboutModalProps = {
  open: boolean;
  onClose: () => void;
  initialAboutHtml: string;
  onSuccess: (profile: ProfileDto) => void;
  patchProfile: (patch: Record<string, unknown>) => Promise<ProfileDto>;
};

export function ProfileAboutModal({
  open,
  onClose,
  initialAboutHtml,
  onSuccess,
  patchProfile,
}: ProfileAboutModalProps) {
  const { postMultipart } = useProfileUploads();
  const [fullscreen, setFullscreen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(initialAboutHtml);
    setFullscreen(false);
    setSaveError(null);
  }, [open, initialAboutHtml]);

  const handleClose = useCallback(() => {
    setFullscreen(false);
    setSaveError(null);
    onClose();
  }, [onClose]);

  const onSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const next = await patchProfile({
        aboutHtml: draft.trim() ? draft : null,
      });
      onSuccess(next);
      handleClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Нет сети или сервер недоступен. Повторите попытку.');
    } finally {
      setSaving(false);
    }
  }, [draft, handleClose, onSuccess, patchProfile]);

  return (
    <SlideInPanelModal
      open={open}
      onClose={handleClose}
      ariaLabel="Редактирование блока подробнее о вас"
      backdropAriaLabel="Закрыть редактирование"
      panelClassName={fullscreen ? panelModal.panelFullscreen : undefined}
      headerStart={
        <button
          type="button"
          className={`${panelModal.iconBtn} ${panelModal.fullscreenBtn}`}
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть во весь экран'}
        >
          {fullscreen ? <CollapseIcon /> : <ExpIcon />}
        </button>
      }
    >
      <div className={panelModal.inner}>
        <h3 className={panelModal.title}>Подробнее о вас</h3>
        <RichBlock
          value={draft}
          onChange={setDraft}
          placeholder="Расскажите о себе: опыт, специализация, подход к проектам..."
          uploadMedia={async (file, _type) => {
            const up = await postMultipart('/api/user/profile/rich-media', file, 'rich');
            return up.publicUrl;
          }}
        />
        {saveError ? (
          <p className={flowStyles.formError} role="alert" style={{ marginTop: 8 }}>
            {saveError}
          </p>
        ) : null}
        <div className={panelModal.actions}>
          <Button variant="primary" disabled={saving} onClick={() => void onSave()}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </SlideInPanelModal>
  );
}

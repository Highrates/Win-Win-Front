'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { DesignerProjectDetailApi } from '@/lib/designerProjects/apiTypes';
import { createDesignerProject, updateDesignerProject } from '@/lib/designerProjects/clientApi';
import { DEFAULT_DESIGNER_ROOM_KEY } from '@/lib/designerProjects/defaultRoom';
import { clearPdpProjectDraft, type PdpProjectDraftPayload } from '@/lib/designerProjects/pdpDraft';
import { DEFAULT_DESIGNER_ROOM_ROW, detailToSavePayload, pdpDraftToLineSnapshot } from '@/lib/designerProjects/payload';
import modalStyles from './CreateEditProjectModal.module.css';

const DRAFT_CREATE_KEY = 'winwin-designer-project-create-draft-v1';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  projectId?: string | null;
  initialDetail: DesignerProjectDetailApi | null;
  pendingLineDraft: PdpProjectDraftPayload | null;
  /** После создания проекта передаётся имя для тоста на PDP и т.п. */
  onSaved?: (ctx?: { createdProjectName?: string }) => void;
  onSaveError?: (message: string) => void;
};

export function CreateEditProjectModal({
  open,
  onClose,
  mode,
  projectId,
  initialDetail,
  pendingLineDraft,
  onSaved,
  onSaveError,
}: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialDetail) {
      setName(initialDetail.name);
      setAddress(initialDetail.address ?? '');
      return;
    }
    if (mode === 'create') {
      try {
        const raw = window.localStorage.getItem(DRAFT_CREATE_KEY);
        if (raw) {
          const d = JSON.parse(raw) as { name?: string; address?: string };
          setName(typeof d.name === 'string' ? d.name : '');
          setAddress(typeof d.address === 'string' ? d.address : '');
        } else {
          setName('');
          setAddress('');
        }
      } catch {
        setName('');
        setAddress('');
      }
      return;
    }
    setName('');
    setAddress('');
  }, [open, mode, initialDetail]);

  useEffect(() => {
    if (!open || mode !== 'create') return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_CREATE_KEY, JSON.stringify({ name, address, savedAt: Date.now() }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [open, mode, name, address]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = ph;
      body.style.overflow = pb;
    };
  }, [open, onClose]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await createDesignerProject({
          name: name.trim(),
          address: address.trim() || null,
          rooms: [],
          lines: [],
        });
        window.localStorage.removeItem(DRAFT_CREATE_KEY);
        if (pendingLineDraft) {
          await updateDesignerProject(created.id, {
            name: created.name.trim(),
            address: created.address?.trim() || null,
            rooms: [{ ...DEFAULT_DESIGNER_ROOM_ROW }],
            lines: [
              {
                roomKey: DEFAULT_DESIGNER_ROOM_KEY,
                productId: pendingLineDraft.productId,
                productVariantId: pendingLineDraft.variantId,
                quantity: 1,
                unit: 'шт',
                snapshot: pdpDraftToLineSnapshot(pendingLineDraft),
                sortOrder: 0,
              },
            ],
          });
          clearPdpProjectDraft();
        }
        onSaved?.({ createdProjectName: created.name.trim() });
        onClose();
        return;
      }
      if (mode === 'edit' && projectId && initialDetail) {
        await updateDesignerProject(
          projectId,
          detailToSavePayload({
            ...initialDetail,
            name: name.trim(),
            address: address.trim() || null,
          }),
        );
        window.localStorage.removeItem(DRAFT_CREATE_KEY);
        onSaved?.();
        onClose();
      }
    } catch (e) {
      onSaveError?.(e instanceof Error ? e.message : 'Не удалось сохранить проект');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={modalStyles.overlay} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.panel} role="dialog" aria-modal="true" aria-labelledby="dpm-title">
        <div className={modalStyles.panelHead}>
          <h2 id="dpm-title" className={modalStyles.panelTitle}>
            {mode === 'edit' ? 'Редактировать проект' : 'Новый проект'}
          </h2>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>
        <div className={modalStyles.body}>
          <div className={modalStyles.fields}>
            <TextField label="Название проекта" id="dpm-name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Адрес" id="dpm-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <div className={modalStyles.panelFooter}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button type="button" variant="primary" disabled={!name.trim() || saving} onClick={() => void save()}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

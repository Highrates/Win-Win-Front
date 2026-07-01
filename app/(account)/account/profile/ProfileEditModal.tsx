'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProfileDto } from '@/app/(account)/account/profile/profileTypes';
import {
  CITY_OPTIONS,
  coverFormStateFromProfile,
  DEFAULT_SERVICE_OPTIONS,
  type CoverGrid,
} from '@/app/(account)/account/profile/profileFormUtils';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { Button } from '@/components/Button';
import { CoverGridField } from '@/components/CoverGridField';
import { MultiSelectField } from '@/components/MultiSelectField';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import profileStyles from './page.module.css';

export type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  profile: ProfileDto | null;
  /** Текущий aboutHtml — в этой модалке не редактируется, но сохраняется в PATCH. */
  aboutHtmlForSave: string;
  onSuccess: (profile: ProfileDto) => void;
  patchProfile: (patch: Record<string, unknown>) => Promise<ProfileDto>;
};

export function ProfileEditModal({
  open,
  onClose,
  profile,
  aboutHtmlForSave,
  onSuccess,
  patchProfile,
}: ProfileEditModalProps) {
  const { postMultipart } = useProfileUploads();

  const [serviceOptions, setServiceOptions] = useState<string[]>([...DEFAULT_SERVICE_OPTIONS]);
  const [avatarPreview, setAvatarPreview] = useState('/images/placeholder.svg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [city, setCity] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [coverGrid, setCoverGrid] = useState<CoverGrid>('4:3');
  const [cover43a, setCover43a] = useState<File | null>(null);
  const [cover43b, setCover43b] = useState<File | null>(null);
  const [cover169, setCover169] = useState<File | null>(null);
  const [cover43aPreview, setCover43aPreview] = useState<string | null>(null);
  const [cover43bPreview, setCover43bPreview] = useState<string | null>(null);
  const [cover169Preview, setCover169Preview] = useState<string | null>(null);
  const [remoteCoverA, setRemoteCoverA] = useState<string | null>(null);
  const [remoteCoverB, setRemoteCoverB] = useState<string | null>(null);
  const [remoteCover169, setRemoteCover169] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetFromProfile = useCallback((p: ProfileDto) => {
    setFirstName(p.firstName ?? '');
    setLastName(p.lastName ?? '');
    setCity(p.city ?? '');
    setServices(Array.isArray(p.services) ? p.services.filter((x): x is string => typeof x === 'string') : []);
    setAvatarPreview(p.avatarUrl?.trim() ? p.avatarUrl.trim() : '/images/placeholder.svg');
    setAvatarFile(null);
    setCover43a(null);
    setCover43b(null);
    setCover169(null);
    const covers = coverFormStateFromProfile(p);
    setCoverGrid(covers.coverGrid);
    setRemoteCoverA(covers.remoteCoverA);
    setRemoteCoverB(covers.remoteCoverB);
    setRemoteCover169(covers.remoteCover169);
    setCover43aPreview(covers.cover43aPreview);
    setCover43bPreview(covers.cover43bPreview);
    setCover169Preview(covers.cover169Preview);
    setCityOpen(false);
    setServicesOpen(false);
    setSaveError(null);
  }, []);

  useEffect(() => {
    if (!open || !profile) return;
    resetFromProfile(profile);
  }, [open, profile, resetFromProfile]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/public/site-settings', { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as { designerServiceOptions?: unknown };
        if (!Array.isArray(j.designerServiceOptions) || j.designerServiceOptions.length === 0) return;
        const next = j.designerServiceOptions.filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0,
        );
        if (next.length) setServiceOptions(next);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleClose = useCallback(() => {
    setCityOpen(false);
    setServicesOpen(false);
    setSaveError(null);
    onClose();
  }, [onClose]);

  const onSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      let nextAvatarUrl: string | null = profile?.avatarUrl?.trim() || null;
      if (avatarFile) {
        const up = await postMultipart('/api/user/profile/avatar', avatarFile, 'avatar');
        nextAvatarUrl = up.publicUrl;
      } else if (avatarPreview === '/images/placeholder.svg') {
        nextAvatarUrl = null;
      }

      const uploaded: string[] = [];
      if (coverGrid === '4:3') {
        if (cover43a) {
          const up = await postMultipart('/api/user/profile/cover', cover43a, 'cover');
          uploaded.push(up.publicUrl);
        } else if (remoteCoverA) {
          uploaded.push(remoteCoverA);
        }
        if (cover43b) {
          const up = await postMultipart('/api/user/profile/cover', cover43b, 'cover');
          uploaded.push(up.publicUrl);
        } else if (remoteCoverB) {
          uploaded.push(remoteCoverB);
        }
      } else if (cover169) {
        const up = await postMultipart('/api/user/profile/cover', cover169, 'cover');
        uploaded.push(up.publicUrl);
      } else if (remoteCover169) {
        uploaded.push(remoteCover169);
      }
      const coverImageUrls = uploaded.length ? uploaded : null;

      const next = await patchProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        city: city.trim() || null,
        services: services.length ? services : null,
        aboutHtml: aboutHtmlForSave.trim() ? aboutHtmlForSave : null,
        coverLayout: coverGrid,
        coverImageUrls,
        avatarUrl: nextAvatarUrl,
      });
      onSuccess(next);
      handleClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [
    aboutHtmlForSave,
    avatarFile,
    avatarPreview,
    city,
    cover169,
    cover43a,
    cover43b,
    coverGrid,
    firstName,
    handleClose,
    lastName,
    onSuccess,
    patchProfile,
    postMultipart,
    profile?.avatarUrl,
    remoteCover169,
    remoteCoverA,
    remoteCoverB,
    services,
  ]);

  return (
    <SlideInPanelModal
      open={open}
      onClose={handleClose}
      ariaLabel="Редактирование профиля"
      backdropAriaLabel="Закрыть редактирование профиля"
    >
      <div className={panelModal.inner}>
        <h3 className={panelModal.title}>Редактирование профиля</h3>

        <div className={profileStyles.avatarUploader}>
          <span className={profileStyles.avatarUploaderLabel}>Фото</span>
          <label className={profileStyles.avatarUploaderField}>
            <input
              type="file"
              accept="image/*"
              className={profileStyles.avatarUploaderInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarFile(file);
                setAvatarPreview((prev) => {
                  if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                  return URL.createObjectURL(file);
                });
                e.currentTarget.value = '';
              }}
            />
            <img src={avatarPreview} alt="" width={132} height={132} className={profileStyles.avatarPreview} />
            {avatarPreview !== '/images/placeholder.svg' ? (
              <button
                type="button"
                className={profileStyles.avatarRemove}
                aria-label="Удалить фото"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAvatarFile(null);
                  setAvatarPreview((prev) => {
                    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                    return '/images/placeholder.svg';
                  });
                }}
              >
                ×
              </button>
            ) : null}
          </label>
        </div>

        <div className={profileStyles.nameRow}>
          <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div className={profileStyles.field}>
          <span className={profileStyles.fieldLabel}>Город</span>
          <button
            type="button"
            className={`${textFieldStyles.input} ${profileStyles.selectInput}`}
            onClick={() => setCityOpen((v) => !v)}
            aria-expanded={cityOpen}
          >
            <span className={city ? profileStyles.selectValue : profileStyles.selectPlaceholder}>
              {city || 'Выберите город'}
            </span>
            <img
              src="/icons/arrow.svg"
              alt=""
              width={22}
              height={22}
              aria-hidden
              className={profileStyles.chevron}
              style={{ transform: cityOpen ? 'rotate(-90deg)' : 'rotate(90deg)' }}
            />
          </button>
          {cityOpen ? (
            <div className={profileStyles.options}>
              {CITY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={profileStyles.option}
                  onClick={() => {
                    setCity(item);
                    setCityOpen(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <MultiSelectField
          label="Услуги"
          placeholder="Выберите услуги"
          options={serviceOptions}
          selected={services}
          open={servicesOpen}
          onToggleOpen={() => setServicesOpen((v) => !v)}
          onToggleOption={(service) =>
            setServices((prev) => (prev.includes(service) ? prev.filter((x) => x !== service) : [...prev, service]))
          }
          onRemoveOption={(service) => setServices((prev) => prev.filter((x) => x !== service))}
        />

        <p className={profileStyles.fieldLabel} style={{ marginTop: 8 }}>
          Создайте обложку страницы
        </p>
        <CoverGridField
          showGridLayoutLabel={false}
          coverGrid={coverGrid}
          onCoverGridChange={(g) => {
            setCoverGrid(g);
            if (g === '16:9') {
              setCover43a(null);
              setCover43b(null);
              setRemoteCoverA(null);
              setRemoteCoverB(null);
              setCover43aPreview(null);
              setCover43bPreview(null);
              setCover169Preview(remoteCover169);
            } else {
              setCover169(null);
              setRemoteCover169(null);
              setCover169Preview(null);
              setCover43aPreview(remoteCoverA);
              setCover43bPreview(remoteCoverB);
            }
          }}
          cover43a={cover43a}
          cover43b={cover43b}
          cover169={cover169}
          cover43aPreview={cover43aPreview}
          cover43bPreview={cover43bPreview}
          cover169Preview={cover169Preview}
          onFileChange={{
            onChange43a: (f) => {
              setCover43a(f);
              setCover43aPreview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                return f ? URL.createObjectURL(f) : remoteCoverA;
              });
            },
            onChange43b: (f) => {
              setCover43b(f);
              setCover43bPreview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                return f ? URL.createObjectURL(f) : remoteCoverB;
              });
            },
            onChange169: (f) => {
              setCover169(f);
              setCover169Preview((prev) => {
                if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                return f ? URL.createObjectURL(f) : remoteCover169;
              });
            },
          }}
          onFileRemove={{
            onRemove43a: () => {
              setCover43a(null);
              setRemoteCoverA(null);
              setCover43aPreview(null);
            },
            onRemove43b: () => {
              setCover43b(null);
              setRemoteCoverB(null);
              setCover43bPreview(null);
            },
            onRemove169: () => {
              setCover169(null);
              setRemoteCover169(null);
              setCover169Preview(null);
            },
          }}
        />

        {saveError ? (
          <p className={flowStyles.formError} role="alert">
            {saveError}
          </p>
        ) : null}

        <div className={panelModal.actions}>
          <Button variant="primary" onClick={() => void onSave()} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </SlideInPanelModal>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProfileDto, ProfilePatch } from '@/app/(site)/(account)/account/profile/profileTypes';
import {
  coverFormStateFromProfile,
  DEFAULT_SERVICE_OPTIONS,
} from '@/app/(site)/(account)/account/profile/profileFormUtils';
import { DESIGNER_CITY_DIRECTORY } from '@/lib/directories/designerCities';
import flowStyles from '@/components/auth-forms/RegisterFlow.module.css';
import { Button } from '@/components/Button';
import { MultiSelectField } from '@/components/MultiSelectField';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { TextField } from '@/components/TextField';
import textFieldStyles from '@/components/TextField/TextField.module.css';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import { ProfileCollageUpload } from './ProfileCollageUpload';
import profileStyles from './profileForm.module.css';

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

export type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  profile: ProfileDto | null;
  /** Текущий aboutHtml — в этой модалке не редактируется, но сохраняется в PATCH. */
  aboutHtmlForSave: string;
  onSuccess: (profile: ProfileDto) => void;
  patchProfile: (patch: ProfilePatch) => Promise<ProfileDto>;
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
  const [cityOptions, setCityOptions] = useState<string[]>([...DESIGNER_CITY_DIRECTORY]);
  const [avatarPreview, setAvatarPreview] = useState('/images/placeholder.svg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [city, setCity] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [remotePrimary, setRemotePrimary] = useState<string | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null);
  const [remoteSecondary, setRemoteSecondary] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetFromProfile = useCallback((p: ProfileDto) => {
    setFirstName(p.firstName ?? '');
    setLastName(p.lastName ?? '');
    setCity(p.city ?? '');
    setServices(Array.isArray(p.services) ? p.services.filter((x): x is string => typeof x === 'string') : []);
    const avatar = p.avatarUrl?.trim() ? p.avatarUrl.trim() : '/images/placeholder.svg';
    setAvatarPreview(avatar);
    setAvatarFile(null);
    setPrimaryFile(null);
    setSecondaryFile(null);
    const covers = coverFormStateFromProfile(p, { forceHorizontal: true });
    setRemotePrimary(covers.collagePrimaryUrl);
    setPrimaryPreview(covers.collagePrimaryUrl);
    setRemoteSecondary(covers.collageSecondaryUrl);
    setSecondaryPreview(covers.collageSecondaryUrl ?? (avatar !== '/images/placeholder.svg' ? avatar : null));
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
        const j = (await r.json()) as {
          designerServiceOptions?: unknown;
          designerCityOptions?: unknown;
        };
        if (Array.isArray(j.designerServiceOptions) && j.designerServiceOptions.length > 0) {
          const next = j.designerServiceOptions.filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0,
          );
          if (next.length) setServiceOptions(next);
        }
        if (Array.isArray(j.designerCityOptions) && j.designerCityOptions.length > 0) {
          const next = j.designerCityOptions.filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0,
          );
          if (next.length) setCityOptions(next);
        }
      } catch {
        /* keep directory fallbacks */
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

      let primaryUrl: string | null = remotePrimary;
      if (primaryFile) {
        const up = await postMultipart('/api/user/profile/cover', primaryFile, 'cover');
        primaryUrl = up.publicUrl;
      }

      let secondaryUrl: string | null = remoteSecondary;
      if (secondaryFile) {
        const up = await postMultipart('/api/user/profile/cover', secondaryFile, 'cover');
        secondaryUrl = up.publicUrl;
      }

      /** Второе фото = аватар не пишем в coverImageUrls — на сайте подставится photoUrl. */
      const avatarForSecondary =
        nextAvatarUrl && secondaryUrl && secondaryUrl === nextAvatarUrl ? null : secondaryUrl;
      const uploaded: string[] = [];
      if (primaryUrl) uploaded.push(primaryUrl);
      if (avatarForSecondary && avatarForSecondary !== primaryUrl) uploaded.push(avatarForSecondary);
      const coverImageUrls = uploaded.length ? uploaded : null;

      const patch: ProfilePatch = {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        city: city.trim() || null,
        services: services.length ? services : null,
        aboutHtml: aboutHtmlForSave.trim() ? aboutHtmlForSave : null,
        coverLayout: '16:9',
        coverImageUrls,
        avatarUrl: nextAvatarUrl,
      };
      const next = await patchProfile(patch);
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
    firstName,
    handleClose,
    lastName,
    onSuccess,
    patchProfile,
    postMultipart,
    primaryFile,
    profile?.avatarUrl,
    remotePrimary,
    remoteSecondary,
    secondaryFile,
    services,
  ]);

  const citiesForSelect =
    city && !cityOptions.includes(city) ? [city, ...cityOptions] : cityOptions;

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
                const nextUrl = URL.createObjectURL(file);
                setAvatarPreview((prev) => {
                  if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                  return nextUrl;
                });
                // Если второе фото коллажа = аватар (нет явного cover[1]), обновляем превью.
                if (!remoteSecondary && !secondaryFile) {
                  setSecondaryPreview((prev) => {
                    revokeIfBlob(prev);
                    return nextUrl;
                  });
                }
                e.currentTarget.value = '';
              }}
            />
            <img
              src={avatarPreview}
              alt="Фото профиля"
              width={132}
              height={132}
              className={profileStyles.avatarPreview}
            />
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
              {citiesForSelect.map((item) => (
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
          Коллаж обложки страницы
        </p>
        <ProfileCollageUpload
          primaryFile={primaryFile}
          primaryPreviewUrl={primaryPreview}
          onPrimaryChange={(f) => {
            setPrimaryFile(f);
            setPrimaryPreview((prev) => {
              revokeIfBlob(prev);
              return f ? URL.createObjectURL(f) : remotePrimary;
            });
          }}
          onPrimaryRemove={() => {
            setPrimaryFile(null);
            setRemotePrimary(null);
            setPrimaryPreview((prev) => {
              revokeIfBlob(prev);
              return null;
            });
          }}
          secondaryFile={secondaryFile}
          secondaryPreviewUrl={secondaryPreview}
          onSecondaryChange={(f) => {
            setSecondaryFile(f);
            setSecondaryPreview((prev) => {
              revokeIfBlob(prev);
              return f ? URL.createObjectURL(f) : remoteSecondary;
            });
          }}
          onSecondaryRemove={() => {
            setSecondaryFile(null);
            setRemoteSecondary(null);
            const avatarFallback =
              avatarPreview !== '/images/placeholder.svg' ? avatarPreview : null;
            setSecondaryPreview((prev) => {
              revokeIfBlob(prev);
              return avatarFallback;
            });
          }}
          primaryFallbackHint={
            !primaryPreview && (profile?.designerCasesCount ?? 0) > 0
              ? 'Если не загрузите — на сайте возьмём обложку первого кейса'
              : !primaryPreview
                ? 'Загрузите основное фото или добавьте кейс'
                : null
          }
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

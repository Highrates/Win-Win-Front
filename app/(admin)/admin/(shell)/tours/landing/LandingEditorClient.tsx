'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminChinaTourListItem, AdminChinaToursLanding, AdminChinaToursListResponse } from '../toursAdminTypes';
import styles from '../toursAdmin.module.css';

function parseFeaturedIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

export function LandingEditorClient() {
  const [row, setRow] = useState<AdminChinaToursLanding | null>(null);
  const [published, setPublished] = useState<AdminChinaTourListItem[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [landing, list] = await Promise.all([
          adminBackendJson<AdminChinaToursLanding & { featuredTourIds?: unknown }>(
            'china-tours/admin/landing',
          ),
          adminBackendJson<AdminChinaToursListResponse>('china-tours/admin/tours?limit=100'),
        ]);
        const description =
          'description' in landing && typeof landing.description === 'string'
            ? landing.description
            : '';
        setRow({
          id: landing.id,
          title: landing.title,
          description,
          imageUrl: landing.imageUrl,
          featuredTourIds: parseFeaturedIds(landing.featuredTourIds),
        });
        setFeaturedIds(parseFeaturedIds(landing.featuredTourIds));
        setPublished(list.items.filter((t) => t.isPublished));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка');
      }
    })();
  }, []);

  const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);

  function toggleFeatured(id: string) {
    setFeaturedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const updated = await adminBackendJson<AdminChinaToursLanding & { featuredTourIds?: unknown }>(
        'china-tours/admin/landing',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: row.title,
            description: row.description,
            imageUrl: row.imageUrl,
            featuredTourIds: featuredIds,
          }),
        },
      );
      setRow({
        id: updated.id,
        title: updated.title,
        description: typeof updated.description === 'string' ? updated.description : row.description,
        imageUrl: updated.imageUrl,
        featuredTourIds: parseFeaturedIds(updated.featuredTourIds),
      });
      setFeaturedIds(parseFeaturedIds(updated.featuredTourIds));
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (!row && !error) return <p className={catalogStyles.muted}>Загрузка…</p>;
  if (!row) return <p className={catalogStyles.error}>{error}</p>;

  return (
    <div className={`${catalogStyles.form} ${catalogStyles.formWide}`}>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}
      {ok ? <p className={catalogStyles.muted}>Сохранено</p> : null}

      <AdminTextField
        label="Заголовок"
        value={row.title}
        onChange={(e) => setRow({ ...row, title: e.target.value })}
      />
      <AdminTextArea
        label="Описание"
        value={row.description}
        onChange={(e) => setRow({ ...row, description: e.target.value })}
        rows={6}
      />

      <div>
        <h2 className={catalogStyles.groupHeading}>Фото</h2>
        {row.imageUrl ? <img src={row.imageUrl} alt="" className={styles.coverPreview} /> : null}
        <div className={catalogStyles.coverActions}>
          <AdminCompactBtn type="button" onClick={() => setPickerOpen(true)}>
            Выбрать из медиатеки
          </AdminCompactBtn>
          {row.imageUrl ? (
            <AdminCompactBtn type="button" variant="outline" onClick={() => setRow({ ...row, imageUrl: null })}>
              Убрать
            </AdminCompactBtn>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className={catalogStyles.groupHeading}>Туры на лендинге</h2>
        {published.length === 0 ? (
          <p className={catalogStyles.muted}>Нет опубликованных туров.</p>
        ) : (
          <div className={styles.featuredList}>
            {published.map((t) => {
              const id = `landing-tour-${t.id}`;
              const checked = featuredSet.has(t.id);
              return (
                <label key={t.id} htmlFor={id} className={styles.featuredRow}>
                  <AccountCheckbox
                    id={id}
                    className={catalogStyles.adminCheckboxForm}
                    checked={checked}
                    onChange={() => toggleFeatured(t.id)}
                    aria-label={t.title}
                  />
                  <span className={styles.featuredTitle}>{t.title}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className={catalogStyles.formActions}>
        <AdminCompactBtn type="button" variant="accent" disabled={saving} onClick={() => void save()}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </AdminCompactBtn>
      </div>

      <MediaLibraryPickerModal
        open={pickerOpen}
        mediaFilter="image"
        onClose={() => setPickerOpen(false)}
        onPick={(sel) => {
          setRow({ ...row, imageUrl: sel.url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

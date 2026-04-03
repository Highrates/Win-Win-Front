'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import styles from '../catalog/catalogAdmin.module.css';
import type { BrandAdminDetail } from './adminBrandTypes';

const FORM_ID = 'brand-editor-form';

function parseGallery(raw: unknown): [string, string, string] {
  const list: string[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && x.trim()) list.push(x.trim());
      if (list.length >= 3) break;
    }
  }
  while (list.length < 3) list.push('');
  return [list[0] ?? '', list[1] ?? '', list[2] ?? ''];
}

export function BrandEditorClient({ brandId }: { brandId?: string }) {
  const router = useRouter();
  const isEdit = !!brandId;

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [gallery, setGallery] = useState<[string, string, string]>(['', '', '']);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [picker, setPicker] = useState<
    null | { filter: 'image' | 'video' | 'all'; title?: string }
  >(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);
  const brandTargetRef = useRef<'background' | number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const row = await adminBackendJson<BrandAdminDetail>(`catalog/admin/brands/${brandId}`);
      setName(row.name);
      setSlug(row.slug);
      setIsActive(row.isActive);
      setBackgroundImageUrl(row.backgroundImageUrl ?? '');
      setGallery(parseGallery(row.galleryImageUrls));
      setShortDescription(row.shortDescription ?? '');
      setDescription(row.description ?? '');
      setSeoTitle(row.seoTitle ?? '');
      setSeoDescription(row.seoDescription ?? '');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Не найдено');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        brandTargetRef.current = null;
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? 'Видео для описания' : 'Изображение для описания',
        });
      }),
    [],
  );

  function openBackgroundPicker() {
    richPickResolver.current = null;
    brandTargetRef.current = 'background';
    setSaveMsg(null);
    setPicker({ filter: 'image', title: 'Обложка бренда' });
  }

  function openGalleryPicker(slot: number) {
    richPickResolver.current = null;
    brandTargetRef.current = slot;
    setSaveMsg(null);
    setPicker({ filter: 'image', title: `Галерея — изображение ${slot + 1}` });
  }

  function handlePickerPick(sel: { url: string; id: string }) {
    const resolveRich = richPickResolver.current;
    if (resolveRich) {
      richPickResolver.current = null;
      resolveRich(sel.url);
      setPicker(null);
      return;
    }
    const t = brandTargetRef.current;
    brandTargetRef.current = null;
    if (t === 'background') {
      setBackgroundImageUrl(sel.url);
    } else if (typeof t === 'number') {
      setGallery((prev) => {
        const next: [string, string, string] = [...prev] as [string, string, string];
        next[t] = sel.url;
        return next;
      });
    }
    setPicker(null);
  }

  function handlePickerClose() {
    const resolveRich = richPickResolver.current;
    if (resolveRich) {
      richPickResolver.current = null;
      resolveRich(null);
    }
    brandTargetRef.current = null;
    setPicker(null);
  }

  function clearCoverImage() {
    setBackgroundImageUrl('');
  }

  function clearGallerySlot(slot: number) {
    setGallery((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[slot] = '';
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const galleryUrls = gallery.map((s) => s.trim()).filter(Boolean);
    const body = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      isActive,
      coverImageUrl: null,
      backgroundImageUrl: backgroundImageUrl.trim() || null,
      galleryImageUrls: galleryUrls,
      shortDescription: shortDescription.trim().slice(0, 280) || null,
      description: description.trim() || null,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
    };
    try {
      if (isEdit && brandId) {
        await adminBackendJson<BrandAdminDetail>(`catalog/admin/brands/${brandId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setSaveMsg('Сохранено');
        await revalidatePublicCatalogCache();
        await load();
        router.refresh();
      } else {
        const created = await adminBackendJson<{ id: string }>('catalog/admin/brands', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await revalidatePublicCatalogCache();
        router.push(`/admin/brands/${created.id}`);
        router.refresh();
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && loading) {
    return <p className={styles.muted}>Загрузка…</p>;
  }

  if (isEdit && loadError) {
    return (
      <main>
        <p className={styles.error}>{loadError}</p>
        <Link href="/admin/brands" className={styles.btn}>
          К списку
        </Link>
      </main>
    );
  }

  return (
    <main>
      <MediaLibraryPickerModal
        open={picker !== null}
        title={picker?.title}
        mediaFilter={picker?.filter ?? 'image'}
        onClose={handlePickerClose}
        onPick={handlePickerPick}
      />
      <p className={styles.backRow}>
        <Link href="/admin/brands" className={styles.backLink}>
          ← Бренды
        </Link>
      </p>

      <div className={styles.detailTitleRow}>
        <h1 className={styles.detailTitle}>{isEdit ? name || 'Бренд' : 'Новый бренд'}</h1>
        <button
          type="submit"
          form={FORM_ID}
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={saving || !name.trim()}
        >
          {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
        </button>
      </div>

      {saveMsg ? (
        <p className={saveMsg.startsWith('Сохран') ? styles.muted : styles.error}>{saveMsg}</p>
      ) : null}

      {isEdit ? (
        <p className={styles.muted} style={{ margin: '0 0 16px' }}>
          Slug: {slug}
        </p>
      ) : null}

      <form id={FORM_ID} className={styles.form} onSubmit={submit} style={{ maxWidth: 800 }}>
        <label className={styles.label}>
          Название бренда
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
          />
        </label>

        {!isEdit ? (
          <label className={styles.label}>
            Slug (необязательно)
            <input
              className={styles.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="авто из названия"
            />
          </label>
        ) : (
          <label className={styles.label}>
            Slug
            <input className={styles.input} value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>
        )}

        <label className={styles.label}>
          Короткое описание <span className={styles.muted}>(витрина, макс. 280 символов)</span>
          <textarea
            className={styles.textarea}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value.slice(0, 280))}
            rows={3}
            maxLength={280}
            placeholder="Текст под заголовком на странице бренда"
          />
          <span className={styles.muted} style={{ display: 'block', marginTop: 6 }}>
            {shortDescription.length}/280
          </span>
        </label>

        <div className={styles.label}>
          <div className={styles.labelCheckboxRow}>
            <AccountCheckbox
              id="brand-active"
              className={styles.adminCheckboxForm}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label="Опубликован на витрине"
            />
            <label htmlFor="brand-active">Опубликован на витрине</label>
          </div>
        </div>

        <div className={styles.section} style={{ marginTop: 8 }}>
          <h2 className={styles.sectionTitle}>Обложка</h2>
          <div className={styles.fileRow}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openBackgroundPicker}>
              Выбрать из медиатеки
            </button>
            {backgroundImageUrl ? (
              <button type="button" className={styles.btn} onClick={clearCoverImage}>
                Убрать обложку
              </button>
            ) : null}
          </div>
          {backgroundImageUrl ? (
            <div className={styles.bgPreview} style={{ marginTop: 10 }}>
              <img src={backgroundImageUrl} alt="" />
            </div>
          ) : null}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Дополнительные изображения (max 3)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2].map((slot) => (
              <div key={slot} className={styles.label}>
                <span>Изображение {slot + 1}</span>
                <div className={styles.fileRow}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => openGalleryPicker(slot)}
                  >
                    Выбрать из медиатеки
                  </button>
                  {gallery[slot] ? (
                    <button type="button" className={styles.btn} onClick={() => clearGallerySlot(slot)}>
                      Убрать
                    </button>
                  ) : null}
                </div>
                {gallery[slot] ? (
                  <div className={styles.bgPreview} style={{ marginTop: 8, maxWidth: 280 }}>
                    <img src={gallery[slot]} alt="" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Подробнее о бренде</h2>
          <RichBlock
            value={description}
            onChange={setDescription}
            placeholder="Текст для блока «Подробнее о бренде»…"
            pickMediaFromLibrary={pickMediaFromLibrary}
          />
        </div>

        <label className={styles.label}>
          SEO title
          <input className={styles.input} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label className={styles.label}>
          SEO description
          <textarea
            className={styles.textarea}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={4}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <Link href="/admin/brands" className={styles.btn}>
            Отмена
          </Link>
        </div>
      </form>
    </main>
  );
}

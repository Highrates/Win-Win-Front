'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import {
  adminBackendJson,
  adminUploadRichMedia,
} from '@/lib/adminBackendFetch';
import { adminBlogPostEditorStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import type { AdminBlogCategoryRow, AdminBlogPostDetail } from './blogAdminTypes';
import { dateInputToIso, dateToDateInputValue, isoOrNowToDateInputValue } from './blogDateInput';
import blogStyles from './blogAdmin.module.css';

type Props = { postId?: string };

export function BlogPostEditorClient({ postId }: Props) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminBlogPostEditorStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const isEdit = !!postId;

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminBlogCategoryRow[]>([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateYmd, setDateYmd] = useState(() => dateToDateInputValue(new Date()));
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('<p></p>');
  const [isPublished, setIsPublished] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<null | { filter: 'image' | 'video'; title?: string }>(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await adminBackendJson<AdminBlogCategoryRow[]>('blog/admin/categories');
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const row = await adminBackendJson<AdminBlogPostDetail>(`blog/admin/posts/${postId}`);
      setTitle(row.title);
      setSlug(row.slug);
      setCategoryId(row.categoryId ?? '');
      setDateYmd(isoOrNowToDateInputValue(row.publishedAt ?? row.createdAt));
      setExcerpt(row.excerpt ?? '');
      setBody(row.body || '<p></p>');
      setIsPublished(row.isPublished);
      setCoverUrl(row.coverUrl ?? '');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : s.notFound);
    } finally {
      setLoading(false);
    }
  }, [postId, s]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const pickMediaFromLibrary = useCallback(
    (kind: 'image' | 'video') =>
      new Promise<string | null>((resolve) => {
        richPickResolver.current = resolve;
        setPicker({
          filter: kind === 'video' ? 'video' : 'image',
          title: kind === 'video' ? s.pickerVideo : s.pickerImage,
        });
      }),
    [s],
  );

  function handlePickerPick(sel: { url: string; id: string }) {
    const resolveRich = richPickResolver.current;
    if (resolveRich) {
      richPickResolver.current = null;
      resolveRich(sel.url);
      setPicker(null);
      return;
    }
    setCoverUrl(sel.url);
    setPicker(null);
  }

  function handlePickerClose() {
    richPickResolver.current?.(null);
    richPickResolver.current = null;
    setPicker(null);
  }

  async function save() {
    const titleTrim = title.trim();
    if (!titleTrim) {
      setSaveMsg(s.titleRequired);
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const publishedAtIso = dateInputToIso(dateYmd);
      if (isEdit && postId) {
        await adminBackendJson(`blog/admin/posts/${postId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: titleTrim,
            ...(slug.trim() ? { slug: slug.trim() } : {}),
            categoryId: categoryId || null,
            excerpt: excerpt.trim() || null,
            body,
            isPublished,
            publishedAt: publishedAtIso,
            coverUrl: coverUrl.trim() || null,
          }),
        });
        setSaveMsg(s.saved);
      } else {
        const created = await adminBackendJson<AdminBlogPostDetail>('blog/admin/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: titleTrim,
            ...(slug.trim() ? { slug: slug.trim() } : {}),
            categoryId: categoryId || null,
            excerpt: excerpt.trim() || null,
            body,
            isPublished,
            publishedAt: publishedAtIso,
            coverUrl: coverUrl.trim() || null,
          }),
        });
        router.replace(`/admin/blog/${created.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={catalogStyles.muted}>{c.loading}</p>;
  }
  if (loadError) {
    return (
      <p className={catalogStyles.error}>
        {loadError}{' '}
        <Link href="/admin/blog" className={catalogStyles.backLink}>
          {s.toList}
        </Link>
      </p>
    );
  }

  return (
    <>
      <div className={catalogStyles.backRow}>
        <Link href="/admin/blog" className={catalogStyles.backLink}>
          {s.backList}
        </Link>
      </div>

      <div className={blogStyles.editorField}>
        <label className={blogStyles.editorLabel} htmlFor="blog-title">
          {s.titleLabel}
        </label>
        <input
          id="blog-title"
          className={blogStyles.editorInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={blogStyles.editorField}>
        <label className={blogStyles.editorLabel} htmlFor="blog-category">
          {s.category}
        </label>
        <select
          id="blog-category"
          className={blogStyles.editorSelect}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">{s.noCategory}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className={blogStyles.editorField}>
        <label className={blogStyles.editorLabel} htmlFor="blog-date">
          {s.dateLabel}
        </label>
        <input
          id="blog-date"
          type="date"
          className={blogStyles.editorInput}
          style={{ maxWidth: 280 }}
          value={dateYmd}
          onChange={(e) => setDateYmd(e.target.value)}
        />
      </div>

      <div className={blogStyles.editorField}>
        <label className={blogStyles.editorLabel} htmlFor="blog-excerpt">
          {s.excerpt}
        </label>
        <textarea
          id="blog-excerpt"
          className={blogStyles.editorTextarea}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={4}
        />
      </div>

      <div className={blogStyles.editorField}>
        <span className={blogStyles.editorLabel}>{s.cover}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', maxWidth: 720 }}>
          {coverUrl ? <img src={coverUrl} alt="" className={blogStyles.coverPreview} /> : null}
          <button
            type="button"
            className={catalogStyles.btn}
            onClick={() => {
              richPickResolver.current = null;
              setPicker({ filter: 'image', title: s.coverPicker });
            }}
          >
            {coverUrl ? s.coverChange : s.coverPick}
          </button>
          {coverUrl ? (
            <button type="button" className={catalogStyles.btn} onClick={() => setCoverUrl('')}>
              {s.removeCover}
            </button>
          ) : null}
        </div>
      </div>

      <div className={blogStyles.editorField}>
        <label className={blogStyles.editorLabel} htmlFor="blog-slug">
          {s.slugOptional}
        </label>
        <input
          id="blog-slug"
          className={blogStyles.editorInput}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={s.slugPh}
        />
      </div>

      <div className={blogStyles.editorField}>
        <div className={catalogStyles.labelCheckboxRow}>
          <AccountCheckbox
            id="blog-published"
            className={catalogStyles.adminCheckboxForm}
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            aria-label={s.publishedAria}
          />
          <label htmlFor="blog-published">{s.publishedLabel}</label>
        </div>
      </div>

      <div className={blogStyles.editorField}>
        <span className={blogStyles.editorLabel}>{s.body}</span>
        <RichBlock
          value={body}
          onChange={setBody}
          uploadMedia={(file, type) => adminUploadRichMedia(file, type)}
          pickMediaFromLibrary={pickMediaFromLibrary}
        />
      </div>

      {saveMsg ? (
        <p className={saveMsg === s.saved ? catalogStyles.muted : catalogStyles.error}>{saveMsg}</p>
      ) : null}

      <div className={blogStyles.editorActions}>
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? s.saveBusy : s.save}
        </button>
      </div>

      <MediaLibraryPickerModal
        open={picker !== null}
        title={picker?.title}
        mediaFilter={picker?.filter ?? 'image'}
        onClose={handlePickerClose}
        onPick={handlePickerPick}
      />
    </>
  );
}

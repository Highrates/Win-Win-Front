'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountConfirmDialog } from '@/components/AccountConfirmDialog/AccountConfirmDialog';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { Button } from '@/components/Button';
import { useAccountUnsavedChangesGuard } from '@/hooks/useAccountUnsavedChangesGuard';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { formatBudgetDigitsGrouped, parseBudgetDigits } from '@/lib/formatBudgetRub';
import {
  coverUrlsFromUnknown,
  parseApiCaseRow,
  stringArrayFromUnknown,
} from '@/lib/account/caseApiSchema';
import { CaseBasicFields } from './CaseBasicFields';
import { CaseCoverUpload } from './CaseCoverUpload';
import { CaseProductsField, type CaseProductPick } from './CaseProductsField';
import { CaseRichDescription } from './CaseRichDescription';
import { CaseRoomTypeSelect } from './CaseRoomTypeSelect';
import styles from '../page.module.css';

/** Канонический layout новых кейсов (вертикаль 9:16). */
export const CASE_COVER_LAYOUT = '9:16' as const;

type CoverLayoutValue = '4:3' | '16:9' | '9:16';

type Mode = 'create' | 'edit';

type Props = {
  mode: Mode;
  /** Для edit — id кейса. */
  caseId?: string;
};

type FormSnapshot = {
  title: string;
  shortDescription: string;
  location: string;
  year: string;
  budgetDigits: string;
  richContent: string;
  selectedRooms: string;
  productIds: string;
  remoteCoverUrl: string;
  coverLayout: string;
  hasLocalCover: boolean;
};

function normalizeCoverLayout(raw: string | null | undefined): CoverLayoutValue {
  if (raw === '4:3' || raw === '16:9' || raw === '9:16') return raw;
  return CASE_COVER_LAYOUT;
}

function snapshotOf(input: {
  title: string;
  shortDescription: string;
  location: string;
  year: string;
  budgetDigits: string;
  richContent: string;
  selectedRooms: string[];
  pickedProducts: CaseProductPick[];
  remoteCoverUrl: string | null;
  coverLayout: CoverLayoutValue;
  coverFile: File | null;
}): FormSnapshot {
  return {
    title: input.title,
    shortDescription: input.shortDescription,
    location: input.location,
    year: input.year,
    budgetDigits: input.budgetDigits,
    richContent: input.richContent,
    selectedRooms: [...input.selectedRooms].sort().join('\0'),
    productIds: input.pickedProducts.map((p) => p.id).join('\0'),
    remoteCoverUrl: input.remoteCoverUrl ?? '',
    coverLayout: input.coverLayout,
    hasLocalCover: Boolean(input.coverFile),
  };
}

function snapshotsEqual(a: FormSnapshot, b: FormSnapshot): boolean {
  return (
    a.title === b.title &&
    a.shortDescription === b.shortDescription &&
    a.location === b.location &&
    a.year === b.year &&
    a.budgetDigits === b.budgetDigits &&
    a.richContent === b.richContent &&
    a.selectedRooms === b.selectedRooms &&
    a.productIds === b.productIds &&
    a.remoteCoverUrl === b.remoteCoverUrl &&
    a.coverLayout === b.coverLayout &&
    a.hasLocalCover === b.hasLocalCover
  );
}

function CaseFormSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Загрузка кейса">
      <div className={styles.headerRow}>
        <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: 180, height: 18 }} />
        <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: 110, height: 40, borderRadius: 8 }} />
      </div>
      <div className={styles.form}>
        <div className={styles.skeletonField}>
          <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: '28%', height: 12 }} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonShimmer}`} style={{ height: 44 }} />
        </div>
        <div className={styles.skeletonField}>
          <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: '36%', height: 12 }} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonShimmer}`} style={{ height: 88 }} />
        </div>
        <div className={styles.skeletonField}>
          <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: '22%', height: 12 }} />
          <div className={`${styles.skeletonCover} ${styles.skeletonShimmer}`} />
        </div>
        <div className={styles.skeletonField}>
          <div className={`${styles.skeletonLine} ${styles.skeletonShimmer}`} style={{ width: '30%', height: 12 }} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonShimmer}`} style={{ height: 160 }} />
        </div>
      </div>
    </div>
  );
}

export function CaseFormEditor({ mode, caseId: caseIdProp }: Props) {
  const router = useRouter();
  const { postMultipart } = useProfileUploads();

  const [caseId, setCaseId] = useState(caseIdProp?.trim() ?? '');
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('');
  const [budgetDigits, setBudgetDigits] = useState('');
  const [pickedProducts, setPickedProducts] = useState<CaseProductPick[]>([]);
  const [richContent, setRichContent] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [roomTypeOptions, setRoomTypeOptions] = useState<string[]>([]);

  const [coverLayout, setCoverLayout] = useState<CoverLayoutValue>(CASE_COVER_LAYOUT);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [remoteCoverUrl, setRemoteCoverUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const leaveResolveRef = useRef<((ok: boolean) => void) | null>(null);

  const baselineRef = useRef<FormSnapshot | null>(mode === 'create' ? snapshotOf({
    title: '',
    shortDescription: '',
    location: '',
    year: '',
    budgetDigits: '',
    richContent: '',
    selectedRooms: [],
    pickedProducts: [],
    remoteCoverUrl: null,
    coverLayout: CASE_COVER_LAYOUT,
    coverFile: null,
  }) : null);

  const coverPreviewRef = useRef(coverPreview);
  coverPreviewRef.current = coverPreview;

  const currentSnapshot = useMemo(
    () =>
      snapshotOf({
        title,
        shortDescription,
        location,
        year,
        budgetDigits,
        richContent,
        selectedRooms,
        pickedProducts,
        remoteCoverUrl,
        coverLayout,
        coverFile,
      }),
    [
      title,
      shortDescription,
      location,
      year,
      budgetDigits,
      richContent,
      selectedRooms,
      pickedProducts,
      remoteCoverUrl,
      coverLayout,
      coverFile,
    ],
  );

  const dirty = Boolean(
    baselineRef.current && !snapshotsEqual(currentSnapshot, baselineRef.current),
  );

  const confirmLeave = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      leaveResolveRef.current = resolve;
      setLeaveConfirmOpen(true);
    });
  }, []);

  useAccountUnsavedChangesGuard(dirty && !saving && !deleting, confirmLeave);

  useEffect(() => {
    return () => {
      const p = coverPreviewRef.current;
      if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/public/site-settings', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { caseRoomTypeOptions?: unknown };
        const list = Array.isArray(j.caseRoomTypeOptions)
          ? j.caseRoomTypeOptions.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          : [];
        if (!cancelled) setRoomTypeOptions(list);
      } catch {
        if (!cancelled) setRoomTypeOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit') return;
    const id = caseIdProp?.trim() || '';
    if (!id) {
      setLoadError('Некорректный ID кейса');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setCaseId(id);
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/user/cases/${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setLoadError(await readApiErrorMessage(res));
          return;
        }
        const dto = parseApiCaseRow(await res.json());
        if (cancelled) return;
        if (!dto) {
          setLoadError('Некорректный ответ сервера');
          return;
        }
        const nextTitle = dto.title ?? '';
        const nextShort = dto.shortDescription ?? '';
        const nextLocation = dto.location ?? '';
        const nextYear = dto.year ? String(dto.year) : '';
        const nextBudget = parseBudgetDigits(dto.budget ?? '');
        const nextRich = dto.descriptionHtml ?? '';
        const nextRooms = stringArrayFromUnknown(dto.roomTypes, 64);
        const nextLayout = normalizeCoverLayout(dto.coverLayout);
        const coverMax = nextLayout === '4:3' ? 2 : 1;
        const urls = coverUrlsFromUnknown(dto.coverImageUrls, coverMax);
        const u0 = urls[0] ?? null;
        const pids = stringArrayFromUnknown(dto.productIds, 80);
        let nextProducts: CaseProductPick[] = pids.map((pid) => ({ id: pid, slug: '', name: 'Товар' }));
        if (pids.length) {
          try {
            const resolveRes = await fetch('/api/public/catalog/products/resolve-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ ids: pids }),
            });
            if (resolveRes.ok && !cancelled) {
              const j = (await resolveRes.json()) as { items?: { id: string; slug: string; name: string }[] };
              const list = Array.isArray(j.items) ? j.items : [];
              const byId = new Map(list.map((x) => [x.id, x]));
              nextProducts = pids.map((pid) => byId.get(pid) ?? { id: pid, slug: '', name: 'Товар' });
            }
          } catch {
            /* плейсхолдеры */
          }
        }
        if (cancelled) return;
        setTitle(nextTitle);
        setShortDescription(nextShort);
        setLocation(nextLocation);
        setYear(nextYear);
        setBudgetDigits(nextBudget);
        setRichContent(nextRich);
        setSelectedRooms(nextRooms);
        setCoverLayout(nextLayout);
        setRemoteCoverUrl(u0);
        setCoverPreview(u0);
        setCoverFile(null);
        setPickedProducts(nextProducts);
        baselineRef.current = snapshotOf({
          title: nextTitle,
          shortDescription: nextShort,
          location: nextLocation,
          year: nextYear,
          budgetDigits: nextBudget,
          richContent: nextRich,
          selectedRooms: nextRooms,
          pickedProducts: nextProducts,
          remoteCoverUrl: u0,
          coverLayout: nextLayout,
          coverFile: null,
        });
      } catch {
        if (!cancelled) setLoadError('Сеть или сервер недоступны');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, caseIdProp, reloadToken]);

  const toggleRoom = useCallback((room: string) => {
    setSelectedRooms((prev) => (prev.includes(room) ? prev.filter((x) => x !== room) : [...prev, room]));
  }, []);

  const removeRoom = useCallback((room: string) => {
    setSelectedRooms((prev) => prev.filter((x) => x !== room));
  }, []);

  const onCoverChange = useCallback(
    (file: File | null) => {
      setCoverFile(file);
      setCoverPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : remoteCoverUrl;
      });
    },
    [remoteCoverUrl],
  );

  const onCoverRemove = useCallback(() => {
    setCoverFile(null);
    setRemoteCoverUrl(null);
    setCoverPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const normalizedYear = useMemo(() => {
    const y = year.trim();
    if (!y) return null;
    const n = Number(y);
    if (!Number.isFinite(n)) return null;
    return n;
  }, [year]);

  /** На сохранение: 4:3 мигрируем в канон 9:16 (один кадр). */
  const layoutToSave: CoverLayoutValue =
    coverLayout === '4:3' ? CASE_COVER_LAYOUT : coverLayout === '16:9' ? '16:9' : CASE_COVER_LAYOUT;

  const onSave = async () => {
    setSaveError(null);
    const t = title.trim();
    if (!t) {
      setSaveError('Введите название кейса');
      return;
    }
    if (mode === 'edit' && !caseId) return;
    setSaving(true);
    try {
      const uploaded: string[] = [];
      if (coverFile) {
        uploaded.push((await postMultipart('/api/user/cases/media', coverFile, 'cover')).publicUrl);
      } else if (remoteCoverUrl) {
        uploaded.push(remoteCoverUrl);
      }

      const body = {
        title: t,
        shortDescription: shortDescription.trim() || null,
        location: location.trim() || null,
        year: normalizedYear,
        budget: budgetDigits.trim() ? formatBudgetDigitsGrouped(budgetDigits) : null,
        descriptionHtml: richContent.trim() || null,
        roomTypes: selectedRooms,
        coverLayout: layoutToSave,
        coverImageUrls: uploaded.length ? uploaded : null,
        productIds: pickedProducts.length ? pickedProducts.map((p) => p.id) : null,
      };

      const res =
        mode === 'create'
          ? await fetch('/api/user/cases', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(body),
            })
          : await fetch(`/api/user/cases/${encodeURIComponent(caseId)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(body),
            });

      if (!res.ok) {
        setSaveError(await readApiErrorMessage(res));
        return;
      }
      baselineRef.current = snapshotOf({
        title,
        shortDescription,
        location,
        year,
        budgetDigits,
        richContent,
        selectedRooms,
        pickedProducts,
        remoteCoverUrl: uploaded[0] ?? null,
        coverLayout: layoutToSave,
        coverFile: null,
      });
      setCoverLayout(layoutToSave);
      setCoverFile(null);
      if (uploaded[0]) {
        setRemoteCoverUrl(uploaded[0]);
        setCoverPreview(uploaded[0]);
      }
      router.push('/account/cases');
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!caseId) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/user/cases/${encodeURIComponent(caseId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setDeleteError(await readApiErrorMessage(res));
        return;
      }
      baselineRef.current = currentSnapshot;
      setDeleteConfirmOpen(false);
      router.push('/account/cases');
      router.refresh();
    } catch {
      setDeleteError('Сеть или сервер недоступны');
    } finally {
      setDeleting(false);
    }
  };

  const finishLeaveConfirm = (ok: boolean) => {
    setLeaveConfirmOpen(false);
    leaveResolveRef.current?.(ok);
    leaveResolveRef.current = null;
  };

  if (mode === 'edit' && loading) {
    return <CaseFormSkeleton />;
  }
  if (mode === 'edit' && loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <Link href="/account/cases" className={styles.backLink}>
            <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.backArrow} aria-hidden />
            <span className={styles.backText}>Вернуться к кейсам</span>
          </Link>
        </div>
        <AccountErrorState message={loadError} onRetry={() => setReloadToken((n) => n + 1)} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Link href="/account/cases" className={styles.backLink}>
          <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.backArrow} aria-hidden />
          <span className={styles.backText}>Вернуться к кейсам</span>
        </Link>
        <div className={styles.headerActions}>
          {mode === 'edit' ? (
            <Button
              type="button"
              variant="secondary"
              className={styles.deleteCaseBtn}
              disabled={deleting || saving}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {deleting ? 'Удаление…' : 'Удалить'}
            </Button>
          ) : null}
          <Button variant="primary" disabled={saving || deleting} onClick={() => void onSave()}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div className={styles.form}>
        <CaseBasicFields
          title={title}
          onTitleChange={setTitle}
          shortDescription={shortDescription}
          onShortDescriptionChange={setShortDescription}
          location={location}
          onLocationChange={setLocation}
          year={year}
          onYearChange={setYear}
          budgetDigits={budgetDigits}
          onBudgetDigitsChange={setBudgetDigits}
        />

        <CaseRoomTypeSelect
          roomTypes={roomTypeOptions}
          selectedRooms={selectedRooms}
          roomsOpen={roomsOpen}
          onToggleOpen={() => setRoomsOpen((prev) => !prev)}
          onToggleRoom={toggleRoom}
          onRemoveRoom={removeRoom}
        />

        <CaseCoverUpload
          file={coverFile}
          previewUrl={coverPreview}
          onChange={onCoverChange}
          onRemove={onCoverRemove}
        />

        <CaseProductsField value={pickedProducts} onChange={setPickedProducts} />

        <CaseRichDescription
          value={richContent}
          onChange={setRichContent}
          uploadMedia={async (file) => (await postMultipart('/api/user/cases/media', file, 'rich')).publicUrl}
        />

        {saveError ? (
          <p style={{ color: 'var(--color-red)', fontSize: 'var(--text-caption)' }} role="alert">
            {saveError}
          </p>
        ) : null}
        {deleteError ? (
          <p style={{ color: 'var(--color-red)', fontSize: 'var(--text-caption)' }} role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>

      <AccountConfirmDialog
        open={deleteConfirmOpen}
        title="Удалить кейс?"
        confirmLabel={deleting ? 'Удаление…' : 'Удалить'}
        cancelLabel="Отмена"
        danger
        busy={deleting}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void onDelete()}
      >
        <p>Кейс будет удалён без возможности восстановления.</p>
      </AccountConfirmDialog>

      <AccountConfirmDialog
        open={leaveConfirmOpen}
        title="Уйти без сохранения?"
        confirmLabel="Уйти"
        cancelLabel="Остаться"
        onClose={() => finishLeaveConfirm(false)}
        onConfirm={() => finishLeaveConfirm(true)}
      >
        <p>Несохранённые изменения пропадут.</p>
      </AccountConfirmDialog>
    </div>
  );
}

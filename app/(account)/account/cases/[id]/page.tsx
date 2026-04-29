'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { formatBudgetDigitsGrouped, parseBudgetDigits } from '@/lib/formatBudgetRub';
import { CaseBasicFields } from '../new/components/CaseBasicFields';
import { CaseCoverGridPicker } from '../new/components/CaseCoverGridPicker';
import { CaseProductsField, type CaseProductPick } from '../new/components/CaseProductsField';
import { CaseRichDescription } from '../new/components/CaseRichDescription';
import { CaseRoomTypeSelect } from '../new/components/CaseRoomTypeSelect';
import styles from '../new/page.module.css';

type CaseDto = {
  id: string;
  title: string;
  shortDescription: string | null;
  location: string | null;
  year: number | null;
  budget: string | null;
  descriptionHtml: string | null;
  coverLayout: '4:3' | '16:9' | null;
  coverImageUrls: unknown;
  roomTypes: unknown;
  productIds: unknown;
};

function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function parseProductIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, 80);
}

export default function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { postMultipart } = useProfileUploads();

  const [caseId, setCaseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const [coverGrid, setCoverGrid] = useState<'4:3' | '16:9'>('4:3');
  const [cover43a, setCover43a] = useState<File | null>(null);
  const [cover43b, setCover43b] = useState<File | null>(null);
  const [cover169, setCover169] = useState<File | null>(null);
  const [cover43aPreview, setCover43aPreview] = useState<string | null>(null);
  const [cover43bPreview, setCover43bPreview] = useState<string | null>(null);
  const [cover169Preview, setCover169Preview] = useState<string | null>(null);
  const [remoteCoverA, setRemoteCoverA] = useState<string | null>(null);
  const [remoteCoverB, setRemoteCoverB] = useState<string | null>(null);
  const [remoteCover169, setRemoteCover169] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const coverPreviewsRef = useRef({ cover43aPreview, cover43bPreview, cover169Preview });
  coverPreviewsRef.current = { cover43aPreview, cover43bPreview, cover169Preview };

  useEffect(() => {
    return () => {
      const c = coverPreviewsRef.current;
      for (const k of [c.cover43aPreview, c.cover43bPreview, c.cover169Preview] as (string | null)[]) {
        if (k && k.startsWith('blob:')) URL.revokeObjectURL(k);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await params;
      const id = p?.id?.trim() || '';
      if (!id) {
        if (!cancelled) {
          setLoadError('Некорректный ID кейса');
          setLoading(false);
        }
        return;
      }
      setCaseId(id);
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/user/cases/${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setLoadError(await readApiErrorMessage(res));
          return;
        }
        const dto = (await res.json()) as CaseDto;
        if (cancelled) return;
        setTitle(dto.title ?? '');
        setShortDescription(dto.shortDescription ?? '');
        setLocation(dto.location ?? '');
        setYear(dto.year ? String(dto.year) : '');
        setBudgetDigits(parseBudgetDigits(dto.budget ?? ''));
        const pids = parseProductIds(dto.productIds);
        setPickedProducts(pids.map((id) => ({ id, slug: '', name: 'Товар' })));
        if (pids.length && !cancelled) {
          try {
            const res = await fetch('/api/public/catalog/products/resolve-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ ids: pids }),
            });
            if (res.ok && !cancelled) {
              const j = (await res.json()) as { items?: { id: string; slug: string; name: string }[] };
              const list = Array.isArray(j.items) ? j.items : [];
              const byId = new Map(list.map((x) => [x.id, x]));
              setPickedProducts(pids.map((id) => byId.get(id) ?? { id, slug: '', name: 'Товар' }));
            }
          } catch {
            /* оставляем плейсхолдеры */
          }
        }
        setRichContent(dto.descriptionHtml ?? '');
        setSelectedRooms(parseStringArray(dto.roomTypes));

        const layout = dto.coverLayout === '16:9' ? '16:9' : '4:3';
        setCoverGrid(layout);
        const urls = parseStringArray(dto.coverImageUrls);
        if (layout === '16:9') {
          const u0 = urls[0] ?? null;
          setRemoteCover169(u0);
          setCover169Preview(u0);
          setRemoteCoverA(null);
          setRemoteCoverB(null);
          setCover43aPreview(null);
          setCover43bPreview(null);
        } else {
          const a = urls[0] ?? null;
          const b = urls[1] ?? null;
          setRemoteCoverA(a);
          setRemoteCoverB(b);
          setCover43aPreview(a);
          setCover43bPreview(b);
          setRemoteCover169(null);
          setCover169Preview(null);
        }
      } catch {
        if (!cancelled) setLoadError('Сеть или сервер недоступны');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

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

  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) => (prev.includes(room) ? prev.filter((x) => x !== room) : [...prev, room]));
  };
  const removeRoom = (room: string) => {
    setSelectedRooms((prev) => prev.filter((x) => x !== room));
  };

  const normalizedYear = useMemo(() => {
    const y = year.trim();
    if (!y) return null;
    const n = Number(y);
    if (!Number.isFinite(n)) return null;
    return n;
  }, [year]);

  async function onSave() {
    setSaveError(null);
    const t = title.trim();
    if (!t) {
      setSaveError('Введите название кейса');
      return;
    }
    if (!caseId) return;
    setSaving(true);
    try {
      const uploaded: string[] = [];
      if (coverGrid === '4:3') {
        if (cover43a) uploaded.push((await postMultipart('/api/user/cases/media', cover43a, 'rich')).publicUrl);
        else if (remoteCoverA) uploaded.push(remoteCoverA);
        if (cover43b) uploaded.push((await postMultipart('/api/user/cases/media', cover43b, 'rich')).publicUrl);
        else if (remoteCoverB) uploaded.push(remoteCoverB);
      } else {
        if (cover169) uploaded.push((await postMultipart('/api/user/cases/media', cover169, 'rich')).publicUrl);
        else if (remoteCover169) uploaded.push(remoteCover169);
      }

      const res = await fetch(`/api/user/cases/${encodeURIComponent(caseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: t,
          shortDescription: shortDescription.trim() || null,
          location: location.trim() || null,
          year: normalizedYear,
          budget: budgetDigits.trim() ? formatBudgetDigitsGrouped(budgetDigits) : null,
          descriptionHtml: richContent.trim() || null,
          roomTypes: selectedRooms,
          coverLayout: coverGrid,
          coverImageUrls: uploaded.length ? uploaded : null,
          productIds: pickedProducts.length ? pickedProducts.map((p) => p.id) : null,
        }),
      });
      if (!res.ok) {
        setSaveError(await readApiErrorMessage(res));
        return;
      }
      router.push('/account/cases');
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!caseId) return;
    if (!confirm('Удалить кейс?')) return;
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
      router.push('/account/cases');
      router.refresh();
    } catch {
      setDeleteError('Сеть или сервер недоступны');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p style={{ marginTop: 0 }}>Загрузка…</p>;
  }
  if (loadError) {
    return (
      <div>
        <p style={{ marginTop: 0, color: 'var(--color-red)' }} role="alert">
          {loadError}
        </p>
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            type="button"
            variant="secondary"
            className={styles.deleteCaseBtn}
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </Button>
          <Button variant="primary" disabled={saving} onClick={onSave}>
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

        <CaseCoverGridPicker
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
    </div>
  );
}


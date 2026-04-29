'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { useProfileUploads } from '@/hooks/useProfileUploads';
import { CaseBasicFields } from './components/CaseBasicFields';
import { CaseCoverGridPicker } from './components/CaseCoverGridPicker';
import { CaseProductsField, type CaseProductPick } from './components/CaseProductsField';
import { CaseRichDescription } from './components/CaseRichDescription';
import { CaseRoomTypeSelect } from './components/CaseRoomTypeSelect';
import { formatBudgetDigitsGrouped } from '@/lib/formatBudgetRub';
import styles from './page.module.css';

export default function NewCasePage() {
  const router = useRouter();
  const { postMultipart } = useProfileUploads();

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) => (prev.includes(room) ? prev.filter((x) => x !== room) : [...prev, room]));
  };

  const removeRoom = (room: string) => {
    setSelectedRooms((prev) => prev.filter((x) => x !== room));
  };

  useEffect(() => {
    if (!cover43a) {
      setCover43aPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover43a);
    setCover43aPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover43a]);

  useEffect(() => {
    if (!cover43b) {
      setCover43bPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover43b);
    setCover43bPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover43b]);

  useEffect(() => {
    if (!cover169) {
      setCover169Preview(null);
      return;
    }
    const url = URL.createObjectURL(cover169);
    setCover169Preview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover169]);

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
    setSaving(true);
    try {
      const uploaded: string[] = [];
      if (coverGrid === '4:3') {
        if (cover43a) uploaded.push((await postMultipart('/api/user/cases/media', cover43a, 'rich')).publicUrl);
        if (cover43b) uploaded.push((await postMultipart('/api/user/cases/media', cover43b, 'rich')).publicUrl);
      } else {
        if (cover169) uploaded.push((await postMultipart('/api/user/cases/media', cover169, 'rich')).publicUrl);
      }

      const res = await fetch('/api/user/cases', {
        method: 'POST',
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

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Link href="/account/cases" className={styles.backLink}>
          <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.backArrow} aria-hidden />
          <span className={styles.backText}>Вернуться к кейсам</span>
        </Link>
        <Button variant="primary" disabled={saving} onClick={onSave}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
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
          onCoverGridChange={setCoverGrid}
          cover43a={cover43a}
          cover43b={cover43b}
          cover169={cover169}
          cover43aPreview={cover43aPreview}
          cover43bPreview={cover43bPreview}
          cover169Preview={cover169Preview}
          onFileChange={{
            onChange43a: setCover43a,
            onChange43b: setCover43b,
            onChange169: setCover169,
          }}
          onFileRemove={{
            onRemove43a: () => setCover43a(null),
            onRemove43b: () => setCover43b(null),
            onRemove169: () => setCover169(null),
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
      </div>
    </div>
  );
}

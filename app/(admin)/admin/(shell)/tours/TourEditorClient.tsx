'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import {
  ProductGalleryEditor,
  type ProductGalleryFrame,
} from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import pn from '@/app/(admin)/admin/(shell)/catalog/products/new/productNew.module.css';
import type { AdminChinaTourDetail } from './toursAdminTypes';
import { TourEditorDaysSection } from './TourEditorDaysSection';
import {
  cardFramesToImages,
  emptyDay,
  humanizeTourSaveError,
  hydrateEditorDays,
  imagesToFrames,
  matchDaySelectedIds,
  parseSeatCount,
  parseTourDateInput,
  sanitizeSeatDraft,
  selectedFramesToDayImages,
  toDateInput,
  type EditorDay,
} from './tourEditorHelpers';
import styles from './toursAdmin.module.css';

type Props = { tourId?: string };

export function TourEditorClient({ tourId }: Props) {
  const router = useRouter();
  const { confirm } = useAdminConfirm();
  const { locale } = useAdminLocale();
  const galleryStr = useMemo(() => {
    const base = adminProductGalleryEditorStrings(locale);
    return {
      ...base,
      poolHeading: locale === 'zh' ? '照片库' : 'Фото тура',
      poolHint:
        locale === 'zh'
          ? '点击图片，将其加入这一天。'
          : 'Нажмите на кадр, чтобы добавить его в фото дня.',
      emptySelected:
        locale === 'zh'
          ? '尚未选择当天照片 — 从行程照片中选择。'
          : 'Кадры дня не выбраны — выберите из фото тура.',
      emptyPool:
        locale === 'zh'
          ? '先在「照片」中添加行程图片。'
          : 'Сначала добавьте кадры в «Фото тура».',
    };
  }, [locale]);
  const isNew = !tourId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cardText, setCardText] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [seatsTotalStr, setSeatsTotalStr] = useState('10');
  const [seatsTakenStr, setSeatsTakenStr] = useState('0');
  const [seatsFreeStr, setSeatsFreeStr] = useState('10');
  const [isPublished, setIsPublished] = useState(false);
  const [gallery, setGallery] = useState<ProductGalleryFrame[]>([]);
  const [days, setDays] = useState<EditorDay[]>([emptyDay(1)]);
  const [daySelectedIds, setDaySelectedIds] = useState<string[][]>([[]]);
  const [dayCollapsed, setDayCollapsed] = useState<boolean[]>([false]);
  const [itemCollapsed, setItemCollapsed] = useState<boolean[][]>([[false]]);

  function applySeats(total: number, taken: number) {
    const t = Math.max(1, total);
    const k = Math.min(Math.max(0, taken), t);
    setSeatsTotalStr(String(t));
    setSeatsTakenStr(String(k));
    setSeatsFreeStr(String(t - k));
  }

  const load = useCallback(
    async (opts?: { preserveCollapse?: boolean }) => {
      if (!tourId) return;
      const preserveCollapse = Boolean(opts?.preserveCollapse);
      if (!preserveCollapse) setLoading(true);
      setError(null);
      try {
        const t = await adminBackendJson<AdminChinaTourDetail>(`china-tours/admin/tours/${tourId}`);
        setTitle(t.title);
        setSlug(t.slug);
        setCardText(t.cardText ?? '');
        setStartsAt(toDateInput(t.startsAt));
        setEndsAt(toDateInput(t.endsAt));
        applySeats(t.seatsTotal, t.seatsTaken);
        setIsPublished(t.isPublished);
        const cardImgs = t.images.filter(
          (i) => i.role === 'CARD_PRIMARY' || i.role === 'CARD_SECONDARY',
        );
        const pool = imagesToFrames(cardImgs);
        setGallery(pool);
        const loadedDays = t.days.length ? hydrateEditorDays(t.days) : [emptyDay(1)];
        setDays(loadedDays);
        setDaySelectedIds(loadedDays.map((d) => matchDaySelectedIds(d.images ?? [], pool)));
        if (preserveCollapse) {
          setDayCollapsed((prev) => loadedDays.map((_, i) => prev[i] ?? false));
          setItemCollapsed((prev) =>
            loadedDays.map((d, i) => d.items.map((_, j) => prev[i]?.[j] ?? false)),
          );
        } else {
          setDayCollapsed(loadedDays.map(() => false));
          setItemCollapsed(loadedDays.map((d) => d.items.map(() => false)));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!preserveCollapse) setLoading(false);
      }
    },
    [tourId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function removeDay(di: number) {
    const day = days[di];
    const label = day?.title?.trim() ? `«${day.title.trim()}»` : `День ${di + 1}`;
    const ok = await confirm({
      title: 'Удалить день?',
      message: `${label} и все пункты расписания будут удалены.`,
      confirmLabel: 'Удалить',
    });
    if (!ok) return;
    setDays((prev) =>
      prev.filter((_, i) => i !== di).map((d, i) => ({ ...d, dayNumber: i + 1 })),
    );
    setDaySelectedIds((prev) => prev.filter((_, i) => i !== di));
    setDayCollapsed((prev) => prev.filter((_, i) => i !== di));
    setItemCollapsed((prev) => prev.filter((_, i) => i !== di));
  }

  async function removeItem(di: number, ii: number) {
    const it = days[di]?.items[ii];
    const label = it?.title?.trim() || it?.timeLabel?.trim() || `Пункт ${ii + 1}`;
    const ok = await confirm({
      title: 'Удалить пункт?',
      message: `«${label}» будет удалён из дня ${di + 1}.`,
      confirmLabel: 'Удалить',
    });
    if (!ok) return;
    setDays((prev) =>
      prev.map((d, i) => (i === di ? { ...d, items: d.items.filter((_, j) => j !== ii) } : d)),
    );
    setItemCollapsed((prev) =>
      prev.map((row, i) => (i === di ? row.filter((_, j) => j !== ii) : row)),
    );
  }

  function handleGalleryChange(next: ProductGalleryFrame[]) {
    setGallery(next);
    const alive = new Set(next.map((f) => f.id));
    setDaySelectedIds((prev) => prev.map((ids) => ids.filter((id) => alive.has(id))));
  }

  function setDaySelected(di: number, ids: string[]) {
    setDaySelectedIds((prev) => prev.map((row, i) => (i === di ? ids : row)));
  }

  function toggleDayCollapsed(di: number) {
    setDayCollapsed((prev) => prev.map((v, i) => (i === di ? !v : v)));
  }

  function toggleItemCollapsed(di: number, ii: number) {
    setItemCollapsed((prev) =>
      prev.map((row, i) => (i === di ? row.map((v, j) => (j === ii ? !v : v)) : row)),
    );
  }

  function addDay() {
    setDays((prev) => [...prev, emptyDay(prev.length + 1)]);
    setDaySelectedIds((prev) => [...prev, []]);
    setDayCollapsed((prev) => [...prev, false]);
    setItemCollapsed((prev) => [...prev, [false]]);
  }

  function onSeatsTotalChange(raw: string) {
    const next = sanitizeSeatDraft(raw);
    setSeatsTotalStr(next);
    const total = next === '' ? null : Number(next);
    const taken = seatsTakenStr === '' ? null : Number(seatsTakenStr);
    if (total == null || !Number.isFinite(total)) return;
    if (taken != null && Number.isFinite(taken)) {
      const k = Math.min(Math.max(0, taken), Math.max(0, total));
      setSeatsTakenStr(String(k));
      setSeatsFreeStr(String(Math.max(0, total - k)));
    }
  }

  function onSeatsTakenChange(raw: string) {
    const next = sanitizeSeatDraft(raw);
    setSeatsTakenStr(next);
    const taken = next === '' ? null : Number(next);
    const total = seatsTotalStr === '' ? null : Number(seatsTotalStr);
    if (taken == null || total == null || !Number.isFinite(taken) || !Number.isFinite(total)) return;
    setSeatsFreeStr(String(Math.max(0, total - taken)));
  }

  function onSeatsFreeChange(raw: string) {
    const next = sanitizeSeatDraft(raw);
    setSeatsFreeStr(next);
    const free = next === '' ? null : Number(next);
    const total = seatsTotalStr === '' ? null : Number(seatsTotalStr);
    if (free == null || total == null || !Number.isFinite(free) || !Number.isFinite(total)) return;
    setSeatsTakenStr(String(Math.max(0, total - free)));
  }

  function normalizeSeatsOnBlur() {
    const total = Math.max(1, parseSeatCount(seatsTotalStr, 1));
    const taken = parseSeatCount(seatsTakenStr, 0);
    applySeats(total, taken);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const seatsTotal = Math.max(1, parseSeatCount(seatsTotalStr, 1));
      const seatsTaken = parseSeatCount(seatsTakenStr, 0);
      if (seatsTaken > seatsTotal) {
        throw new Error('Занятых мест не может быть больше вместимости');
      }
      applySeats(seatsTotal, seatsTaken);

      const startsAtIso = parseTourDateInput(startsAt, 'Начало');
      const endsAtIso = parseTourDateInput(endsAt, 'Конец');
      if (new Date(endsAtIso).getTime() < new Date(startsAtIso).getTime()) {
        throw new Error('Дата окончания раньше начала');
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        cardText: cardText.trim() || null,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        seatsTotal,
        seatsTaken,
        isPublished,
        images: cardFramesToImages(gallery),
        days: days.map((d, di) => ({
          ...(d.id ? { id: d.id } : {}),
          dayNumber: d.dayNumber || di + 1,
          title: d.title,
          subtitle: d.subtitle,
          sortOrder: di,
          items: d.items.map((it, ii) => ({
            ...(it.id ? { id: it.id } : {}),
            timeLabel: it.timeLabel,
            title: it.title,
            body: it.body,
            sortOrder: ii,
          })),
          images: selectedFramesToDayImages(gallery, daySelectedIds[di] ?? []),
          brands: d.brands.map((b, bi) => ({
            ...(b.id ? { id: b.id } : {}),
            brandId: b.brandId || null,
            customName: b.brandId ? null : b.customName || b.name || null,
            sortOrder: bi,
          })),
        })),
      };
      if (isNew) {
        const created = await adminBackendJson<AdminChinaTourDetail>('china-tours/admin/tours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        router.replace(`/admin/tours/${created.id}`);
      } else {
        await adminBackendJson(`china-tours/admin/tours/${tourId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await load({ preserveCollapse: true });
      }
    } catch (e) {
      setError(humanizeTourSaveError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={catalogStyles.muted}>Загрузка…</p>;

  return (
    <>
      <div className={catalogStyles.backRow}>
        <Link href="/admin/tours" className={catalogStyles.backLink}>
          ← К списку туров
        </Link>
      </div>

      <div className={`${catalogStyles.form} ${pn.formWide}`}>
        {error ? <p className={catalogStyles.error}>{error}</p> : null}

        <div className={pn.productFormGrid}>
          <div className={pn.productFormMain}>
            <AdminTextField label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
            <AdminTextField
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="авто из названия"
            />
            <AdminTextArea
              label="Текст карточки"
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              rows={3}
            />

            <div className={pn.section}>
              <h2 className={catalogStyles.groupHeading}>Фото тура</h2>
              <ProductGalleryEditor
                mode="full"
                items={gallery}
                onChange={handleGalleryChange}
                strings={galleryStr}
              />
            </div>

            <TourEditorDaysSection
              days={days}
              setDays={setDays}
              dayCollapsed={dayCollapsed}
              itemCollapsed={itemCollapsed}
              setItemCollapsed={setItemCollapsed}
              daySelectedIds={daySelectedIds}
              gallery={gallery}
              galleryStr={galleryStr}
              onToggleDayCollapsed={toggleDayCollapsed}
              onToggleItemCollapsed={toggleItemCollapsed}
              onRemoveDay={removeDay}
              onRemoveItem={removeItem}
              onDaySelectedChange={setDaySelected}
              onAddDay={addDay}
            />
          </div>

          <aside className={pn.productFormPlacement} aria-label="Параметры тура">
            <p className={pn.placementHeading}>Параметры</p>

            <div className={pn.placementBlock}>
              <div className={styles.placementStack}>
                <AdminTextField
                  label="Начало"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
                <AdminTextField
                  label="Конец"
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className={pn.placementBlock}>
              <h3 className={`${catalogStyles.groupHeading} ${pn.placementGroupHeading}`}>Места</h3>
              <div className={styles.placementStack}>
                <AdminTextField
                  label="Всего"
                  inputMode="numeric"
                  value={seatsTotalStr}
                  onChange={(e) => onSeatsTotalChange(e.target.value)}
                  onBlur={normalizeSeatsOnBlur}
                />
                <div className={styles.seatsRow}>
                  <AdminTextField
                    label="Занято"
                    inputMode="numeric"
                    value={seatsTakenStr}
                    onChange={(e) => onSeatsTakenChange(e.target.value)}
                    onBlur={normalizeSeatsOnBlur}
                  />
                  <AdminTextField
                    label="Свободно"
                    inputMode="numeric"
                    value={seatsFreeStr}
                    onChange={(e) => onSeatsFreeChange(e.target.value)}
                    onBlur={normalizeSeatsOnBlur}
                  />
                </div>
              </div>
            </div>

            <div className={pn.placementBlock}>
              <div className={catalogStyles.label}>
                <div className={catalogStyles.labelCheckboxRow}>
                  <AccountCheckbox
                    id="tour-published"
                    className={catalogStyles.adminCheckboxForm}
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    aria-label="Опубликован"
                  />
                  <label htmlFor="tour-published">Опубликован</label>
                </div>
              </div>
            </div>

            <div className={pn.placementBlock}>
              <AdminCompactBtn
                type="button"
                variant="accent"
                className={styles.placementSave}
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Сохранение…' : 'Сохранить тур'}
              </AdminCompactBtn>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
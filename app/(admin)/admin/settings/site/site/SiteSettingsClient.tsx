'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { adminOrderStatusLabels } from '@/lib/admin-i18n/adminOrdersI18n';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import styles from './siteSettings.module.css';

function newOrderStatusRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Совпадает с Prisma enum `OrderStatus` — при новом статусе в схеме дописать сюда. */
const ORDER_STATUS_ENUM_ORDER = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ORDERED',
  'PAID',
  'RECEIVED',
  'REJECTED',
] as const;

type OrderStatusEnumKey = (typeof ORDER_STATUS_ENUM_ORDER)[number];

type OrderStatusLabelRow = { id: string; key: string; label: string };

function orderStatusRowsFromServer(rawOsl: unknown): OrderStatusLabelRow[] {
  const allowedSet = new Set<string>(ORDER_STATUS_ENUM_ORDER);
  const fromDb: Record<string, string> = {};
  if (rawOsl && typeof rawOsl === 'object' && !Array.isArray(rawOsl)) {
    for (const [k, v] of Object.entries(rawOsl as Record<string, unknown>)) {
      const key = String(k).trim();
      if (!allowedSet.has(key)) continue;
      if (typeof v === 'string' && v.trim()) fromDb[key] = v.trim();
    }
  }
  const keys = Object.keys(fromDb).sort((a, b) => {
    const ia = ORDER_STATUS_ENUM_ORDER.indexOf(a as OrderStatusEnumKey);
    const ib = ORDER_STATUS_ENUM_ORDER.indexOf(b as OrderStatusEnumKey);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b);
  });
  if (keys.length === 0) {
    return ORDER_STATUS_ENUM_ORDER.map((key) => ({ id: newOrderStatusRowId(), key, label: '' }));
  }
  return keys.map((key) => ({ id: newOrderStatusRowId(), key, label: fromDb[key] ?? '' }));
}

function keyOptionsForRow(rowId: string, rows: OrderStatusLabelRow[]): readonly OrderStatusEnumKey[] {
  const row = rows.find((r) => r.id === rowId);
  const cur = row?.key.trim() ?? '';
  const others = new Set(
    rows.filter((r) => r.id !== rowId).map((r) => r.key.trim()).filter(Boolean),
  );
  return ORDER_STATUS_ENUM_ORDER.filter((k) => !others.has(k) || k === cur);
}

const DEFAULT_ORDER_STATUS_LABELS_RU = adminOrderStatusLabels('ru');

type SiteSettingsAdminPayload = {
  heroImageUrls: string[];
  designerServiceOptions: string[];
  caseRoomTypeOptions: string[];
  orderStatusLabels?: Record<string, string> | null;
};

type TabKey = 'hero' | 'orders' | 'other';

export function SiteSettingsClient() {
  const [tab, setTab] = useState<TabKey>('hero');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [designerServiceOptions, setDesignerServiceOptions] = useState<string[]>([]);
  const [caseRoomTypeOptions, setCaseRoomTypeOptions] = useState<string[]>([]);
  const [orderStatusRows, setOrderStatusRows] = useState<OrderStatusLabelRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminBackendJson<SiteSettingsAdminPayload>('settings/admin/site');
      setHeroImageUrls(Array.isArray(data?.heroImageUrls) ? data.heroImageUrls : []);
      setDesignerServiceOptions(
        Array.isArray(data?.designerServiceOptions) && data.designerServiceOptions.length
          ? data.designerServiceOptions.filter((x) => typeof x === 'string' && x.trim().length > 0)
          : [''],
      );
      setCaseRoomTypeOptions(
        Array.isArray(data?.caseRoomTypeOptions) && data.caseRoomTypeOptions.length
          ? data.caseRoomTypeOptions.filter((x) => typeof x === 'string' && x.trim().length > 0)
          : [''],
      );
      setOrderStatusRows(orderStatusRowsFromServer(data?.orderStatusLabels));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const heroCount = heroImageUrls.length;
  const canAddMore = heroCount < 8;

  const heroHint = useMemo(() => {
    if (heroCount === 0) return 'Пока не выбрано ни одного изображения (будет использоваться дефолтный hero).';
    if (heroCount >= 8) return 'Достигнут лимит 8 изображений.';
    return `Выбрано: ${heroCount} / 8.`;
  }, [heroCount]);

  function removeHeroUrl(url: string) {
    setHeroImageUrls((prev) => prev.filter((x) => x !== url));
  }

  function clearHero() {
    if (!confirm('Очистить все изображения Hero?')) return;
    setHeroImageUrls([]);
  }

  async function saveHero() {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Partial<SiteSettingsAdminPayload> = {
        heroImageUrls: heroImageUrls.slice(0, 8),
      };
      const res = await adminBackendFetch('settings/admin/site', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setSaveError(typeof j?.message === 'string' ? j.message : 'Не удалось сохранить');
        return;
      }
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  function addServiceRow() {
    setDesignerServiceOptions((prev) => [...prev, '']);
  }

  function setServiceAt(index: number, value: string) {
    setDesignerServiceOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeServiceAt(index: number) {
    setDesignerServiceOptions((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  function addRoomTypeRow() {
    setCaseRoomTypeOptions((prev) => [...prev, '']);
  }

  function setRoomTypeAt(index: number, value: string) {
    setCaseRoomTypeOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeRoomTypeAt(index: number) {
    setCaseRoomTypeOptions((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  async function saveOther() {
    setSaving(true);
    setSaveError(null);
    try {
      const list = designerServiceOptions.map((x) => x.trim()).filter((x) => x.length > 0);
      const roomTypes = caseRoomTypeOptions.map((x) => x.trim()).filter((x) => x.length > 0);
      const res = await adminBackendFetch('settings/admin/site', {
        method: 'PATCH',
        body: JSON.stringify({
          designerServiceOptions: list,
          caseRoomTypeOptions: roomTypes,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setSaveError(typeof j?.message === 'string' ? j.message : 'Не удалось сохранить');
        return;
      }
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  const canAddOrderStatusRow = useMemo(() => {
    const used = new Set(orderStatusRows.map((r) => r.key.trim()).filter(Boolean));
    return ORDER_STATUS_ENUM_ORDER.some((k) => !used.has(k));
  }, [orderStatusRows]);

  function addOrderStatusRow() {
    setOrderStatusRows((prev) => {
      const used = new Set(prev.map((r) => r.key.trim()).filter(Boolean));
      const nextKey = ORDER_STATUS_ENUM_ORDER.find((k) => !used.has(k));
      if (!nextKey) return prev;
      return [...prev, { id: newOrderStatusRowId(), key: nextKey, label: '' }];
    });
  }

  function removeOrderStatusRow(id: string) {
    setOrderStatusRows((prev) => prev.filter((r) => r.id !== id));
  }

  function setOrderStatusRowKey(id: string, key: string) {
    setOrderStatusRows((prev) => prev.map((r) => (r.id === id ? { ...r, key } : r)));
  }

  function setOrderStatusRowLabel(id: string, label: string) {
    setOrderStatusRows((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  }

  async function saveOrders() {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string> = {};
      const seen = new Set<string>();
      for (const row of orderStatusRows) {
        const k = row.key.trim();
        const lab = row.label.trim();
        if (!k && !lab) continue;
        if (!k && lab) {
          setSaveError('Укажите код статуса в строке с подписью или очистите подпись');
          return;
        }
        if (!ORDER_STATUS_ENUM_ORDER.includes(k as OrderStatusEnumKey)) {
          setSaveError(`Недопустимый код статуса: ${k}`);
          return;
        }
        if (seen.has(k)) {
          setSaveError(`Код «${k}» встречается в таблице дважды`);
          return;
        }
        seen.add(k);
        if (lab) body[k] = lab;
      }
      const res = await adminBackendFetch('settings/admin/site', {
        method: 'PATCH',
        body: JSON.stringify({ orderStatusLabels: body }),
      });
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setSaveError(typeof j?.message === 'string' ? j.message : 'Не удалось сохранить');
        return;
      }
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs} role="tablist" aria-label="Настройки сайта">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'hero'}
          className={`${styles.tabBtn} ${tab === 'hero' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('hero')}
        >
          Настройка Hero блока
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'orders'}
          className={`${styles.tabBtn} ${tab === 'orders' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('orders')}
        >
          Заказы
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'other'}
          className={`${styles.tabBtn} ${tab === 'other' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('other')}
        >
          Прочие настройки
        </button>
      </div>

      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}
      {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}
      {loading ? <p className={catalogStyles.muted}>Загрузка…</p> : null}

      {tab === 'hero' ? (
        <section aria-label="Настройка Hero блока">
          <p className={catalogStyles.muted}>{heroHint}</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={catalogStyles.btn}
              disabled={!canAddMore}
              onClick={() => setPickerOpen(true)}
            >
              Добавить изображения
            </button>
            <button
              type="button"
              className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
              disabled={heroCount === 0}
              onClick={clearHero}
            >
              Очистить
            </button>
            <button type="button" className={catalogStyles.btn} disabled={saving} onClick={saveHero}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>

          {heroCount > 0 ? (
            <ul className={styles.thumbGrid} aria-label="Изображения Hero">
              {heroImageUrls.map((url) => (
                <li key={url} className={styles.thumbCard}>
                  <img className={styles.thumbImg} src={url} alt="" loading="lazy" />
                  <div className={styles.thumbActions}>
                    <button
                      type="button"
                      className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                      onClick={() => removeHeroUrl(url)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <MediaLibraryPickerModal
            open={pickerOpen}
            title="Hero: выберите до 8 изображений"
            mediaFilter="image"
            onClose={() => setPickerOpen(false)}
            onPickBatch={(items) => {
              setPickerOpen(false);
              setHeroImageUrls((prev) => {
                const next = [...prev];
                for (const it of items) {
                  if (next.length >= 8) break;
                  if (!next.includes(it.url)) next.push(it.url);
                }
                return next;
              });
            }}
          />
        </section>
      ) : null}

      {tab === 'orders' ? (
        <section aria-label="Подписи статусов заказа">
          <p className={catalogStyles.muted}>
            Подписи статусов в списке заказов и на странице заказа в админке (поверх встроенных для языка админки).
          </p>
          <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
            Добавляйте и удаляйте строки: сохраняются только коды из enum <code>OrderStatus</code> (как в базе). Пустая
            подпись — в интерфейсе будет встроенный текст. Новый <strong>код</strong> статуса в системе заказов по-прежнему
            появляется только после миграции Prisma и дописывания в константу <code>ORDER_STATUS_ENUM_ORDER</code> в этом
            файле.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              type="button"
              className={catalogStyles.btn}
              onClick={addOrderStatusRow}
              disabled={saving || !canAddOrderStatusRow}
            >
              Добавить строку
            </button>
            <button type="button" className={catalogStyles.btn} disabled={saving} onClick={() => void saveOrders()}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
          <table className={styles.serviceTable} style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th scope="col">Код</th>
                <th scope="col">Подпись</th>
                <th scope="col" style={{ width: 100 }}>
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {orderStatusRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select
                      className={styles.serviceInput}
                      value={row.key}
                      onChange={(e) => setOrderStatusRowKey(row.id, e.target.value)}
                      aria-label="Код статуса"
                    >
                      <option value="">— выберите —</option>
                      {keyOptionsForRow(row.id, orderStatusRows).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.serviceInput}
                      value={row.label}
                      onChange={(e) => setOrderStatusRowLabel(row.id, e.target.value)}
                      placeholder={
                        row.key && row.key in DEFAULT_ORDER_STATUS_LABELS_RU
                          ? DEFAULT_ORDER_STATUS_LABELS_RU[row.key as OrderStatusEnumKey]
                          : 'Подпись'
                      }
                      aria-label={row.key ? `Подпись для ${row.key}` : 'Подпись'}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                      onClick={() => removeOrderStatusRow(row.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === 'other' ? (
        <section aria-label="Прочие настройки">
          <p className={catalogStyles.muted}>
            Список услуг отображается в поле «Услуги» в редактировании профиля дизайнера.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className={catalogStyles.btn} onClick={addServiceRow} disabled={saving}>
              Добавить строку
            </button>
            <button type="button" className={catalogStyles.btn} disabled={saving} onClick={saveOther}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
          <table className={styles.serviceTable}>
            <thead>
              <tr>
                <th scope="col">Услуга</th>
                <th scope="col" style={{ width: 100 }}>
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {designerServiceOptions.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className={styles.serviceInput}
                      value={row}
                      onChange={(e) => setServiceAt(index, e.target.value)}
                      placeholder="Название услуги"
                      aria-label={`Услуга ${index + 1}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                      onClick={() => removeServiceAt(index)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className={catalogStyles.muted} style={{ marginTop: 18 }}>
            Список типов помещений отображается в поле «Выберите типы помещений» при создании кейса дизайнера.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className={catalogStyles.btn} onClick={addRoomTypeRow} disabled={saving}>
              Добавить строку
            </button>
          </div>
          <table className={styles.serviceTable} style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th scope="col">Тип помещения</th>
                <th scope="col" style={{ width: 100 }}>
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {caseRoomTypeOptions.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className={styles.serviceInput}
                      value={row}
                      onChange={(e) => setRoomTypeAt(index, e.target.value)}
                      placeholder="Название помещения"
                      aria-label={`Тип помещения ${index + 1}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                      onClick={() => removeRoomTypeAt(index)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

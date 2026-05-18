'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { TextField } from '@/components/TextField';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import styles from './siteSettings.module.css';

type SiteSettingsAdminPayload = {
  heroImageUrls: string[];
  designerServiceOptions: string[];
  caseRoomTypeOptions: string[];
};

type OrderSettingsAdminPayload = {
  designerOwnCatalogBonusPercent: number;
  designerOwnMinimumCatalogSiteTotalRub: number;
  kpMaxLineDiscountPercent: number;
  catalogBasisNote: string;
  referralPayoutRulesNote: string;
};

type TabKey = 'hero' | 'other' | 'orders';

export function SiteSettingsClient() {
  const [tab, setTab] = useState<TabKey>('hero');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [designerServiceOptions, setDesignerServiceOptions] = useState<string[]>([]);
  const [caseRoomTypeOptions, setCaseRoomTypeOptions] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [orderDesignerPct, setOrderDesignerPct] = useState('');
  const [orderMinCatalogRub, setOrderMinCatalogRub] = useState('');
  const [orderKpMaxDisc, setOrderKpMaxDisc] = useState('');
  const [orderSettingsError, setOrderSettingsError] = useState<string | null>(null);

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
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrderSettings = useCallback(async () => {
    setOrderSettingsError(null);
    try {
      const res = await adminBackendFetch('settings/admin/orders', { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        setOrderSettingsError(typeof j?.message === 'string' ? j.message : 'Не удалось загрузить настройки заказов');
        return;
      }
      const data = (await res.json()) as OrderSettingsAdminPayload;
      setOrderDesignerPct(String(data.designerOwnCatalogBonusPercent ?? 0));
      setOrderMinCatalogRub(String(data.designerOwnMinimumCatalogSiteTotalRub ?? 0));
      setOrderKpMaxDisc(String(data.kpMaxLineDiscountPercent ?? 100));
    } catch {
      setOrderSettingsError('Не удалось загрузить настройки заказов');
    }
  }, []);

  useEffect(() => {
    void loadOrderSettings();
  }, [loadOrderSettings]);

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

  async function saveOrderSettings() {
    setSaving(true);
    setSaveError(null);
    setOrderSettingsError(null);
    const pct = Number(String(orderDesignerPct).replace(',', '.'));
    const minRub = Number(String(orderMinCatalogRub).replace(/\s+/g, '').replace(',', '.'));
    const kp = Number(String(orderKpMaxDisc).replace(',', '.'));
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setSaveError('Процент дизайнера: число от 0 до 100.');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(minRub) || minRub < 0) {
      setSaveError('Порог каталога: неотрицательное число.');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(kp) || kp < 0 || kp > 100) {
      setSaveError('Лимит скидки КП: число от 0 до 100.');
      setSaving(false);
      return;
    }
    try {
      const res = await adminBackendFetch('settings/admin/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          designerOwnCatalogBonusPercent: pct,
          designerOwnMinimumCatalogSiteTotalRub: minRub,
          kpMaxLineDiscountPercent: kp,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setSaveError(typeof j?.message === 'string' ? j.message : 'Не удалось сохранить настройки заказов');
        return;
      }
      await loadOrderSettings();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить настройки заказов');
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
          aria-selected={tab === 'other'}
          className={`${styles.tabBtn} ${tab === 'other' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('other')}
        >
          Прочие настройки
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

      {tab === 'orders' ? (
        <section aria-label="Заказы">
          {orderSettingsError ? <p className={catalogStyles.error}>{orderSettingsError}</p> : null}
          <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <TextField
              label="Бонус дизайнера со своего заказа, %"
              type="number"
              min={0}
              max={100}
              step="0.5"
              name="designerOwnCatalogBonusPercent"
              value={orderDesignerPct}
              onChange={(e) => setOrderDesignerPct(e.target.value)}
              autoComplete="off"
            />
            <TextField
              label="Мин. сумма заказа для бонуса, ₽"
              type="number"
              min={0}
              step={1}
              name="designerOwnMinimumCatalogSiteTotalRub"
              value={orderMinCatalogRub}
              onChange={(e) => setOrderMinCatalogRub(e.target.value)}
              autoComplete="off"
            />
            <TextField
              label="Макс. скидка по строке коммерческого предложения, %"
              type="number"
              min={0}
              max={100}
              step={1}
              name="kpMaxLineDiscountPercent"
              value={orderKpMaxDisc}
              onChange={(e) => setOrderKpMaxDisc(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <button type="button" className={catalogStyles.btn} disabled={saving} onClick={() => void saveOrderSettings()}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
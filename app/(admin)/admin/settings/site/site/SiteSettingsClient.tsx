'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { DesignerBonusProfilesPanel } from './DesignerBonusProfilesPanel';
import styles from './siteSettings.module.css';

type SiteSettingsAdminPayload = {
  heroImageUrls: string[];
  designerServiceOptions: string[];
  caseRoomTypeOptions: string[];
};

type TabKey = 'hero' | 'other' | 'designerBonusProfiles';

export function SiteSettingsClient() {
  const { confirm } = useAdminConfirm();
  const [tab, setTab] = useState<TabKey>('hero');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [designerServiceOptions, setDesignerServiceOptions] = useState<string[]>([]);
  const [caseRoomTypeOptions, setCaseRoomTypeOptions] = useState<string[]>([]);
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

  async function clearHero() {
    if (!(await confirm({ title: 'Очистить все изображения Hero?' }))) return;
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

  return (
      <div className={styles.panel}>
      <AdminTabs
        ariaLabel="Настройки сайта"
        items={[
          { id: 'hero' as const, label: 'Настройка Hero блока' },
          { id: 'designerBonusProfiles' as const, label: 'Бонусы дизайнера' },
          { id: 'other' as const, label: 'Прочие настройки' },
        ]}
        activeId={tab}
        onChange={setTab}
      />

      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}
      {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}
      {loading ? <p className={catalogStyles.muted}>Загрузка…</p> : null}

      {tab === 'hero' ? (
        <section aria-label="Настройка Hero блока">
          <p className={catalogStyles.muted}>{heroHint}</p>

          <div className={catalogStyles.formActions}>
            <AdminCompactBtn type="button" disabled={!canAddMore} onClick={() => setPickerOpen(true)}>
              Добавить изображения
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="danger"
              disabled={heroCount === 0}
              onClick={clearHero}
            >
              Очистить
            </AdminCompactBtn>
            <AdminCompactBtn type="button" variant="accent" disabled={saving} onClick={saveHero}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </AdminCompactBtn>
          </div>

          {heroCount > 0 ? (
            <ul className={styles.thumbGrid} aria-label="Изображения Hero">
              {heroImageUrls.map((url) => (
                <li key={url} className={styles.thumbCard}>
                  <img className={styles.thumbImg} src={url} alt="" loading="lazy" />
                  <div className={styles.thumbActions}>
                    <AdminCompactBtn type="button" variant="danger" onClick={() => removeHeroUrl(url)}>
                      Удалить
                    </AdminCompactBtn>
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
          <h2 className={catalogStyles.groupHeading}>Услуги дизайнера</h2>
          <p className={catalogStyles.muted}>
            Список услуг отображается в поле «Услуги» в редактировании профиля дизайнера.
          </p>
          <div className={catalogStyles.formActions}>
            <AdminCompactBtn type="button" onClick={addServiceRow} disabled={saving}>
              Добавить строку
            </AdminCompactBtn>
            <AdminCompactBtn type="button" variant="accent" disabled={saving} onClick={saveOther}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </AdminCompactBtn>
          </div>
          <div className={`${catalogStyles.tableWrap} ${styles.tableAfterActions}`}>
            <table className={catalogStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Услуга</th>
                  <th className={catalogStyles.tableCellActions} scope="col" />
                </tr>
              </thead>
              <tbody>
                {designerServiceOptions.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <AdminTextField
                        value={row}
                        onChange={(e) => setServiceAt(index, e.target.value)}
                        placeholder="Название услуги"
                        aria-label={`Услуга ${index + 1}`}
                      />
                    </td>
                    <td className={catalogStyles.tableCellActions}>
                      <AdminCompactBtn
                        type="button"
                        variant="danger"
                        onClick={() => removeServiceAt(index)}
                      >
                        Удалить
                      </AdminCompactBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className={catalogStyles.groupHeading} style={{ marginTop: 24 }}>
            Типы помещений
          </h2>
          <p className={catalogStyles.muted}>
            Список типов помещений отображается в поле «Выберите типы помещений» при создании кейса
            дизайнера.
          </p>
          <div className={catalogStyles.formActions}>
            <AdminCompactBtn type="button" onClick={addRoomTypeRow} disabled={saving}>
              Добавить строку
            </AdminCompactBtn>
          </div>
          <div className={`${catalogStyles.tableWrap} ${styles.tableAfterActions}`}>
            <table className={catalogStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Тип помещения</th>
                  <th className={catalogStyles.tableCellActions} scope="col" />
                </tr>
              </thead>
              <tbody>
                {caseRoomTypeOptions.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <AdminTextField
                        value={row}
                        onChange={(e) => setRoomTypeAt(index, e.target.value)}
                        placeholder="Название помещения"
                        aria-label={`Тип помещения ${index + 1}`}
                      />
                    </td>
                    <td className={catalogStyles.tableCellActions}>
                      <AdminCompactBtn
                        type="button"
                        variant="danger"
                        onClick={() => removeRoomTypeAt(index)}
                      >
                        Удалить
                      </AdminCompactBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'designerBonusProfiles' ? <DesignerBonusProfilesPanel /> : null}
    </div>
  );
}

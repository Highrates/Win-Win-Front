'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import styles from './siteSettings.module.css';

type SiteSettingsAdminPayload = {
  heroImageUrls: string[];
};

type TabKey = 'hero';

export function SiteSettingsClient() {
  const [tab, setTab] = useState<TabKey>('hero');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminBackendJson<SiteSettingsAdminPayload>('settings/admin/site');
      setHeroImageUrls(Array.isArray(data?.heroImageUrls) ? data.heroImageUrls : []);
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
    </div>
  );
}


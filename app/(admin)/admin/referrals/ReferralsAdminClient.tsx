'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { adminBackendFetch } from '@/lib/adminBackendFetch';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import tabStyles from '../adminTabs.module.css';

type TabKey = 'percent' | 'payouts' | 'reports';

type ProgramCfg = {
  level1Percent: number;
  level2Percent: number;
  minimumOrderSiteTotalRub: number;
};

export function ReferralsAdminClient({
  title,
  labels,
  leads,
}: {
  title: string;
  labels: { percent: string; payouts: string; reports: string };
  leads: { percent: string; payouts: string; reports: string };
}) {
  const [tab, setTab] = useState<TabKey>('percent');

  const [lvl1, setLvl1] = useState('');
  const [lvl2, setLvl2] = useState('');
  const [minRub, setMinRub] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await adminBackendFetch('referrals/admin/program', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) {
        setLoadError(await readApiErrorMessage(res));
        return;
      }
      const cfg = (await res.json()) as ProgramCfg;
      setLvl1(String(cfg.level1Percent));
      setLvl2(String(cfg.level2Percent));
      setMinRub(String(cfg.minimumOrderSiteTotalRub));
    } catch {
      setLoadError('Не удалось загрузить настройки');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSavePercent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const a = Number(lvl1.replace(',', '.'));
    const b = Number(lvl2.replace(',', '.'));
    const min = Number(String(minRub).replace(/\s+/g, '').replace(',', '.'));
    if ([a, b, min].some((n) => !Number.isFinite(n))) {
      setSaveError('Заполните все поля числами.');
      return;
    }
    if (a < 0 || a > 100 || b < 0 || b > 100) {
      setSaveError('Проценты должны быть от 0 до 100.');
      return;
    }
    if (min < 0) {
      setSaveError('Минимум не может быть отрицательным.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminBackendFetch('referrals/admin/program', {
        method: 'PATCH',
        body: JSON.stringify({
          level1Percent: a,
          level2Percent: b,
          minimumOrderSiteTotalRub: Math.max(0, Math.round(min)),
        }),
      });
      if (!res.ok) {
        setSaveError(await readApiErrorMessage(res));
        return;
      }
      const cfg = (await res.json()) as ProgramCfg;
      setLvl1(String(cfg.level1Percent));
      setLvl2(String(cfg.level2Percent));
      setMinRub(String(cfg.minimumOrderSiteTotalRub));
    } catch {
      setSaveError('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={tabStyles.panel}>
      <h1>{title}</h1>
      <div className={tabStyles.tabs} role="tablist" aria-label={title}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'percent'}
          className={`${tabStyles.tabBtn} ${tab === 'percent' ? tabStyles.tabBtnActive : ''}`}
          onClick={() => setTab('percent')}
        >
          {labels.percent}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'payouts'}
          className={`${tabStyles.tabBtn} ${tab === 'payouts' ? tabStyles.tabBtnActive : ''}`}
          onClick={() => setTab('payouts')}
        >
          {labels.payouts}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'reports'}
          className={`${tabStyles.tabBtn} ${tab === 'reports' ? tabStyles.tabBtnActive : ''}`}
          onClick={() => setTab('reports')}
        >
          {labels.reports}
        </button>
      </div>

      {tab === 'percent' ? (
        <section
          {...(leads.percent.trim()
            ? ({ 'aria-labelledby': 'referrals-tab-percent' } as const)
            : ({ 'aria-label': labels.percent } as const))}
        >
          {leads.percent.trim() ? (
            <p id="referrals-tab-percent" className={tabStyles.lead}>
              {leads.percent}
            </p>
          ) : null}

          {loadError ? (
            <p className={tabStyles.lead} role="alert" style={{ color: 'var(--color-red)' }}>
              {loadError}
            </p>
          ) : null}

          <form onSubmit={onSavePercent} noValidate style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField
              label="Процент L1 (прямой реферал)"
              type="number"
              name="level1Percent"
              min={0}
              max={100}
              step="0.5"
              value={lvl1}
              onChange={(e) => setLvl1(e.target.value)}
              autoComplete="off"
            />
            <TextField
              label="Процент L2 (второй уровень)"
              type="number"
              name="level2Percent"
              min={0}
              max={100}
              step="0.5"
              value={lvl2}
              onChange={(e) => setLvl2(e.target.value)}
              autoComplete="off"
            />
            <TextField
              label="Минимальная сумма «цена на сайте» по заказу (₽), ниже — бонус 0"
              type="number"
              name="minimumOrderSiteTotalRub"
              min={0}
              step={1}
              value={minRub}
              onChange={(e) => setMinRub(e.target.value)}
              autoComplete="off"
            />
            {saveError ? (
              <p className={tabStyles.lead} role="alert" style={{ color: 'var(--color-red)', margin: 0 }}>
                {saveError}
              </p>
            ) : null}
            <div>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </form>

          <p className={tabStyles.lead} style={{ marginTop: 28, fontSize: '0.92em', color: 'var(--color-gray)' }}>
            После сохранения пересчитываются начисления по всем заказам в статусе «Завершён» для согласованности с процентами.
          </p>
        </section>
      ) : null}
      {tab === 'payouts' ? (
        <section aria-labelledby="referrals-tab-payouts">
          <p id="referrals-tab-payouts" className={tabStyles.lead}>
            {leads.payouts}
          </p>
        </section>
      ) : null}
      {tab === 'reports' ? (
        <section aria-labelledby="referrals-tab-reports">
          <p id="referrals-tab-reports" className={tabStyles.lead}>
            {leads.reports}
          </p>
        </section>
      ) : null}
    </main>
  );
}

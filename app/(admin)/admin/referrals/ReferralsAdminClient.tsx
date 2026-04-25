'use client';

import { useState } from 'react';
import tabStyles from '../adminTabs.module.css';

type TabKey = 'percent' | 'payouts' | 'reports';

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
        <section aria-labelledby="referrals-tab-percent">
          <p id="referrals-tab-percent" className={tabStyles.lead}>
            {leads.percent}
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

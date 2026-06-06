'use client';

import { useState } from 'react';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import { AdminTabs, AdminTabsLead, AdminTabsPanel } from '@/components/AdminTabs/AdminTabs';
import { ReferralProgramProfilesPanel } from './ReferralProgramProfilesPanel';

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
    <AdminTabsPanel as="main">
      <h1 className={catalogStyles.title}>{title}</h1>
      <AdminTabs
        ariaLabel={title}
        items={[
          { id: 'percent' as const, label: labels.percent },
          { id: 'payouts' as const, label: labels.payouts },
          { id: 'reports' as const, label: labels.reports },
        ]}
        activeId={tab}
        onChange={setTab}
      />

      {tab === 'percent' ? (
        <section
          {...(leads.percent.trim()
            ? ({ 'aria-labelledby': 'referrals-tab-percent' } as const)
            : ({ 'aria-label': labels.percent } as const))}
        >
          {leads.percent.trim() ? (
            <AdminTabsLead id="referrals-tab-percent">{leads.percent}</AdminTabsLead>
          ) : null}

          <ReferralProgramProfilesPanel />
        </section>
      ) : null}
      {tab === 'payouts' ? (
        <section aria-labelledby="referrals-tab-payouts">
          <AdminTabsLead id="referrals-tab-payouts">{leads.payouts}</AdminTabsLead>
        </section>
      ) : null}
      {tab === 'reports' ? (
        <section aria-labelledby="referrals-tab-reports">
          <AdminTabsLead id="referrals-tab-reports">{leads.reports}</AdminTabsLead>
        </section>
      ) : null}
    </AdminTabsPanel>
  );
}

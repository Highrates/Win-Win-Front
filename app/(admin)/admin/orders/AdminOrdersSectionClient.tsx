'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { adminOrdersSectionStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminSidebarBadges } from '@/lib/adminSidebarBadgesContext';
import { OrdersAdminClient } from './OrdersAdminClient';
import { SourcingRequestsAdminClient } from './SourcingRequestsAdminClient';

type AdminOrdersSection = 'orders' | 'sourcing';

const SECTIONS: AdminOrdersSection[] = ['orders', 'sourcing'];

function sectionFromQuery(raw: string | null): AdminOrdersSection {
  return raw === 'sourcing' ? 'sourcing' : 'orders';
}

export function AdminOrdersSectionClient() {
  const { locale } = useAdminLocale();
  const sectionStr = adminOrdersSectionStrings(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pendingSourcingReview } = useAdminSidebarBadges();
  const [sectionIndex, setSectionIndex] = useState(() => {
    const i = SECTIONS.indexOf(sectionFromQuery(searchParams.get('section')));
    return i >= 0 ? i : 0;
  });

  useEffect(() => {
    setSectionIndex(() => {
      const i = SECTIONS.indexOf(sectionFromQuery(searchParams.get('section')));
      return i >= 0 ? i : 0;
    });
  }, [searchParams]);

  const onSelectSection = useCallback(
    (index: number) => {
      setSectionIndex(index);
      const section = SECTIONS[index] ?? 'orders';
      if (section === 'orders') {
        const bucket = searchParams.get('bucket');
        const q = bucket ? `?bucket=${encodeURIComponent(bucket)}` : '';
        router.replace(`/admin/orders${q}`, { scroll: false });
      } else {
        const bucket = searchParams.get('bucket') ?? 'new';
        router.replace(
          `/admin/orders?section=sourcing&bucket=${encodeURIComponent(bucket)}`,
          { scroll: false },
        );
      }
    },
    [router, searchParams],
  );

  const section = SECTIONS[sectionIndex] ?? 'orders';
  const sectionTabItems = useMemo(() => {
    const labels = [sectionStr.tabOrders, sectionStr.tabSourcing];
    return labels.map((label, index) => {
      const isSourcing = SECTIONS[index] === 'sourcing';
      const pending =
        isSourcing && pendingSourcingReview != null && pendingSourcingReview > 0
          ? pendingSourcingReview
          : 0;
      return {
        id: index,
        label: pending > 0 ? `${label} (${pending})` : label,
      };
    });
  }, [pendingSourcingReview, sectionStr.tabOrders, sectionStr.tabSourcing]);

  return (
    <>
      <AdminTabs
        variant="underline"
        ariaLabel={sectionStr.sectionsAria}
        items={sectionTabItems}
        activeId={sectionIndex}
        onChange={onSelectSection}
      />
      <div style={{ marginTop: 20 }}>
        {section === 'orders' ? <OrdersAdminClient embedded /> : <SourcingRequestsAdminClient embedded />}
      </div>
    </>
  );
}

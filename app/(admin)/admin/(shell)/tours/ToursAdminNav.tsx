'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { AdminNavBadge } from '@/components/admin/AdminNavBadge/AdminNavBadge';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { adminNavBadgeTitles } from '@/lib/admin-i18n/adminChromeI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminSidebarBadges } from '@/lib/adminSidebarBadgesContext';

const TAB_IDS = ['list', 'landing', 'applications', 'reviews'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_HREF: Record<TabId, string> = {
  list: '/admin/tours',
  landing: '/admin/tours/landing',
  applications: '/admin/tours/applications',
  reviews: '/admin/tours/reviews',
};

const TAB_LABEL: Record<TabId, string> = {
  list: 'Туры',
  landing: 'Лендинг',
  applications: 'Заявки',
  reviews: 'Отзывы',
};

function tabFromPathname(pathname: string): TabId {
  if (pathname.startsWith('/admin/tours/landing')) return 'landing';
  if (pathname.startsWith('/admin/tours/applications')) return 'applications';
  if (pathname.startsWith('/admin/tours/reviews')) return 'reviews';
  return 'list';
}

export function ToursAdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useAdminLocale();
  const badgeTitles = adminNavBadgeTitles(locale);
  const { pendingTourApplications, pendingTourReviews } = useAdminSidebarBadges();
  const activeId = tabFromPathname(pathname);
  const items = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        label: (
          <>
            {TAB_LABEL[id]}
            {id === 'applications' ? (
              <AdminNavBadge
                count={pendingTourApplications ?? 0}
                title={badgeTitles.tourApplicationsPending}
              />
            ) : null}
            {id === 'reviews' ? (
              <AdminNavBadge
                count={pendingTourReviews ?? 0}
                title={badgeTitles.tourReviewsPending}
                variant="bracket"
              />
            ) : null}
          </>
        ),
      })),
    [badgeTitles.tourApplicationsPending, badgeTitles.tourReviewsPending, pendingTourApplications, pendingTourReviews],
  );

  return (
    <AdminTabs
      compact
      variant="underline"
      ariaLabel="Разделы туров"
      items={items}
      activeId={activeId}
      onChange={(id) => {
        const href = TAB_HREF[id];
        if (href && href !== pathname) router.push(href);
      }}
    />
  );
}

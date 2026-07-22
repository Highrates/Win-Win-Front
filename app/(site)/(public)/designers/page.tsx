import Link from 'next/link';
import { Fragment, Suspense } from 'react';
import type { Metadata } from 'next';
import { getServerApiBase } from '@/lib/serverApiBase';
import { fetchPublicSiteSettings } from '@/lib/siteSettingsPublic';
import { DesignersSearchBox } from './DesignersSearchBox';
import { DesignersMarketClient } from './DesignersMarketClient';
import { DESIGNERS_PER_PAGE } from './designersListConstants';
import styles from './DesignersPage.module.css';

type ListItem = {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
  likesDisplayCount?: number;
  casesCount?: number;
};

async function fetchDesigners(
  page: number,
  limit: number,
  q?: string,
): Promise<{ items: ListItem[]; total: number }> {
  const base = getServerApiBase();
  try {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q?.trim()) qs.set('q', q.trim());
    const res = await fetch(`${base}/designers?${qs.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { items?: ListItem[]; total?: number };
    return { items: data.items ?? [], total: typeof data.total === 'number' ? data.total : 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export const metadata: Metadata = {
  title: 'Дизайнеры — Win-Win',
  description: 'Каталог дизайнеров Win-Win',
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DesignersPage({ searchParams }: Props) {
  const { q: qRaw } = await searchParams;
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';

  const [{ items, total }, siteSettings] = await Promise.all([
    fetchDesigners(1, DESIGNERS_PER_PAGE, q || undefined),
    fetchPublicSiteSettings(),
  ]);

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Дизайнеры', href: '', current: true },
  ];

  return (
    <main>
      <section className={styles.mainSection} aria-label="Дизайнеры">
        <div className="padding-global">
          <div className={styles.sectionInner}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              {breadcrumbs.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
                  {item.current ? (
                    <span className={styles.breadcrumbsCurrent}>{item.label}</span>
                  ) : (
                    <Link href={item.href} className={styles.breadcrumbsLink}>
                      {item.label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </nav>

            <DesignersSearchBox initialQuery={q} />

            <Suspense fallback={null}>
              <DesignersMarketClient
                initialItems={items}
                initialTotal={total}
                query={q}
                serviceOptions={siteSettings.designerServiceOptions}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

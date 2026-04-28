import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getServerApiBase } from '@/lib/serverApiBase';
import { DesignersSearchBox } from './DesignersSearchBox';
import styles from './DesignersPage.module.css';

const DESIGNERS_PER_PAGE = 48;

type ListItem = {
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.25 16.5L13.75 11L8.25 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function designersListHref(opts: { page?: number; q: string }): string {
  const sp = new URLSearchParams();
  if (opts.q.trim()) sp.set('q', opts.q.trim());
  if (opts.page && opts.page > 1) sp.set('page', String(opts.page));
  const qs = sp.toString();
  return qs ? `/designers?${qs}` : '/designers';
}

export const metadata: Metadata = {
  title: 'Дизайнеры — Win-Win',
  description: 'Каталог дизайнеров Win-Win',
};

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function DesignersPage({ searchParams }: Props) {
  const { page: pageParam, q: qRaw } = await searchParams;
  const requestedPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);
  const q = typeof qRaw === 'string' ? qRaw.trim() : '';

  const first = await fetchDesigners(requestedPage, DESIGNERS_PER_PAGE, q || undefined);
  const totalPages = Math.max(1, Math.ceil(first.total / DESIGNERS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);
  const { items, total } = page === requestedPage ? first : await fetchDesigners(page, DESIGNERS_PER_PAGE, q || undefined);
  const designersOnPage = items;

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

            <div className={styles.marketSectionRow}>
              <div className={styles.marketSectionRowLeft}>
                <div className={styles.marketCityGroup}>
                  <button type="button" aria-label="Выбор города">
                    <img
                      src="/icons/location.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                    <span>Москва</span>
                    <ArrowIcon className={styles.marketCityArrow} />
                  </button>
                </div>
                <div className={styles.marketFilterGroup}>
                  <button type="button" aria-label="Фильтр">
                    <img src="/icons/filter.svg" alt="" width={20} height={20} />
                    <span>Фильтр</span>
                  </button>
                </div>
              </div>
              <div className={styles.marketSectionRowResult}>
                <span className={styles.marketSectionRowResultLabel}>
                  Результат:{' '}
                </span>
                <span className={styles.marketSectionRowResultValue}>
                  {total}
                </span>
              </div>
            </div>

            <div className={styles.designersCardsWrapper}>
              {designersOnPage.map((designer) => {
                const avatar = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';
                return (
                <Link
                  key={designer.slug}
                  href={`/designers/${designer.slug}`}
                  className={styles.designerCard}
                >
                  <div className={styles.designerCardInner}>
                    <img
                      src={avatar}
                      alt=""
                      className={styles.designerCardAvatar}
                      width={132}
                      height={132}
                    />
                    <div className={styles.designerCardContent}>
                      <div className={styles.designerCardInfo}>
                        <span className={styles.designerCardName}>
                          {designer.displayName}
                        </span>
                        <span className={styles.designerCardServices}>
                          {designer.servicesLine ?? ''}
                        </span>
                        <span className={styles.designerCardCity}>
                          {designer.city ?? ''}
                        </span>
                      </div>
                      <div className={styles.interactWrapper}>
                        <div className={styles.interactItem}>
                          <img
                            src="/icons/collections.svg"
                            alt=""
                            width={20}
                            height={20}
                            className={styles.interactIcon}
                          />
                          <span className={styles.interactValue}>
                            0
                          </span>
                        </div>
                        <div className={styles.interactItem}>
                          <img
                            src="/icons/heart.svg"
                            alt=""
                            width={20}
                            height={20}
                            className={styles.interactIcon}
                          />
                          <span className={styles.interactValue}>
                            0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className={styles.designerCardArrow} />
                </Link>
                );
              })}
            </div>

            {total > DESIGNERS_PER_PAGE && (
              <nav className={styles.paginationWrapper} aria-label="Пагинация">
                {page <= 1 ? (
                  <span className={styles.paginationBtnDisabled}>НАЗАД</span>
                ) : (
                  <Link
                    href={designersListHref({ page: page - 1, q })}
                    className={styles.paginationBtn}
                  >
                    НАЗАД
                  </Link>
                )}
                <div className={styles.paginationPages}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) =>
                      n === page ? (
                        <span
                          key={n}
                          className={styles.paginationPageCurrent}
                        >
                          {n}
                        </span>
                      ) : (
                        <Link
                          key={n}
                          href={designersListHref({ page: n, q })}
                          className={styles.paginationPage}
                        >
                          {n}
                        </Link>
                      )
                  )}
                </div>
                {page >= totalPages ? (
                  <span className={styles.paginationBtnDisabled}>ДАЛЕЕ</span>
                ) : (
                  <Link
                    href={designersListHref({ page: page + 1, q })}
                    className={styles.paginationBtn}
                  >
                    ДАЛЕЕ
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

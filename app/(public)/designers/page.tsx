import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { DESIGNERS } from '@/lib/public/designers';
import styles from './DesignersPage.module.css';

const DESIGNERS_PER_PAGE = 48;

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

export const metadata: Metadata = {
  title: 'Дизайнеры — Win-Win',
  description: 'Каталог дизайнеров Win-Win',
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DesignersPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1);
  const totalPages = Math.ceil(DESIGNERS.length / DESIGNERS_PER_PAGE);
  const page = Math.min(currentPage, totalPages) || 1;
  const start = (page - 1) * DESIGNERS_PER_PAGE;
  const designersOnPage = DESIGNERS.slice(start, start + DESIGNERS_PER_PAGE);

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

            <div className={styles.searchBox}>
              <SearchBox placeholder="Поиск по дизайнерам" ariaLabel="Поиск по дизайнерам" />
            </div>

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
                  {DESIGNERS.length}
                </span>
              </div>
            </div>

            <div className={styles.designersCardsWrapper}>
              {designersOnPage.map((designer) => (
                <Link
                  key={designer.slug}
                  href={`/designers/${designer.slug}`}
                  className={styles.designerCard}
                >
                  <div className={styles.designerCardInner}>
                    <img
                      src="/images/placeholder.svg"
                      alt=""
                      className={styles.designerCardAvatar}
                      width={132}
                      height={132}
                    />
                    <div className={styles.designerCardContent}>
                      <div className={styles.designerCardInfo}>
                        <span className={styles.designerCardName}>
                          {designer.name}
                        </span>
                        <span className={styles.designerCardServices}>
                          {designer.services}
                        </span>
                        <span className={styles.designerCardCity}>
                          {designer.city}
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
                            {designer.collections}
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
                            {designer.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className={styles.designerCardArrow} />
                </Link>
              ))}
            </div>

            {DESIGNERS.length > DESIGNERS_PER_PAGE && (
              <nav className={styles.paginationWrapper} aria-label="Пагинация">
                {page <= 1 ? (
                  <span className={styles.paginationBtnDisabled}>НАЗАД</span>
                ) : (
                  <Link
                    href={page - 1 === 1 ? '/designers' : `/designers?page=${page - 1}`}
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
                          href={n === 1 ? '/designers' : `/designers?page=${n}`}
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
                    href={`/designers?page=${page + 1}`}
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

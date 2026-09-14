import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/brand';
import { getServerApiBase } from '@/lib/serverApiBase';
import { highlightSearchTitle } from '@/lib/searchHighlight';
import { SearchHashScroll } from './SearchHashScroll';
import { SearchPageForm, SearchRetryButton } from './SearchPageForm';
import styles from './SearchPage.module.css';

export const dynamic = 'force-dynamic';

type SearchHit = {
  id: string;
  title: string;
  href: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

type SearchGroup = {
  key: string;
  label: string;
  items: SearchHit[];
  total: number;
  hasMore: boolean;
};

type LoadResult = {
  q: string;
  groups: SearchGroup[];
  error: boolean;
};

async function loadSearch(q: string): Promise<LoadResult> {
  if (q.trim().length < 2) return { q, groups: [], error: false };
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/search?q=${encodeURIComponent(q)}&mode=full`,
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return { q, groups: [], error: true };
    const data = (await res.json()) as { q?: string; groups?: SearchGroup[] };
    return {
      q: typeof data.q === 'string' ? data.q : q,
      groups: Array.isArray(data.groups) ? data.groups : [],
      error: false,
    };
  } catch {
    return { q, groups: [], error: true };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q: raw } = await searchParams;
  const q = (raw ?? '').trim();
  if (!q) return { title: `Поиск — ${SITE_NAME}` };
  return { title: `«${q}» — поиск — ${SITE_NAME}` };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = (raw ?? '').trim().slice(0, 80);
  const { groups, error } = await loadSearch(q);
  const totalHits = groups.reduce((n, g) => n + g.items.length, 0);
  const showEmpty = q.length >= 2 && !error && totalHits === 0;

  return (
    <main className={styles.page}>
      <SearchHashScroll />
      <div className={`padding-global ${styles.inner}`}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Поиск</p>
          <h1 className={styles.title}>Поиск по сайту</h1>
          <SearchPageForm initialQ={q} />
          {q.length > 0 && q.length < 2 ? (
            <p className={styles.meta}>Введите минимум 2 символа</p>
          ) : null}
          {q.length >= 2 && !error ? (
            <p className={styles.meta}>
              {totalHits > 0
                ? `Найдено в ${groups.length} ${groups.length === 1 ? 'разделе' : 'разделах'}`
                : 'Ничего не найдено'}
            </p>
          ) : null}
          {q.length < 2 ? (
            <p className={styles.meta}>
              Ищите товары, категории, бренды, зоны, коллекции и статьи блога.
            </p>
          ) : null}
        </header>

        {error ? (
          <div className={styles.errorBox} role="alert">
            <p className={styles.meta}>Не удалось загрузить результаты</p>
            <div className={styles.emptyActions}>
              <SearchRetryButton />
              <Link href="/catalog" className={styles.textLink}>
                В каталог
              </Link>
            </div>
          </div>
        ) : null}

        {!error && q.length < 2 ? (
          <div className={styles.emptyActions}>
            <Link href="/catalog" className={styles.textLink}>
              Каталог
            </Link>
            <Link href="/brands" className={styles.textLink}>
              Бренды
            </Link>
            <Link href="/blog" className={styles.textLink}>
              Блог
            </Link>
          </div>
        ) : null}

        {showEmpty ? (
          <div className={styles.emptyActions}>
            <Link href="/catalog" className={styles.textLink}>
              В каталог
            </Link>
            <Link href="/brands" className={styles.textLink}>
              Бренды
            </Link>
            <Link href="/blog" className={styles.textLink}>
              Блог
            </Link>
          </div>
        ) : null}

        {!error ? (
          <div className={styles.groups}>
            {groups.map((group) => (
              <section
                key={group.key}
                id={`search-${group.key}`}
                className={styles.group}
                aria-labelledby={`search-heading-${group.key}`}
              >
                <div className={styles.groupHead}>
                  <h2 id={`search-heading-${group.key}`} className={styles.groupTitle}>
                    {group.label}
                  </h2>
                  <span className={styles.groupCount}>{group.total}</span>
                </div>
                <ul className={styles.list}>
                  {group.items.map((hit) => (
                    <li key={`${group.key}-${hit.id}`}>
                      <Link href={hit.href} className={styles.hit}>
                        {hit.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hit.imageUrl} alt="" className={styles.hitImg} />
                        ) : (
                          <span className={styles.hitPh} aria-hidden />
                        )}
                        <span className={styles.hitText}>
                          <span className={styles.hitTitle}>
                            {highlightSearchTitle(hit.title, q).map((part, i) =>
                              part.mark ? (
                                <mark key={i} className={styles.hitMark}>
                                  {part.text}
                                </mark>
                              ) : (
                                <span key={i}>{part.text}</span>
                              ),
                            )}
                          </span>
                          {hit.subtitle ? (
                            <span className={styles.hitSub}>{hit.subtitle}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

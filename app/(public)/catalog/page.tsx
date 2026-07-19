import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';

export const metadata: Metadata = {
  title: 'Каталог — Win-Win',
  description: 'Каталог мебели и предметов интерьера',
};

export default async function CatalogIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const roots = await fetchHomeCatalogRoots();

  if (roots.length === 0) {
    return (
      <main className="padding-global" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <p>Каталог пока пуст.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/">На главную</Link>
        </p>
      </main>
    );
  }

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string' && value.trim()) qs.set(key, value);
  }
  const query = qs.toString();

  redirect(`/catalog/${encodeURIComponent(roots[0].slug)}${query ? `?${query}` : ''}`);
}

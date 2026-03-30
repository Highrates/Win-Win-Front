import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchPublicRootCategoriesForNav } from '@/lib/catalogPublic';

export const metadata: Metadata = {
  title: 'Каталог — Win-Win',
  description: 'Каталог мебели и предметов интерьера',
};

export default async function CategoriesPage() {
  const roots = await fetchPublicRootCategoriesForNav();

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

  redirect(`/categories/${roots[0].slug}`);
}

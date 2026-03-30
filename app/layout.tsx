import type { Metadata } from 'next';
import './globals.css';
import { CatalogNavProvider } from '@/components/CatalogNavContext';
import { SiteChrome } from '@/components/SiteChrome/SiteChrome';
import { SiteTransitionProvider } from '@/components/SiteTransition';
import { ClientOnlyOverlays } from '@/components/ClientOnlyOverlays';
import { fetchPublicRootCategoriesForNav } from '@/lib/catalogPublic';

export const metadata: Metadata = {
  title: 'Win-Win — Каталог мебели для дизайнеров',
  description: 'Большой каталог мебели для дизайнеров интерьеров',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalogRoots = await fetchPublicRootCategoriesForNav();
  return (
    <html lang="ru">
      <body>
        <SiteTransitionProvider>
          <ClientOnlyOverlays />
          <CatalogNavProvider initialRoots={catalogRoots}>
            <SiteChrome>{children}</SiteChrome>
          </CatalogNavProvider>
        </SiteTransitionProvider>
      </body>
    </html>
  );
}

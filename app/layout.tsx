import type { Metadata } from 'next';
import './globals.css';
import { BrandsNavProvider } from '@/components/BrandsNavContext';
import { CatalogNavProvider } from '@/components/CatalogNavContext';
import { SiteChrome } from '@/components/SiteChrome/SiteChrome';
import { SiteTransitionProvider } from '@/components/SiteTransition';
import { ClientOnlyOverlays } from '@/components/ClientOnlyOverlays';
import { fetchPublicBrands, publicBrandsMenuSlice } from '@/lib/brandsPublic';
import { fetchPublicRootCategoriesForNav } from '@/lib/catalogPublic';

export const metadata: Metadata = {
  title: 'Win-Win — Каталог мебели для дизайнеров',
  description: 'Большой каталог мебели для дизайнеров интерьеров',
  icons: {
    icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalogRoots = await fetchPublicRootCategoriesForNav();
  const brandMenuItems = publicBrandsMenuSlice(await fetchPublicBrands(), 10);
  return (
    <html lang="ru">
      <body>
        <SiteTransitionProvider>
          <ClientOnlyOverlays />
          <CatalogNavProvider initialRoots={catalogRoots}>
            <BrandsNavProvider initialItems={brandMenuItems}>
              <SiteChrome>{children}</SiteChrome>
            </BrandsNavProvider>
          </CatalogNavProvider>
        </SiteTransitionProvider>
      </body>
    </html>
  );
}

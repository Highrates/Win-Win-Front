import { BrandsNavProvider } from '@/components/BrandsNavContext';
import { CatalogNavProvider } from '@/components/CatalogNavContext';
import { SiteChrome } from '@/components/SiteChrome/SiteChrome';
import { loadSiteNavData } from '@/lib/siteNav/loadSiteNavData';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { catalogRoots, brandMenuItems } = await loadSiteNavData();

  return (
    <CatalogNavProvider initialRoots={catalogRoots}>
      <BrandsNavProvider initialItems={brandMenuItems}>
        <SiteChrome>{children}</SiteChrome>
      </BrandsNavProvider>
    </CatalogNavProvider>
  );
}

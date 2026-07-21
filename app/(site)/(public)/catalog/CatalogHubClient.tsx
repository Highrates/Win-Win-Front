'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogHubTabs, type CatalogHubTabId } from './CatalogHubTabs';
import { CatalogZonesGrid, type CatalogHubGridItem } from './CatalogZonesGrid';
import { CatalogHubCollectionsLazy } from './CatalogHubCollectionsLazy';
import topFoldStyles from '@/sections/home/HomeTopFold.module.css';
import { Hero } from '@/sections/home';
import styles from './CatalogHubCollections.module.css';
import { parseCatalogHubTab } from '@/lib/catalog/parseCatalogHubTab';

const CATEGORIES_COPY =
  'В 588est в каталог попадают только изделия, которые мы и наши дизайнеры отобрали и проверили сами: качество материалов, фабрики и то, как вещь живёт в интерьере.';

const ZONES_COPY =
  'В 588est каталог собран по сценариям жизни — гостиная, спальня, кабинет, сад. Выберите зону, чтобы увидеть мебель и свет под конкретный интерьер.';

export { parseCatalogHubTab } from '@/lib/catalog/parseCatalogHubTab';

function readHubTabFromLocation(): CatalogHubTabId {
  if (typeof window === 'undefined') return 'categories';
  return parseCatalogHubTab(new URL(window.location.href).searchParams.get('tab'));
}

function writeHubTabToHistory(tab: CatalogHubTabId, replace: boolean) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (tab === 'categories') url.searchParams.delete('tab');
  else url.searchParams.set('tab', tab);
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState(window.history.state, '', next);
  else window.history.pushState(window.history.state, '', next);
}

type Props = {
  heroImageSrc: string;
  categoryItems: CatalogHubGridItem[];
  zoneItems: CatalogHubGridItem[];
  initialTab?: CatalogHubTabId;
};

export function CatalogHubClient({
  heroImageSrc,
  categoryItems,
  zoneItems,
  initialTab = 'categories',
}: Props) {
  const [activeTab, setActiveTab] = useState<CatalogHubTabId>(initialTab);
  const [collectionsVisited, setCollectionsVisited] = useState(
    () => initialTab === 'collections',
  );

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab === 'collections') setCollectionsVisited(true);
  }, [initialTab]);

  useEffect(() => {
    const onPop = () => {
      const tab = readHubTabFromLocation();
      setActiveTab(tab);
      if (tab === 'collections') setCollectionsVisited(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const onTabChange = useCallback((id: CatalogHubTabId) => {
    setActiveTab(id);
    if (id === 'collections') setCollectionsVisited(true);
    writeHubTabToHistory(id, false);
  }, []);

  const collectionsPanel = useMemo(() => {
    if (!collectionsVisited) return null;
    return (
      <section className={styles.collections} aria-label="Коллекции и наборы">
        <CatalogHubCollectionsLazy />
      </section>
    );
  }, [collectionsVisited]);

  return (
    <>
      <div className={`${topFoldStyles.topFold} ${topFoldStyles.topFoldCompact}`}>
        <Hero imageUrl={heroImageSrc} fillFold />
        <CatalogHubTabs activeTab={activeTab} onTabChange={onTabChange} fillFold />
      </div>
      <div id="catalog-hub-panel" role="tabpanel" aria-labelledby={`catalog-hub-tab-${activeTab}`}>
        {activeTab === 'categories' ? (
          <CatalogZonesGrid
            items={categoryItems}
            introCopy={CATEGORIES_COPY}
            ariaLabel="Категории"
            emptyLabel="Категории пока не настроены."
          />
        ) : activeTab === 'zones' ? (
          <CatalogZonesGrid
            items={zoneItems}
            introCopy={ZONES_COPY}
            ariaLabel="Зоны"
            emptyLabel="Зоны пока не настроены."
          />
        ) : (
          collectionsPanel ?? (
            <section className={styles.collections} aria-label="Коллекции и наборы">
              <div className="padding-global">
                <p className={styles.empty}>Загрузка коллекций…</p>
              </div>
            </section>
          )
        )}
      </div>
    </>
  );
}

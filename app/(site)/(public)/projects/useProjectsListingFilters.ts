'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ProjectsSourceChip } from './ProjectsRoomFilter';
import {
  chipsFromFeedSource,
  nextProjectsSearchWithSource,
  type ProjectsFeedSourceParam,
} from '@/lib/projectsListingUrl';

const ALL_SPACES_LABEL = 'Все';

export type ProjectsListingFilterArgs = {
  brandFilter?: { slug: string; label: string } | null;
  productBrandFilter?: { slug: string; label: string } | null;
  initialSource?: 'all' | 'designers' | 'brands';
  initialRooms?: string[];
};

function sourceFromChips(
  sources: Record<ProjectsSourceChip, boolean>,
  brandOnly: boolean,
  forcedSource?: 'all' | 'designers' | 'brands',
): 'all' | 'designers' | 'brands' {
  if (forcedSource === 'designers' || forcedSource === 'brands') return forcedSource;
  if (brandOnly) return 'brands';
  if (sources.designers && sources.brands) return 'all';
  if (sources.brands) return 'brands';
  return 'designers';
}

function initialChips(args: {
  brandOnly: boolean;
  productBrandOnly: boolean;
  initialSource?: ProjectsFeedSourceParam;
}): Record<ProjectsSourceChip, boolean> {
  if (args.brandOnly) return { designers: false, brands: true };
  if (args.productBrandOnly) return { designers: true, brands: false };
  if (args.initialSource) return chipsFromFeedSource(args.initialSource);
  return { designers: true, brands: true };
}

/** Единый стейт фильтров витрины `/projects` (комнаты, источники, «с товарами»). */
export function useProjectsListingFilters({
  brandFilter,
  productBrandFilter,
  initialSource,
  initialRooms = [],
}: ProjectsListingFilterArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Forced только query-фильтрами, не `?source=` (иначе toggle не пишет URL). */
  const brandOnly = Boolean(brandFilter);
  const productBrandOnly = Boolean(productBrandFilter);
  const [activeRoom, setActiveRoom] = useState(ALL_SPACES_LABEL);
  const [withProducts, setWithProducts] = useState(false);
  const [sources, setSources] = useState<Record<ProjectsSourceChip, boolean>>(() =>
    initialChips({ brandOnly, productBrandOnly, initialSource }),
  );
  const [rooms, setRooms] = useState<string[]>(initialRooms);

  const bothSourcesOff = !brandOnly && !productBrandOnly && !sources.designers && !sources.brands;
  const feedSource = sourceFromChips(
    sources,
    brandOnly,
    productBrandOnly ? 'designers' : brandOnly ? 'brands' : undefined,
  );

  const roomChips = useMemo(
    () => [ALL_SPACES_LABEL, ...rooms.filter((r) => r.trim() && r !== ALL_SPACES_LABEL)],
    [rooms],
  );

  useEffect(() => {
    if (activeRoom !== ALL_SPACES_LABEL && !rooms.includes(activeRoom)) {
      setActiveRoom(ALL_SPACES_LABEL);
    }
  }, [rooms, activeRoom]);

  const writeSourceToUrl = useCallback(
    (nextSources: Record<ProjectsSourceChip, boolean>) => {
      if (pathname !== '/projects') return;
      if (brandOnly || productBrandOnly) return;
      const nextSearch = nextProjectsSearchWithSource(searchParams.toString(), nextSources);
      if (nextSearch == null) return;
      router.replace(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
    },
    [brandOnly, pathname, productBrandOnly, router, searchParams],
  );

  const onSourceToggle = useCallback(
    (source: ProjectsSourceChip) => {
      setSources((prev) => {
        const next = { ...prev, [source]: !prev[source] };
        writeSourceToUrl(next);
        return next;
      });
    },
    [writeSourceToUrl],
  );

  const onFeedRooms = useCallback((next: string[]) => {
    setRooms(next);
  }, []);

  return {
    ALL_SPACES_LABEL,
    activeRoom,
    setActiveRoom,
    withProducts,
    setWithProducts,
    sources,
    onSourceToggle,
    rooms,
    onFeedRooms,
    roomChips,
    bothSourcesOff,
    feedSource,
    brandOnly,
    designersOnly: productBrandOnly,
  };
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
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

function resolveInitialSource(args: {
  brandOnly: boolean;
  productBrandOnly: boolean;
  initialSource?: ProjectsFeedSourceParam;
}): ProjectsFeedSourceParam {
  if (args.brandOnly) return 'brands';
  if (args.productBrandOnly) return 'designers';
  if (args.initialSource === 'designers' || args.initialSource === 'brands') {
    return args.initialSource;
  }
  return 'all';
}

/** Единый стейт фильтров витрины `/projects` (комнаты, источник, «с товарами»). */
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
  const sourceLocked = brandOnly || productBrandOnly;

  const [activeRoom, setActiveRoom] = useState(ALL_SPACES_LABEL);
  const [withProducts, setWithProducts] = useState(false);
  const [source, setSource] = useState<ProjectsFeedSourceParam>(() =>
    resolveInitialSource({ brandOnly, productBrandOnly, initialSource }),
  );
  const [rooms, setRooms] = useState<string[]>(initialRooms);

  const feedSource: ProjectsFeedSourceParam = productBrandOnly
    ? 'designers'
    : brandOnly
      ? 'brands'
      : source;

  const roomChips = useMemo(
    () => [ALL_SPACES_LABEL, ...rooms.filter((r) => r.trim() && r !== ALL_SPACES_LABEL)],
    [rooms],
  );

  useEffect(() => {
    if (activeRoom !== ALL_SPACES_LABEL && !rooms.includes(activeRoom)) {
      setActiveRoom(ALL_SPACES_LABEL);
    }
  }, [rooms, activeRoom]);

  const onSourceChange = useCallback(
    (next: ProjectsFeedSourceParam) => {
      if (sourceLocked) return;
      setSource(next);
      if (pathname !== '/projects') return;
      const nextSearch = nextProjectsSearchWithSource(searchParams.toString(), next);
      if (nextSearch == null) return;
      router.replace(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, sourceLocked],
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
    source: feedSource,
    onSourceChange,
    sourceLocked,
    rooms,
    onFeedRooms,
    roomChips,
    feedSource,
    brandOnly,
    designersOnly: productBrandOnly,
  };
}

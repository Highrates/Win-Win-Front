import { useCallback, useEffect, useState } from 'react';
import type { DesignerProjectSummaryApi } from '@/lib/designerProjects/apiTypes';
import { fetchDesignerProjectList } from '@/lib/designerProjects/clientApi';
import { migrateLocalDesignerProjectsOnce } from '../migrateLocalDesignerProjects';

/** Список проектов: миграция из localStorage + один запрос списка (или переиспользование ответа из миграции). */
export function useDesignerProjectsBootstrap() {
  const [summaries, setSummaries] = useState<DesignerProjectSummaryApi[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  /** После первого завершения цепочки миграция/refresh — чтобы не показывать пустое состояние до ответа API. */
  const [listReady, setListReady] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchDesignerProjectList();
      setSummaries(data.projects);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Ошибка загрузки');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await migrateLocalDesignerProjectsOnce();
        if (cancelled) return;
        if (data) {
          setSummaries(data.projects);
          setLoadErr(null);
        } else {
          await refreshList();
        }
      } finally {
        if (!cancelled) setListReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshList]);

  return { summaries, loadErr, refreshList, listReady };
}

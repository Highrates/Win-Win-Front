import { useEffect, useRef, useState } from 'react';
import type { DesignerProjectDetailApi } from '@/lib/designerProjects/apiTypes';
import { fetchDesignerProjectDetail } from '@/lib/designerProjects/clientApi';

export type UseDesignerProjectDetailOptions = {
  /** Вызывается при ошибке загрузки детали (один раз на неудачный запрос). Колбэк в ref, чтобы не менять число запросов при смене ссылки на функцию. */
  onDetailError?: (message: string) => void;
};

export function useDesignerProjectDetail(
  projectId: string | null,
  options?: UseDesignerProjectDetailOptions,
) {
  const [detail, setDetail] = useState<DesignerProjectDetailApi | null>(null);
  const onDetailErrorRef = useRef(options?.onDetailError);
  onDetailErrorRef.current = options?.onDetailError;

  useEffect(() => {
    if (!projectId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const d = await fetchDesignerProjectDetail(projectId);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) {
          setDetail(null);
          const msg =
            e instanceof Error
              ? e.message
              : 'Не удалось загрузить проект. Попробуйте обновить страницу.';
          onDetailErrorRef.current?.(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { detail, setDetail };
}

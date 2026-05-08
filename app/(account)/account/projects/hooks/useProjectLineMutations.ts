import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { DesignerProjectDetailApi, DesignerProjectSummaryApi } from '@/lib/designerProjects/apiTypes';
import { updateDesignerProject } from '@/lib/designerProjects/clientApi';
import { detailToSavePayload } from '@/lib/designerProjects/payload';
import { displayLineQuantity } from '../accountProjectsFormat';

type Args = {
  detail: DesignerProjectDetailApi | null;
  setDetail: Dispatch<SetStateAction<DesignerProjectDetailApi | null>>;
  activeSummary: DesignerProjectSummaryApi | null;
  refreshList: () => Promise<void>;
  /** После успешного удаления строк (очистка мультивыбора в UI). */
  onRemovedLines?: (removedIds: string[]) => void;
  onMutationError?: (message: string) => void;
};

export function useProjectLineMutations({
  detail,
  setDetail,
  activeSummary,
  refreshList,
  onRemovedLines,
  onMutationError,
}: Args) {
  const removeLinesByIds = useCallback(
    async (ids: string[]) => {
      if (!detail || !activeSummary || ids.length === 0) return;
      const idSet = new Set(ids);
      const nextLines = detail.lines.filter((l) => !idSet.has(l.id));
      const patched: DesignerProjectDetailApi = { ...detail, lines: nextLines };
      const payload = detailToSavePayload(patched);
      try {
        const d = await updateDesignerProject(activeSummary.id, payload);
        setDetail(d);
        void refreshList();
        onRemovedLines?.(ids);
      } catch (e) {
        onMutationError?.(
          e instanceof Error ? e.message : 'Не удалось удалить позиции. Проверьте соединение и попробуйте снова.',
        );
      }
    },
    [detail, activeSummary, setDetail, refreshList, onRemovedLines, onMutationError],
  );

  const confirmRemoveLines = useCallback(
    (ids: string[]) => {
      const uniq = Array.from(new Set(ids)).filter(Boolean);
      if (uniq.length === 0) return;
      const ok =
        uniq.length === 1
          ? window.confirm('Удалить эту позицию из проекта?')
          : window.confirm(`Удалить ${uniq.length} позиций из проекта?`);
      if (!ok) return;
      void removeLinesByIds(uniq);
    },
    [removeLinesByIds],
  );

  const confirmRemoveSingleLine = useCallback(
    (lineId: string) => {
      confirmRemoveLines([lineId]);
    },
    [confirmRemoveLines],
  );

  const updateQuantity = useCallback(
    async (lineId: string, delta: number) => {
      if (!detail || !activeSummary) return;
      const line = detail.lines.find((l) => l.id === lineId);
      if (!line) return;
      const unitLower = (line.unit || 'шт').toLowerCase();
      const isPiece = unitLower === 'шт' || unitLower === 'шт.';

      if (delta < 0 && isPiece) {
        const n = displayLineQuantity(line.quantity, line.unit);
        if (n <= 1) {
          confirmRemoveLines([lineId]);
          return;
        }
      }

      const nextLines = detail.lines.map((l) => {
        if (l.id !== lineId) return l;
        if (isPiece) {
          const n = displayLineQuantity(l.quantity, l.unit);
          const nextQty = delta > 0 ? n + 1 : Math.max(1, n - 1);
          return { ...l, quantity: nextQty };
        }
        const q = Math.max(0.001, Number(l.quantity) + delta);
        return { ...l, quantity: q };
      });
      const patched: DesignerProjectDetailApi = { ...detail, lines: nextLines };
      const payload = detailToSavePayload(patched);
      try {
        const d = await updateDesignerProject(activeSummary.id, payload);
        setDetail(d);
        void refreshList();
      } catch (e) {
        onMutationError?.(
          e instanceof Error ? e.message : 'Не удалось сохранить количество. Попробуйте снова.',
        );
      }
    },
    [detail, activeSummary, setDetail, refreshList, confirmRemoveLines, onMutationError],
  );

  return {
    removeLinesByIds,
    confirmRemoveLines,
    confirmRemoveSingleLine,
    updateQuantity,
  };
}

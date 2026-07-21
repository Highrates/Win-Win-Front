import { useMemo } from 'react';
import type { DesignerProjectDetailApi, DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';
import { formatTotalRub } from '../accountProjectsFormat';

export type ProjectSectionTabDef = { id: string; label: string };

export function useProjectLinesDerived(detail: DesignerProjectDetailApi | null, sectionTab: string) {
  const sectionTabs = useMemo<ProjectSectionTabDef[]>(() => {
    const all = { id: 'all' as const, label: 'Все' };
    if (!detail?.lines.length) return [all];
    const map = new Map<string, string>();
    for (const l of detail.lines) {
      const id = l.categoryId ?? '__none__';
      const label = l.categoryLabel ?? 'Без категории';
      map.set(id, label);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'ru'));
    return [all, ...sorted.map(([id, label]) => ({ id, label }))];
  }, [detail]);

  const visibleLines = useMemo<DesignerProjectLineApi[]>(() => {
    if (!detail) return [];
    if (sectionTab === 'all') return detail.lines;
    if (sectionTab === '__none__') return detail.lines.filter((l) => !l.categoryId);
    return detail.lines.filter((l) => l.categoryId === sectionTab);
  }, [detail, sectionTab]);

  /** Сумма по всему проекту (не только по вкладке раздела). */
  const projectTotalRub = useMemo(() => {
    if (!detail?.lines.length) return null;
    const sum = detail.lines.reduce((a, l) => a + (l.lineTotalRub ?? 0), 0);
    return sum > 0 ? sum : null;
  }, [detail]);

  const displayTotal = formatTotalRub(projectTotalRub);
  /** Для блока «Общая сумма» — число позиций во всём проекте */
  const itemCount = detail?.lines.length ?? 0;

  return {
    sectionTabs,
    visibleLines,
    displayTotal,
    itemCount,
    projectTotalRub,
  };
}

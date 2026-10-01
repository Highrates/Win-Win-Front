'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import type { TeamBranchCard } from '@/lib/winWinTeam';
import {
  defaultCustomRangeYmd,
  filterPartnerLinesByPeriod,
  partnerPeriodForPreset,
  partnerPeriodFromInclusiveYmd,
  type PartnerReportPeriod,
  type PartnerReportRangePreset,
} from '@/lib/account/partnerReportPeriod';
import { downloadPartnerTeamPdf } from '@/lib/account/exportPartnerTeamPdf';
import {
  filterCompletedPartnerLines,
  filterReferralL1Lines,
  formatPartnerRubWhole,
  partnerLinePurchaserLabel,
  sumPartnerLinesBonusRub,
  type PartnerProgramSummaryApi,
} from '@/lib/referrals/partnerProgramSummary';
import { toDateInputValue } from '@/lib/adminDashboard/dashboardPeriod';
import report from '@/components/styles/PartnerReportTable.module.css';
import { PartnerIncomeTables } from './PartnerIncomeTables';
import { TeamPeriodToolbar } from './TeamPeriodToolbar';
import { TeamTree } from './TeamTree';

const DASH = '—';

type L2LevelFilter = 'all' | 1 | 2;

export function TeamSheetSection({
  branchCards,
  searchActive = false,
  partnerSummary,
  partnerIncomeLoading = false,
  partnerIncomeError = null,
  onRetryPartnerIncome,
}: {
  branchCards: TeamBranchCard[];
  searchActive?: boolean;
  partnerSummary: PartnerProgramSummaryApi | null;
  partnerIncomeLoading?: boolean;
  partnerIncomeError?: string | null;
  onRetryPartnerIncome?: () => void;
}) {
  const [rangeIndex, setRangeIndex] = useState(0);
  const [period, setPeriod] = useState<PartnerReportPeriod>(() => partnerPeriodForPreset(0));
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => defaultCustomRangeYmd().fromYmd);
  const [draftTo, setDraftTo] = useState(() => defaultCustomRangeYmd().toYmd);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [designerFilterId, setDesignerFilterId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<L2LevelFilter>('all');
  const [designerMenuOpen, setDesignerMenuOpen] = useState(false);
  const [levelMenuOpen, setLevelMenuOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);
  const designerMenuRef = useRef<HTMLDivElement>(null);
  const levelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!periodMenuOpen && !designerMenuOpen && !levelMenuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (periodMenuOpen && periodMenuRef.current && !periodMenuRef.current.contains(t)) {
        setPeriodMenuOpen(false);
      }
      if (designerMenuOpen && designerMenuRef.current && !designerMenuRef.current.contains(t)) {
        setDesignerMenuOpen(false);
      }
      if (levelMenuOpen && levelMenuRef.current && !levelMenuRef.current.contains(t)) {
        setLevelMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPeriodMenuOpen(false);
      setDesignerMenuOpen(false);
      setLevelMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [periodMenuOpen, designerMenuOpen, levelMenuOpen]);

  const selectPreset = (index: number) => {
    const preset = Math.min(3, Math.max(0, index)) as PartnerReportRangePreset;
    const next = partnerPeriodForPreset(preset);
    setRangeIndex(preset);
    setPeriod(next);
    setDraftFrom(toDateInputValue(next.from));
    setDraftTo(toDateInputValue(new Date(next.toExclusive.getTime() - 1)));
    setPeriodMenuOpen(false);
    setExportError(null);
  };

  const applyCustomRange = () => {
    const next = partnerPeriodFromInclusiveYmd(draftFrom, draftTo);
    if (!next) return;
    setPeriod(next);
    setRangeIndex(-1);
    setPeriodMenuOpen(false);
    setExportError(null);
  };

  const l1All = useMemo(
    () => filterReferralL1Lines(partnerSummary?.personalLines ?? []),
    [partnerSummary?.personalLines],
  );
  const l2All = useMemo(
    () => filterCompletedPartnerLines(partnerSummary?.teamLines ?? []),
    [partnerSummary?.teamLines],
  );

  const l1Rows = useMemo(() => filterPartnerLinesByPeriod(l1All, period), [l1All, period]);
  const teamInPeriod = useMemo(() => filterPartnerLinesByPeriod(l2All, period), [l2All, period]);

  const designerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of teamInPeriod) {
      if (map.has(row.purchaserUserId)) continue;
      map.set(row.purchaserUserId, partnerLinePurchaserLabel(row));
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [teamInPeriod]);

  useEffect(() => {
    if (designerFilterId && !designerOptions.some((o) => o.id === designerFilterId)) {
      setDesignerFilterId(null);
    }
  }, [designerFilterId, designerOptions]);

  const teamRows = useMemo(() => {
    let rows = teamInPeriod;
    if (designerFilterId) {
      rows = rows.filter((r) => r.purchaserUserId === designerFilterId);
    }
    if (levelFilter !== 'all') {
      rows = rows.filter((r) => r.tier === levelFilter);
    }
    return rows;
  }, [teamInPeriod, designerFilterId, levelFilter]);

  const l1IncomeTotalLabel =
    partnerIncomeLoading && !partnerSummary
      ? '…'
      : partnerSummary
        ? formatPartnerRubWhole(sumPartnerLinesBonusRub(l1Rows))
        : DASH;

  const teamIncomeTotalLabel =
    partnerIncomeLoading && !partnerSummary
      ? '…'
      : partnerSummary
        ? formatPartnerRubWhole(sumPartnerLinesBonusRub(teamRows))
        : DASH;

  const designerFilterLabel = designerFilterId
    ? (designerOptions.find((o) => o.id === designerFilterId)?.name ?? 'По дизайнеру')
    : 'По дизайнеру';
  const levelFilterLabel =
    levelFilter === 'all' ? 'По уровню' : levelFilter === 1 ? 'Уровень L1' : 'Уровень L2';

  const onExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      await downloadPartnerTeamPdf({
        period,
        l1Lines: l1Rows,
        l2Lines: teamRows,
      });
    } catch {
      setExportError('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={report.sheetWrapper}>
      {partnerIncomeError ? (
        <AccountErrorState message={partnerIncomeError} onRetry={onRetryPartnerIncome} />
      ) : (
        <>
          {partnerSummary?.linesMayBeIncomplete ? (
            <p className={report.linesIncompleteHint} role="status">
              Показаны недавние начисления (до 120 заказов). Полная история может быть больше.
            </p>
          ) : null}
          <TeamPeriodToolbar
            periodLabel={period.label}
            periodMenuOpen={periodMenuOpen}
            periodMenuRef={periodMenuRef}
            draftFrom={draftFrom}
            draftTo={draftTo}
            onDraftFromChange={setDraftFrom}
            onDraftToChange={setDraftTo}
            onTogglePeriodMenu={() => {
              if (periodMenuOpen) {
                setPeriodMenuOpen(false);
                return;
              }
              setDraftFrom(toDateInputValue(period.from));
              setDraftTo(toDateInputValue(new Date(period.toExclusive.getTime() - 1)));
              setPeriodMenuOpen(true);
            }}
            onApplyCustomRange={applyCustomRange}
            rangeIndex={rangeIndex}
            onSelectPreset={selectPreset}
            onExportPdf={() => void onExportPdf()}
            exporting={exporting}
            exportDisabled={partnerIncomeLoading}
            exportError={exportError}
          />
          <PartnerIncomeTables
            l1Rows={l1Rows}
            teamRows={teamRows}
            l1IncomeTotalLabel={l1IncomeTotalLabel}
            teamIncomeTotalLabel={teamIncomeTotalLabel}
            partnerIncomeLoading={partnerIncomeLoading}
            designerFilterId={designerFilterId}
            designerFilterLabel={designerFilterLabel}
            designerOptions={designerOptions}
            designerMenuOpen={designerMenuOpen}
            designerMenuRef={designerMenuRef}
            onToggleDesignerMenu={() => {
              setDesignerMenuOpen((o) => !o);
              setLevelMenuOpen(false);
            }}
            onSelectDesigner={(id) => {
              setDesignerFilterId(id);
              setDesignerMenuOpen(false);
            }}
            levelFilter={levelFilter}
            levelFilterLabel={levelFilterLabel}
            levelMenuOpen={levelMenuOpen}
            levelMenuRef={levelMenuRef}
            onToggleLevelMenu={() => {
              setLevelMenuOpen((o) => !o);
              setDesignerMenuOpen(false);
            }}
            onSelectLevel={(level) => {
              setLevelFilter(level);
              setLevelMenuOpen(false);
            }}
          />
        </>
      )}

      <TeamTree branchCards={branchCards} searchActive={searchActive} />
    </div>
  );
}

'use client';

import { useRef, type RefObject } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import { PARTNER_REPORT_RANGE_TABS, partnerPeriodFromInclusiveYmd } from '@/lib/account/partnerReportPeriod';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import report from '@/components/styles/PartnerReportTable.module.css';

type Props = {
  periodLabel: string;
  periodMenuOpen: boolean;
  periodMenuRef: RefObject<HTMLDivElement | null>;
  draftFrom: string;
  draftTo: string;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onTogglePeriodMenu: () => void;
  onApplyCustomRange: () => void;
  rangeIndex: number;
  onSelectPreset: (index: number) => void;
  onExportPdf: () => void;
  exporting: boolean;
  exportDisabled: boolean;
  exportError: string | null;
};

export function TeamPeriodToolbar({
  periodLabel,
  periodMenuOpen,
  periodMenuRef,
  draftFrom,
  draftTo,
  onDraftFromChange,
  onDraftToChange,
  onTogglePeriodMenu,
  onApplyCustomRange,
  rangeIndex,
  onSelectPreset,
  onExportPdf,
  exporting,
  exportDisabled,
  exportError,
}: Props) {
  const periodPopoverRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(periodMenuOpen, periodPopoverRef);

  return (
    <div className={report.sheetToolbar}>
      <div className={report.toolbarRowPrimary}>
        <div className={report.toolbarLeft}>
          <div className={report.periodChipWrap} ref={periodMenuRef}>
            <TBtn
              type="button"
              aria-label="Выбрать период"
              aria-expanded={periodMenuOpen}
              aria-haspopup="dialog"
              trailingChevronDown
              onClick={onTogglePeriodMenu}
            >
              {periodLabel}
            </TBtn>
            {periodMenuOpen ? (
              <div
                ref={periodPopoverRef}
                className={report.periodPopover}
                role="dialog"
                aria-label="Произвольный период"
                tabIndex={-1}
              >
                <label className={report.periodDateField}>
                  <span className={report.periodDateLabel}>С</span>
                  <input
                    className={report.periodDateInput}
                    type="date"
                    value={draftFrom}
                    max={draftTo}
                    onChange={(e) => onDraftFromChange(e.target.value)}
                  />
                </label>
                <label className={report.periodDateField}>
                  <span className={report.periodDateLabel}>По</span>
                  <input
                    className={report.periodDateInput}
                    type="date"
                    value={draftTo}
                    min={draftFrom}
                    onChange={(e) => onDraftToChange(e.target.value)}
                  />
                </label>
                <TBtn
                  type="button"
                  onClick={onApplyCustomRange}
                  disabled={!partnerPeriodFromInclusiveYmd(draftFrom, draftTo)}
                >
                  Применить
                </TBtn>
              </div>
            ) : null}
          </div>
          <AccountProjectTabs
            projects={PARTNER_REPORT_RANGE_TABS}
            selectedIndex={rangeIndex}
            onSelect={onSelectPreset}
            ariaLabel="Период отчёта"
            mode="toggle"
          />
        </div>
        <TBtn type="button" onClick={onExportPdf} disabled={exportDisabled || exporting}>
          {exporting ? 'Формируем PDF…' : 'Экспортировать PDF'}
        </TBtn>
      </div>
      {exportError ? (
        <p className={report.exportError} role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}

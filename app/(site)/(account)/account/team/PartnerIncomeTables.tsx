'use client';

import type { Ref } from 'react';
import { TBtn } from '@/components/TBtn/TBtn';
import {
  formatPartnerRubWhole,
  formatPartnerTableDate,
  partnerLineOrderLabel,
  partnerLinePurchaserLabel,
  type PartnerProgramBonusLineApi,
} from '@/lib/referrals/partnerProgramSummary';
import report from '@/components/styles/PartnerReportTable.module.css';

type L2LevelFilter = 'all' | 1 | 2;

function teamLineKey(line: PartnerProgramBonusLineApi): string {
  return `${line.orderId}-${line.orderUpdatedAt}-${line.tier}-${line.bonusRub}`;
}

type DesignerOption = { id: string; name: string };

type Props = {
  l1Rows: PartnerProgramBonusLineApi[];
  teamRows: PartnerProgramBonusLineApi[];
  l1IncomeTotalLabel: string;
  teamIncomeTotalLabel: string;
  partnerIncomeLoading: boolean;
  designerFilterId: string | null;
  designerFilterLabel: string;
  designerOptions: DesignerOption[];
  designerMenuOpen: boolean;
  designerMenuRef: Ref<HTMLDivElement>;
  onToggleDesignerMenu: () => void;
  onSelectDesigner: (id: string | null) => void;
  levelFilter: L2LevelFilter;
  levelFilterLabel: string;
  levelMenuOpen: boolean;
  levelMenuRef: Ref<HTMLDivElement>;
  onToggleLevelMenu: () => void;
  onSelectLevel: (level: L2LevelFilter) => void;
};

export function PartnerIncomeTables({
  l1Rows,
  teamRows,
  l1IncomeTotalLabel,
  teamIncomeTotalLabel,
  partnerIncomeLoading,
  designerFilterId,
  designerFilterLabel,
  designerOptions,
  designerMenuOpen,
  designerMenuRef,
  onToggleDesignerMenu,
  onSelectDesigner,
  levelFilter,
  levelFilterLabel,
  levelMenuOpen,
  levelMenuRef,
  onToggleLevelMenu,
  onSelectLevel,
}: Props) {
  return (
    <>
      <div className={report.tableFrame}>
        <div className={report.tableSummary}>
          <div className={report.tableSummaryLeft}>
            <span className={report.tableSummaryLabel}>Доход от прямых рефералов (L1):</span>
            <span className={report.tableSummaryAmount}>{l1IncomeTotalLabel}</span>
          </div>
        </div>

        <table className={report.table}>
          <thead>
            <tr>
              <th scope="col" className={report.thLeftTight}>
                Дата
              </th>
              <th scope="col" className={report.thDesigner}>
                № заказа
              </th>
              <th scope="col" className={report.thRightTightFirst}>
                Оборот
              </th>
              <th scope="col" className={report.thCenterPercent}>
                %
              </th>
              <th scope="col" className={report.thRightTight}>
                Вознаграждение
              </th>
            </tr>
          </thead>
          <tbody>
            {l1Rows.length === 0 ? (
              <tr>
                <td className={report.tdLeftTight} colSpan={5}>
                  {partnerIncomeLoading ? 'Загрузка…' : 'Нет начислений по прямым рефералам (L1)'}
                </td>
              </tr>
            ) : (
              l1Rows.map((row) => (
                <tr key={teamLineKey(row)}>
                  <td className={report.tdLeftTight}>{formatPartnerTableDate(row.orderUpdatedAt)}</td>
                  <td className={report.tdDesigner}>{partnerLineOrderLabel(row)}</td>
                  <td className={report.tdRightTightFirst}>{formatPartnerRubWhole(row.catalogTotalRub)}</td>
                  <td className={report.tdCenterPercent}>{row.percentApplied}%</td>
                  <td className={report.tdRightTight}>{formatPartnerRubWhole(row.bonusRub)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={report.tableFrame}>
        <div className={report.tableSummary}>
          <div className={report.tableSummaryLeft}>
            <span className={report.tableSummaryLabel}>Доход от команды (L2):</span>
            <span className={report.tableSummaryAmount}>{teamIncomeTotalLabel}</span>
          </div>
          <div className={report.tableSummaryRight}>
            <div className={report.filterChipWrap} ref={designerMenuRef}>
              <TBtn
                type="button"
                variant="ghost"
                trailingChevronDown
                aria-expanded={designerMenuOpen}
                aria-haspopup="listbox"
                aria-label="Фильтр по дизайнеру"
                onClick={onToggleDesignerMenu}
              >
                {designerFilterLabel}
              </TBtn>
              {designerMenuOpen ? (
                <ul className={report.filterMenu} role="listbox" aria-label="Дизайнеры">
                  <li role="option" aria-selected={designerFilterId === null}>
                    <button
                      type="button"
                      className={report.filterMenuItem}
                      onClick={() => onSelectDesigner(null)}
                    >
                      Все дизайнеры
                    </button>
                  </li>
                  {designerOptions.map((opt) => (
                    <li key={opt.id} role="option" aria-selected={designerFilterId === opt.id}>
                      <button
                        type="button"
                        className={report.filterMenuItem}
                        onClick={() => onSelectDesigner(opt.id)}
                      >
                        {opt.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className={report.filterChipWrap} ref={levelMenuRef}>
              <TBtn
                type="button"
                variant="ghost"
                trailingChevronDown
                aria-expanded={levelMenuOpen}
                aria-haspopup="listbox"
                aria-label="Фильтр по уровню"
                onClick={onToggleLevelMenu}
              >
                {levelFilterLabel}
              </TBtn>
              {levelMenuOpen ? (
                <ul className={report.filterMenu} role="listbox" aria-label="Уровни">
                  {(
                    [
                      { id: 'all' as const, label: 'Все уровни' },
                      { id: 1 as const, label: 'L1' },
                      { id: 2 as const, label: 'L2' },
                    ] as const
                  ).map((opt) => (
                    <li key={String(opt.id)} role="option" aria-selected={levelFilter === opt.id}>
                      <button
                        type="button"
                        className={report.filterMenuItem}
                        onClick={() => onSelectLevel(opt.id)}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <table className={report.table}>
          <thead>
            <tr>
              <th scope="col" className={report.thLeftTight}>
                Дата
              </th>
              <th scope="col" className={report.thDesigner}>
                Дизайнер
              </th>
              <th scope="col" className={report.thCenterLevel}>
                Уровень
              </th>
              <th scope="col" className={report.thRightTightFirst}>
                Оборот
              </th>
              <th scope="col" className={report.thCenterPercent}>
                %
              </th>
              <th scope="col" className={report.thRightTight}>
                Вознаграждение
              </th>
            </tr>
          </thead>
          <tbody>
            {teamRows.length === 0 ? (
              <tr>
                <td className={report.tdLeftTight} colSpan={6}>
                  {partnerIncomeLoading
                    ? 'Загрузка…'
                    : designerFilterId || levelFilter !== 'all'
                      ? 'Нет строк по выбранным фильтрам'
                      : 'Нет начислений по завершённым заказам команды (L2)'}
                </td>
              </tr>
            ) : (
              teamRows.map((row) => (
                <tr key={teamLineKey(row)}>
                  <td className={report.tdLeftTight}>{formatPartnerTableDate(row.orderUpdatedAt)}</td>
                  <td className={report.tdDesigner}>
                    <span className={report.designerName}>{partnerLinePurchaserLabel(row)}</span>
                    <span className={report.designerOrderMeta}>{partnerLineOrderLabel(row)}</span>
                  </td>
                  <td className={report.tdCenterLevel}>L{row.tier}</td>
                  <td className={report.tdRightTightFirst}>{formatPartnerRubWhole(row.catalogTotalRub)}</td>
                  <td className={report.tdCenterPercent}>{row.percentApplied}%</td>
                  <td className={report.tdRightTight}>{formatPartnerRubWhole(row.bonusRub)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

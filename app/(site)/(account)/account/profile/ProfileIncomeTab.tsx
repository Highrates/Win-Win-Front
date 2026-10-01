'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import {
  fetchPartnerProgramSummary,
  filterDesignerOwnOrderLines,
  formatPartnerRubWhole,
  formatPartnerTableDate,
  partnerLineOrderLabel,
  sumPartnerLinesBonusRub,
  type PartnerProgramBonusLineApi,
  type PartnerProgramSummaryApi,
} from '@/lib/referrals/partnerProgramSummary';
import report from '@/components/styles/PartnerReportTable.module.css';
import styles from './page.module.css';

const INCOME_RANGE_TABS = ['1 мес', '3 мес', '6 мес', 'За все время'] as const;

const DASH = '—';

function partnerLineKey(line: PartnerProgramBonusLineApi): string {
  return `${line.orderId}-${line.orderUpdatedAt}-${line.tier}-${line.bonusRub}`;
}

export function ProfileIncomeTab() {
  const [rangeIndex, setRangeIndex] = useState(0);
  const [summary, setSummary] = useState<PartnerProgramSummaryApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadErr(null);
    void fetchPartnerProgramSummary()
      .then((s) => {
        if (cancelled) return;
        setSummary(s);
        setLoadErr(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setSummary(null);
          setLoadErr(e instanceof Error ? e.message : 'Не удалось загрузить доход');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const designerRows = useMemo(
    () => filterDesignerOwnOrderLines(summary?.personalLines ?? []),
    [summary?.personalLines],
  );

  const designerTotalLabel = loading
    ? '…'
    : summary
      ? formatPartnerRubWhole(sumPartnerLinesBonusRub(designerRows))
      : DASH;

  const teamIncomeLabel = loading
    ? '…'
    : summary?.isWinWinPartner
      ? formatPartnerRubWhole(summary.totals.teamCompletedRub)
      : DASH;

  const statusLabel = summary?.isWinWinPartner
    ? 'Партнёр Wupapa'
    : summary && summary.designerBonus.bonusPercent > 0
      ? `Бонус со своего заказа: ${summary.designerBonus.bonusPercent}%`
      : null;

  if (loadErr) {
    return (
      <div className={styles.incomeTab}>
        <AccountErrorState message={loadErr} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className={styles.incomeTab}>
      {statusLabel ? <p className={report.partnerStatus}>{statusLabel}</p> : null}
      {summary?.linesMayBeIncomplete ? (
        <p className={report.linesIncompleteHint} role="status">
          Показаны недавние начисления (до 120 заказов). Полная история может быть больше.
        </p>
      ) : null}

      <div className={`${report.sheetWrapper} ${styles.incomeSheetWrapper}`}>
        <div className={report.sheetToolbar}>
          <div className={report.toolbarRowPrimary}>
            <div className={report.toolbarLeft}>
              <TBtn type="button" aria-label="Выбрать период" trailingChevronDown>
                26 янв - 26 фев.
              </TBtn>
              <AccountProjectTabs
                projects={INCOME_RANGE_TABS}
                selectedIndex={rangeIndex}
                onSelect={setRangeIndex}
                ariaLabel="Период отчёта"
              />
            </div>
            <TBtn type="button">Экспортировать CSV</TBtn>
          </div>
        </div>

        <div className={report.tableFrame}>
          <div className={report.tableSummary}>
            <div className={report.tableSummaryLeft}>
              <span className={report.tableSummaryLabel}>Бонус со своих заказов:</span>
              <span className={report.tableSummaryAmount}>{designerTotalLabel}</span>
            </div>
            <div className={report.tableSummaryRight}>
              <TBtn type="button" variant="ghost">
                Запросить выплату
              </TBtn>
            </div>
          </div>

          <table className={report.table}>
            <thead>
              <tr>
                <th scope="col" className={report.thLeftTight}>
                  Дата
                </th>
                <th scope="col" className={report.thDesigner}>
                  № Заказа
                </th>
                <th scope="col" className={report.thRightTightFirst}>
                  Сумма
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
              {designerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={report.tdLeftTight}>
                    {loading ? 'Загрузка…' : 'Нет бонусов по завершённым собственным заказам'}
                  </td>
                </tr>
              ) : (
                designerRows.map((row) => (
                  <tr key={partnerLineKey(row)}>
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

        {summary?.isWinWinPartner ? (
          <div className={report.tableFrame}>
            <div className={`${report.tableSummary} ${styles.incomeTeamSummary}`}>
              <div className={report.tableSummaryLeft}>
                <span className={report.tableSummaryLabel}>Доход от команды:</span>
                <span className={report.tableSummaryAmount}>{teamIncomeLabel}</span>
                <Link href="/account/team" className={styles.incomeTeamDetailsLink}>
                  Детали
                  <img src="/icons/arrow-right.svg" alt="" width={12} height={7} aria-hidden />
                </Link>
              </div>
              <div className={report.tableSummaryRight}>
                <TBtn type="button" variant="ghost">
                  Запросить выплату
                </TBtn>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

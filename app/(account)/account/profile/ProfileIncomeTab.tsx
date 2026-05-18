'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import {
  fetchPartnerProgramSummary,
  filterCompletedPartnerLines,
  formatPartnerRubWhole,
  formatPartnerTableDate,
  partnerLineOrderLabel,
  type PartnerProgramBonusLineApi,
  type PartnerProgramSummaryApi,
} from '@/lib/referrals/partnerProgramSummary';
import teamStyles from '../team/page.module.css';
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
  }, []);

  const personalRows = useMemo(
    () => filterCompletedPartnerLines(summary?.personalLines ?? []),
    [summary?.personalLines],
  );

  const personalTotalLabel = loading
    ? '…'
    : summary
      ? formatPartnerRubWhole(summary.totals.personalCompletedRub)
      : DASH;

  const teamIncomeLabel = loading
    ? '…'
    : summary
      ? formatPartnerRubWhole(summary.totals.teamCompletedRub)
      : DASH;

  return (
    <div className={styles.incomeTab}>
      <p className={teamStyles.partnerStatus}>Партнер Win-win</p>

      {loadErr ? (
        <p className={teamStyles.partnerStatus} role="alert" style={{ color: 'var(--color-red, #c53029)' }}>
          {loadErr}
        </p>
      ) : null}

      <div className={`${teamStyles.sheetWrapper} ${styles.incomeSheetWrapper}`}>
        <div className={teamStyles.sheetToolbar}>
          <div className={teamStyles.toolbarRowPrimary}>
            <div className={teamStyles.toolbarLeft}>
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

        <div className={teamStyles.tableFrame}>
          <div className={teamStyles.tableSummary}>
            <div className={teamStyles.tableSummaryLeft}>
              <span className={teamStyles.tableSummaryLabel}>Личный доход:</span>
              <span className={teamStyles.tableSummaryAmount}>{personalTotalLabel}</span>
            </div>
            <div className={teamStyles.tableSummaryRight}>
              <TBtn type="button" variant="ghost">
                Запросить выплату
              </TBtn>
            </div>
          </div>

          <table className={teamStyles.table}>
            <thead>
              <tr>
                <th scope="col" className={teamStyles.thLeftTight}>
                  Дата
                </th>
                <th scope="col" className={teamStyles.thDesigner}>
                  № Заказа
                </th>
                <th scope="col" className={teamStyles.thRightTightFirst}>
                  Сумма
                </th>
                <th scope="col" className={teamStyles.thCenterPercent}>
                  %
                </th>
                <th scope="col" className={teamStyles.thRightTight}>
                  Вознаграждение
                </th>
              </tr>
            </thead>
            <tbody>
              {personalRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={teamStyles.tdLeftTight}>
                    {loading ? 'Загрузка…' : 'Нет начислений по завершённым заказам прямых рефералов'}
                  </td>
                </tr>
              ) : (
                personalRows.map((row) => (
                  <tr key={partnerLineKey(row)}>
                    <td className={teamStyles.tdLeftTight}>{formatPartnerTableDate(row.orderUpdatedAt)}</td>
                    <td className={teamStyles.tdDesigner}>{partnerLineOrderLabel(row)}</td>
                    <td className={teamStyles.tdRightTightFirst}>{formatPartnerRubWhole(row.catalogTotalRub)}</td>
                    <td className={teamStyles.tdCenterPercent}>{row.percentApplied}%</td>
                    <td className={teamStyles.tdRightTight}>{formatPartnerRubWhole(row.bonusRub)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={teamStyles.tableFrame}>
          <div className={`${teamStyles.tableSummary} ${styles.incomeTeamSummary}`}>
            <div className={teamStyles.tableSummaryLeft}>
              <span className={teamStyles.tableSummaryLabel}>Доход от команды:</span>
              <span className={teamStyles.tableSummaryAmount}>{teamIncomeLabel}</span>
              <Link href="/account/team" className={styles.incomeTeamDetailsLink}>
                Детали
                <img src="/icons/arrow-right.svg" alt="" width={12} height={7} aria-hidden />
              </Link>
            </div>
            <div className={teamStyles.tableSummaryRight}>
              <TBtn type="button" variant="ghost">
                Запросить выплату
              </TBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

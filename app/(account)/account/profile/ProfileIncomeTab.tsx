'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import { PROFILE_PERSONAL_INCOME_ROWS } from '@/lib/account/profilePersonalIncomeMock';
import teamStyles from '../team/page.module.css';
import styles from './page.module.css';

const INCOME_RANGE_TABS = ['1 мес', '3 мес', '6 мес', 'За все время'] as const;

export function ProfileIncomeTab() {
  const [rangeIndex, setRangeIndex] = useState(0);

  return (
    <div className={styles.incomeTab}>
      <p className={teamStyles.partnerStatus}>Партнер Win-win</p>

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
              <span className={teamStyles.tableSummaryAmount}>200 100 ₽</span>
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
              {PROFILE_PERSONAL_INCOME_ROWS.map((row) => (
                <tr key={row.id}>
                  <td className={teamStyles.tdLeftTight}>{row.date}</td>
                  <td className={teamStyles.tdDesigner}>{row.orderNo}</td>
                  <td className={teamStyles.tdRightTightFirst}>{row.amount}</td>
                  <td className={teamStyles.tdCenterPercent}>{row.percent}</td>
                  <td className={teamStyles.tdRightTight}>{row.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={teamStyles.tableFrame}>
          <div className={`${teamStyles.tableSummary} ${styles.incomeTeamSummary}`}>
            <div className={teamStyles.tableSummaryLeft}>
              <span className={teamStyles.tableSummaryLabel}>Доход от команды:</span>
              <span className={teamStyles.tableSummaryAmount}>320 000 ₽</span>
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

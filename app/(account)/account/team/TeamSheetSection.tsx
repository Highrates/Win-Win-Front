'use client';

import { useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import { TEAM_REWARD_ROWS } from '@/lib/account/teamTableMock';
import styles from './page.module.css';

const TEAM_RANGE_TABS = ['1 мес', '3 мес', '6 мес', 'За все время'] as const;

export function TeamSheetSection() {
  const [rangeIndex, setRangeIndex] = useState(0);

  return (
    <div className={styles.sheetWrapper}>
      <div className={styles.sheetToolbar}>
        <div className={styles.toolbarRowPrimary}>
          <div className={styles.toolbarLeft}>
            <TBtn type="button" aria-label="Выбрать период" trailingChevronDown>
              26 янв - 26 фев.
            </TBtn>
            <AccountProjectTabs
              projects={TEAM_RANGE_TABS}
              selectedIndex={rangeIndex}
              onSelect={setRangeIndex}
              ariaLabel="Период отчёта"
            />
          </div>
          <TBtn type="button">Экспортировать CSV</TBtn>
        </div>
      </div>

      <div className={styles.tableFrame}>
        <div className={styles.tableSummary}>
          <div className={styles.tableSummaryLeft}>
            <span className={styles.tableSummaryLabel}>Доход от команды:</span>
            <span className={styles.tableSummaryAmount}>320 000 ₽</span>
          </div>
          <div className={styles.tableSummaryRight}>
            <TBtn type="button" variant="ghost" trailingChevronDown>
              По дизайнеру
            </TBtn>
            <TBtn type="button" variant="ghost" trailingChevronDown>
              По уровню
            </TBtn>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.thLeftTight}>
                Дата
              </th>
              <th scope="col" className={styles.thDesigner}>
                Дизайнер
              </th>
              <th scope="col" className={styles.thCenterLevel}>
                Уровень
              </th>
              <th scope="col" className={styles.thRightTightFirst}>
                Оборот
              </th>
              <th scope="col" className={styles.thCenterPercent}>
                %
              </th>
              <th scope="col" className={styles.thRightTight}>
                Вознаграждение
              </th>
            </tr>
          </thead>
          <tbody>
            {TEAM_REWARD_ROWS.map((row) => (
              <tr key={row.id}>
                <td className={styles.tdLeftTight}>{row.date}</td>
                <td className={styles.tdDesigner}>{row.designer}</td>
                <td className={styles.tdCenterLevel}>{row.level}</td>
                <td className={styles.tdRightTightFirst}>{row.turnover}</td>
                <td className={styles.tdCenterPercent}>{row.percent}</td>
                <td className={styles.tdRightTight}>{row.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

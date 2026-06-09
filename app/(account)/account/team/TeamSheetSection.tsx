'use client';

import { useId, useMemo, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { TBtn } from '@/components/TBtn/TBtn';
import type { TeamBranchCard } from '@/lib/account/teamTeammateLeadMock';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import {
  filterCompletedPartnerLines,
  filterReferralL1Lines,
  formatPartnerRubWhole,
  formatPartnerTableDate,
  partnerLineOrderLabel,
  sumPartnerLinesBonusRub,
  type PartnerProgramBonusLineApi,
  type PartnerProgramSummaryApi,
} from '@/lib/referrals/partnerProgramSummary';
import styles from './page.module.css';

const TEAM_RANGE_TABS = ['1 мес', '3 мес', '6 мес', 'За все время'] as const;

const DASH = '—';

function teamLineKey(line: PartnerProgramBonusLineApi): string {
  return `${line.orderId}-${line.orderUpdatedAt}-${line.tier}-${line.bonusRub}`;
}

function TeammateBranchRow({ card }: { card: TeamBranchCard }) {
  const [open, setOpen] = useState(false);
  const branchListId = useId();

  return (
    <div className={styles.teammateBranchBlock}>
      <button
        type="button"
        className={`${styles.teammateCard} ${styles.teammateCardTrigger}`}
        aria-expanded={open}
        aria-controls={branchListId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          className={`${styles.teammateCardChevron} ${open ? styles.teammateCardChevronOpen : ''}`}
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M8.25 16.5L13.75 11L8.25 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles.teammateCardMain}>
          <img
            src={card.avatarSrc}
            alt=""
            width={52}
            height={52}
            className={styles.teammateAvatar}
            loading="lazy"
          />
          <div className={styles.teammateTexts}>
            <span className={styles.teammateName}>{card.name}</span>
            <span className={styles.teammateCity}>{card.city}</span>
          </div>
        </div>
        <span className={styles.teammateBranchCount}>{card.branchCount} человек</span>
      </button>

      {open ? (
        <div id={branchListId} className={styles.teammateExpandList} role="region" aria-label="Участники ветки">
          {card.members.map((m) => (
            <div key={m.id} className={styles.teammateTexts}>
              <span className={styles.teammateName}>{m.name}</span>
              <span className={styles.teammateCity}>{m.city}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TeamSheetSection({
  branchCards,
  partnerSummary,
  partnerIncomeLoading = false,
}: {
  branchCards: TeamBranchCard[];
  partnerSummary: PartnerProgramSummaryApi | null;
  partnerIncomeLoading?: boolean;
}) {
  const [rangeIndex, setRangeIndex] = useState(0);

  const l1Rows = useMemo(
    () => filterReferralL1Lines(partnerSummary?.personalLines ?? []),
    [partnerSummary?.personalLines],
  );

  const teamRows = useMemo(
    () => filterCompletedPartnerLines(partnerSummary?.teamLines ?? []),
    [partnerSummary?.teamLines],
  );

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
        ? formatPartnerRubWhole(partnerSummary.totals.teamCompletedRub)
        : DASH;

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
            <span className={styles.tableSummaryLabel}>Доход от прямых рефералов (L1):</span>
            <span className={styles.tableSummaryAmount}>{l1IncomeTotalLabel}</span>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.thLeftTight}>
                Дата
              </th>
              <th scope="col" className={styles.thDesigner}>
                № заказа
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
            {l1Rows.length === 0 ? (
              <tr>
                <td className={styles.tdLeftTight} colSpan={5}>
                  {partnerIncomeLoading ? 'Загрузка…' : 'Нет начислений по прямым рефералам (L1)'}
                </td>
              </tr>
            ) : (
              l1Rows.map((row) => (
                <tr key={teamLineKey(row)}>
                  <td className={styles.tdLeftTight}>{formatPartnerTableDate(row.orderUpdatedAt)}</td>
                  <td className={styles.tdDesigner}>{partnerLineOrderLabel(row)}</td>
                  <td className={styles.tdRightTightFirst}>{formatPartnerRubWhole(row.catalogTotalRub)}</td>
                  <td className={styles.tdCenterPercent}>{row.percentApplied}%</td>
                  <td className={styles.tdRightTight}>{formatPartnerRubWhole(row.bonusRub)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.tableFrame}>
        <div className={styles.tableSummary}>
          <div className={styles.tableSummaryLeft}>
            <span className={styles.tableSummaryLabel}>Доход от команды (L2):</span>
            <span className={styles.tableSummaryAmount}>{teamIncomeTotalLabel}</span>
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
            {teamRows.length === 0 ? (
              <tr>
                <td className={styles.tdLeftTight} colSpan={6}>
                  {partnerIncomeLoading ? 'Загрузка…' : 'Нет начислений по завершённым заказам команды (L2)'}
                </td>
              </tr>
            ) : (
              teamRows.map((row) => (
                <tr key={teamLineKey(row)}>
                  <td className={styles.tdLeftTight}>{formatPartnerTableDate(row.orderUpdatedAt)}</td>
                  <td className={styles.tdDesigner}>{formatOrderDisplayId(row.purchaserUserId)}</td>
                  <td className={styles.tdCenterLevel}>L{row.tier}</td>
                  <td className={styles.tdRightTightFirst}>{formatPartnerRubWhole(row.catalogTotalRub)}</td>
                  <td className={styles.tdCenterPercent}>{row.percentApplied}%</td>
                  <td className={styles.tdRightTight}>{formatPartnerRubWhole(row.bonusRub)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.headingCardWrap}>
        <h1 className={styles.pageTitle}>Команда</h1>

        <div className={styles.teammateBranchesStack}>
          {branchCards.length > 0 ? (
            branchCards.map((card) => <TeammateBranchRow key={card.id} card={card} />)
          ) : (
            <p className={styles.teamEmptyHint}>В вашей команде пока нет дизайнеров</p>
          )}
        </div>
      </div>
    </div>
  );
}

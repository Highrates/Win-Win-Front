'use client';

import { useId, useState } from 'react';
import { russianPluralChelovek, type TeamBranchCard } from '@/lib/winWinTeam';
import styles from './page.module.css';

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
        <span className={styles.teammateBranchCount}>
          {card.branchCount} {russianPluralChelovek(card.branchCount)}
        </span>
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

export function TeamTree({
  branchCards,
  searchActive = false,
}: {
  branchCards: TeamBranchCard[];
  searchActive?: boolean;
}) {
  return (
    <div className={styles.headingCardWrap}>
      <div className={styles.teammateBranchesStack}>
        {branchCards.length > 0 ? (
          branchCards.map((card) => <TeammateBranchRow key={card.id} card={card} />)
        ) : (
          <p className={styles.teamEmptyHint}>
            {searchActive ? 'Ничего не найдено' : 'В вашей команде пока нет дизайнеров'}
          </p>
        )}
      </div>
    </div>
  );
}

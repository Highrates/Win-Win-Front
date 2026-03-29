import Link from 'next/link';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { TeamSheetSection } from './TeamSheetSection';
import styles from './page.module.css';

/** Мок: позже — API команды */
const TEAM_STRUCTURE = {
  totalPeople: 24,
  leaderName: 'Анна Смирнова',
  leaderHref: '/designers/anna-smirnova',
  level1Count: 12,
  level2Count: 8,
} as const;

export default function TeamPage() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <SearchBox
          placeholder="Поиск по членам команды"
          ariaLabel="Поиск по членам команды"
          className={styles.teamSearchBox}
        />
        <Button type="button" variant="primary">
          Пригласить дизайнера
        </Button>
      </div>

      <div className={styles.summaryColumn}>
        <div className={styles.summaryRowTop}>
          <p className={styles.partnerStatus}>Партнер Win-win</p>
          <Link href="/referral" className={styles.programLink}>
            Подробнее о программе Win Win
          </Link>
        </div>

        <div className={styles.structureRow}>
          <span className={styles.structureMeta}>
            <span className={styles.structureLabel}>Структура:</span>
            <span className={styles.structurePeople}>
              {TEAM_STRUCTURE.totalPeople} человек
            </span>
          </span>
          <span className={styles.structureDivider} aria-hidden />
          <Link href={TEAM_STRUCTURE.leaderHref} className={styles.leaderLink}>
            {TEAM_STRUCTURE.leaderName}
          </Link>
          <span className={styles.structureDivider} aria-hidden />
          <span className={styles.structureLevel}>
            1 уровень — <span className={styles.levelNumber}>{TEAM_STRUCTURE.level1Count}</span>
          </span>
          <span className={styles.structureDivider} aria-hidden />
          <span className={styles.structureLevel}>
            2 уровень — <span className={styles.levelNumber}>{TEAM_STRUCTURE.level2Count}</span>
          </span>
        </div>
      </div>

      <TeamSheetSection />
    </div>
  );
}

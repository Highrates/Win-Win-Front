export type TeamRewardRow = {
  id: string;
  date: string;
  designer: string;
  level: string;
  turnover: string;
  percent: string;
  reward: string;
};

export const TEAM_REWARD_ROWS: TeamRewardRow[] = [
  {
    id: '1',
    date: '26.02.2026',
    designer: 'Ирина Волкова',
    level: '1',
    turnover: '1 240 000 ₽',
    percent: '4,5%',
    reward: '55 800 ₽',
  },
  {
    id: '2',
    date: '25.02.2026',
    designer: 'Михаил Орлов',
    level: '2',
    turnover: '890 000 ₽',
    percent: '2%',
    reward: '17 800 ₽',
  },
  {
    id: '3',
    date: '24.02.2026',
    designer: 'Елена Ким',
    level: '1',
    turnover: '2 100 000 ₽',
    percent: '4,5%',
    reward: '94 500 ₽',
  },
  {
    id: '4',
    date: '22.02.2026',
    designer: 'Павел Нестеров',
    level: '2',
    turnover: '340 000 ₽',
    percent: '2%',
    reward: '6 800 ₽',
  },
  {
    id: '5',
    date: '20.02.2026',
    designer: 'Софья Лебедева',
    level: '1',
    turnover: '560 000 ₽',
    percent: '4,5%',
    reward: '25 200 ₽',
  },
];

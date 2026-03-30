export type ProfilePersonalIncomeRow = {
  id: string;
  date: string;
  orderNo: string;
  amount: string;
  percent: string;
  reward: string;
};

export const PROFILE_PERSONAL_INCOME_ROWS: ProfilePersonalIncomeRow[] = [
  {
    id: '1',
    date: '26.02.2026',
    orderNo: '№ 18492',
    amount: '1 240 000 ₽',
    percent: '4,5%',
    reward: '55 800 ₽',
  },
  {
    id: '2',
    date: '25.02.2026',
    orderNo: '№ 18401',
    amount: '890 000 ₽',
    percent: '2%',
    reward: '17 800 ₽',
  },
  {
    id: '3',
    date: '24.02.2026',
    orderNo: '№ 18388',
    amount: '2 100 000 ₽',
    percent: '4,5%',
    reward: '94 500 ₽',
  },
  {
    id: '4',
    date: '22.02.2026',
    orderNo: '№ 18320',
    amount: '340 000 ₽',
    percent: '2%',
    reward: '6 800 ₽',
  },
  {
    id: '5',
    date: '20.02.2026',
    orderNo: '№ 18294',
    amount: '560 000 ₽',
    percent: '4,5%',
    reward: '25 200 ₽',
  },
];

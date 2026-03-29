export type TeamBranchMember = {
  id: string;
  name: string;
  city: string;
};

export type TeamBranchCard = {
  id: string;
  name: string;
  city: string;
  branchCount: number;
  avatarSrc: string;
  members: TeamBranchMember[];
};

/** Семь карточек ведущих веток + участники (мок). */
export const TEAM_BRANCH_CARDS: TeamBranchCard[] = [
  {
    id: 'b1',
    name: 'Дмитрий Козлов',
    city: 'г. Москва',
    branchCount: 5,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b1-m1', name: 'Ирина Волкова', city: 'г. Санкт-Петербург' },
      { id: 'b1-m2', name: 'Михаил Орлов', city: 'г. Казань' },
      { id: 'b1-m3', name: 'Елена Ким', city: 'г. Москва' },
      { id: 'b1-m4', name: 'Павел Нестеров', city: 'г. Сочи' },
      { id: 'b1-m5', name: 'Софья Лебедева', city: 'г. Екатеринбург' },
    ],
  },
  {
    id: 'b2',
    name: 'Анна Смирнова',
    city: 'г. Санкт-Петербург',
    branchCount: 4,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b2-m1', name: 'Олег Тихонов', city: 'г. Новосибирск' },
      { id: 'b2-m2', name: 'Мария Соколова', city: 'г. Москва' },
      { id: 'b2-m3', name: 'Артём Белов', city: 'г. Казань' },
      { id: 'b2-m4', name: 'Дарья Фёдорова', city: 'г. Краснодар' },
    ],
  },
  {
    id: 'b3',
    name: 'Сергей Волков',
    city: 'г. Екатеринбург',
    branchCount: 3,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b3-m1', name: 'Ксения Романова', city: 'г. Пермь' },
      { id: 'b3-m2', name: 'Игорь Зайцев', city: 'г. Уфа' },
      { id: 'b3-m3', name: 'Виктория Морозова', city: 'г. Челябинск' },
    ],
  },
  {
    id: 'b4',
    name: 'Екатерина Лебедева',
    city: 'г. Казань',
    branchCount: 6,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b4-m1', name: 'Никита Гусев', city: 'г. Нижний Новгород' },
      { id: 'b4-m2', name: 'Полина Кузнецова', city: 'г. Самара' },
      { id: 'b4-m3', name: 'Максим Рыбаков', city: 'г. Ростов-на-Дону' },
      { id: 'b4-m4', name: 'Алина Семёнова', city: 'г. Воронеж' },
      { id: 'b4-m5', name: 'Денис Крылов', city: 'г. Тула' },
      { id: 'b4-m6', name: 'Юлия Павлова', city: 'г. Тверь' },
    ],
  },
  {
    id: 'b5',
    name: 'Алексей Новиков',
    city: 'г. Новосибирск',
    branchCount: 2,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b5-m1', name: 'Тимур Ахмедов', city: 'г. Омск' },
      { id: 'b5-m2', name: 'Светлана Егорова', city: 'г. Томск' },
    ],
  },
  {
    id: 'b6',
    name: 'Ольга Фёдорова',
    city: 'г. Краснодар',
    branchCount: 4,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b6-m1', name: 'Роман Щербаков', city: 'г. Сочи' },
      { id: 'b6-m2', name: 'Наталья Комарова', city: 'г. Ставрополь' },
      { id: 'b6-m3', name: 'Владислав Мельников', city: 'г. Астрахань' },
      { id: 'b6-m4', name: 'Евгения Орлова', city: 'г. Волгоград' },
    ],
  },
  {
    id: 'b7',
    name: 'Илья Морозов',
    city: 'г. Нижний Новгород',
    branchCount: 3,
    avatarSrc: '/images/placeholder.svg',
    members: [
      { id: 'b7-m1', name: 'Анастасия Виноградова', city: 'г. Ярославль' },
      { id: 'b7-m2', name: 'Константин Соловьёв', city: 'г. Иваново' },
      { id: 'b7-m3', name: 'Татьяна Богданова', city: 'г. Кострома' },
    ],
  },
];

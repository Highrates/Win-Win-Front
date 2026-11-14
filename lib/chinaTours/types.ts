/** Общий контракт тура/дня (витрина + админка). */

export type ChinaTourImageRole =
  | 'CARD_PRIMARY'
  | 'CARD_SECONDARY'
  | 'DAY_HERO'
  | 'DAY_GALLERY';

export type ChinaTourImage = {
  id?: string;
  url: string;
  role: ChinaTourImageRole;
  sortOrder?: number;
};

export type ChinaTourScheduleItem = {
  id?: string;
  timeLabel: string;
  title: string;
  body: string;
  sortOrder?: number;
};

/** День как в admin editor / DTO (с images). */
export type ChinaTourDay = {
  id?: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  sortOrder?: number;
  items: ChinaTourScheduleItem[];
  images: ChinaTourImage[];
};

export type ChinaToursLanding = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  featuredTourIds?: string[] | null;
};

export type ChinaTourListItem = {
  id: string;
  slug: string;
  title: string;
  cardText: string | null;
  startsAt: string;
  endsAt: string;
  seatsTotal: number;
  seatsTaken: number;
  cardPrimaryUrl: string | null;
  cardSecondaryUrl: string | null;
};

/** День на публичной detail (hero/gallery уже разложены). */
export type ChinaTourDetailDay = {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  items: Array<{ id: string; timeLabel: string; title: string; body: string }>;
  heroUrl: string | null;
  galleryUrls: string[];
};

export type ChinaTourDetail = {
  id: string;
  slug: string;
  title: string;
  cardText: string | null;
  startsAt: string;
  endsAt: string;
  seatsTotal: number;
  seatsTaken: number;
  canReview: boolean;
  cardPrimaryUrl: string | null;
  cardSecondaryUrl: string | null;
  days: ChinaTourDetailDay[];
  reviews: Array<{
    id: string;
    body: string;
    rating: number | null;
    createdAt: string;
    authorName: string;
  }>;
};

export type ChinaTourMyApplication = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  comment: string | null;
  createdAt: string;
} | null;

/** Заявка в списке ЛК (`GET /china-tours/my-applications`). */
export type ChinaTourMyApplicationListItem = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  comment: string | null;
  createdAt: string;
  /** ACCEPTED + published + endsAt в прошлом — можно оставить отзыв на странице тура. */
  canReview: boolean;
  tour: {
    id: string;
    slug: string;
    title: string;
    startsAt: string;
    endsAt: string;
    isPublished: boolean;
    seatsTotal: number;
    seatsTaken: number;
    cardPrimaryUrl: string | null;
  };
};

export type ChinaTourMyReview = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  body: string;
  rating: number | null;
  createdAt: string;
} | null;

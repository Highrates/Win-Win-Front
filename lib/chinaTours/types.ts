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

/** Бренд/фабрика в дне (admin DTO + editor). */
export type ChinaTourDayBrand = {
  id?: string;
  brandId?: string | null;
  customName?: string | null;
  sortOrder?: number;
  /** Display name (catalog name or custom). */
  name?: string;
  slug?: string | null;
  logoUrl?: string | null;
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
  brands?: ChinaTourDayBrand[];
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

/** Бренд дня на публичной detail (для чипов + MoreAboutBrand). */
export type ChinaTourDetailDayBrand = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  shortDescription: string | null;
  descriptionHtml: string | null;
  siteUrl: string | null;
  galleryUrls: string[];
  catalogPdfUrl: string | null;
  hasAbout: boolean;
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
  brands: ChinaTourDetailDayBrand[];
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

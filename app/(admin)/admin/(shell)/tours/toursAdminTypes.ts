/**
 * Admin-типы туров: общий контракт из lib/chinaTours/types + admin-only поля.
 */
export type {
  ChinaTourImageRole,
  ChinaTourImage as AdminChinaTourImage,
  ChinaTourScheduleItem as AdminChinaTourScheduleItem,
  ChinaTourDay as AdminChinaTourDay,
  ChinaToursLanding as AdminChinaToursLanding,
} from '@/lib/chinaTours/types';

export type AdminChinaTourListItem = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  seatsTotal: number;
  seatsTaken: number;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
  daysCount: number;
  applicationsCount: number;
  /** Одобренные (витрина). */
  reviewsCount: number;
  /** Все статусы. */
  reviewsTotal: number;
  updatedAt: string;
};

export type AdminChinaToursListResponse = {
  items: AdminChinaTourListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminChinaTourDetail = {
  id: string;
  slug: string;
  title: string;
  cardText: string | null;
  startsAt: string;
  endsAt: string;
  seatsTotal: number;
  seatsTaken: number;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
  images: import('@/lib/chinaTours/types').ChinaTourImage[];
  days: import('@/lib/chinaTours/types').ChinaTourDay[];
};

export type AdminChinaTourApplication = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  comment: string | null;
  createdAt: string;
  tour: { id: string; title: string; slug: string };
  user: { id: string; email: string | null; phone: string | null; name: string | null };
};

export type AdminChinaTourReview = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  body: string;
  rating: number | null;
  authorName: string | null;
  photoUrls: string[];
  videoUrl: string | null;
  isAdminAuthored: boolean;
  createdAt: string;
  tour: { id: string; title: string; slug: string };
  user: { id: string; email: string | null; name: string | null } | null;
};

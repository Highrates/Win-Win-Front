import type { AdminSectionId, ModeratorAssignableSectionId } from '@win-win/admin-sections';

/** Права и профиль staff в сессии админки (`GET /auth/me`, `/api/admin/session`). */
export type AdminStaffSession = {
  isSuperAdmin: boolean;
  sections: AdminSectionId[];
  staffDisplayName: string | null;
  staffAvatarUrl: string | null;
};

/**
 * Пользователь сессии админки. Права — только в `staff.sections`;
 * `adminSections` с `/auth/me` не приходит (см. `stripStaffFieldsFromPublicUser` на бэке).
 */
export type AdminSessionUser = {
  id?: string;
  email?: string | null;
  staff?: AdminStaffSession | null;
};

/** Строка CRUD `/settings/admin/staff` — сырые секции модератора для редактирования. */
export type StaffAdminRow = {
  id: string;
  email: string | null;
  role: 'ADMIN' | 'MODERATOR';
  isActive: boolean;
  staffDisplayName: string | null;
  staffAvatarUrl: string | null;
  adminSections: ModeratorAssignableSectionId[];
  lastAdminLoginAt: string | null;
  createdAt: string;
};

export type StaffSectionCatalogItem = {
  id: ModeratorAssignableSectionId;
  label: string;
};

export type CreateStaffResponse = {
  user: StaffAdminRow;
  emailSent: boolean;
};

export type ResetStaffPasswordResponse = {
  emailSent: boolean;
};

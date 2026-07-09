/** Событие после обновления профиля staff (аватар, имя) — слушают чат и sidebar. */
export const ADMIN_STAFF_PROFILE_UPDATED_EVENT = 'admin-staff-profile-updated';

export function dispatchAdminStaffProfileUpdated(): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new Event(ADMIN_STAFF_PROFILE_UPDATED_EVENT));
}

import { staffCanAccessAdminPath } from '@win-win/admin-sections';
import type { AdminStaffSession } from '@/lib/adminStaffTypes';

/** Проверка доступа модератора к pathname (deny-by-default для неизвестных путей). */
export function assertStaffCanAccessAdminPath(pathname: string, staff: AdminStaffSession): boolean {
  return staffCanAccessAdminPath(pathname, staff.sections, staff.isSuperAdmin);
}

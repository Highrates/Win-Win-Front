'use client';

import { staffCanAssistant } from '@win-win/admin-sections';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import { AdminAssistantHost } from './AdminAssistantPanel';

/** FAB ассистента — только для staff с grant `assistant` (или суперадмин). */
export function AdminAssistantMount() {
  const { staff, email, loading, isSuperAdmin, sections } = useAdminPermissions();
  const enabled =
    !loading && !!staff && staffCanAssistant(sections, isSuperAdmin);
  const staffName = staff?.staffDisplayName?.trim() || email || null;
  return <AdminAssistantHost enabled={enabled} staffName={staffName} />;
}

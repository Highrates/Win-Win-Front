import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_SECTION_DASHBOARD,
  staffCanAccessAdminPath,
  type AdminSectionId,
} from '@win-win/admin-sections';
import type { AdminSessionUser, AdminStaffSession } from '@/lib/adminStaffTypes';

const PERMISSIONS_POLL_MS = 5 * 60_000;

type AdminPermissionsContextValue = {
  loading: boolean;
  userId: string | null;
  staff: AdminStaffSession | null;
  email: string | null;
  isSuperAdmin: boolean;
  sections: AdminSectionId[];
  canAccessSection: (section: AdminSectionId | 'staff') => boolean;
  canAccessPathname: (pathname: string) => boolean;
  refresh: () => Promise<void>;
};

const AdminPermissionsContext = createContext<AdminPermissionsContextValue | null>(null);

type SessionPayload = {
  authenticated?: boolean;
  user?: AdminSessionUser;
};

function applySessionPayload(
  data: SessionPayload,
  setUserId: (v: string | null) => void,
  setStaff: (v: AdminStaffSession | null) => void,
  setEmail: (v: string | null) => void,
) {
  if (!data.authenticated || !data.user?.staff) {
    setUserId(data.user?.id ?? null);
    setStaff(null);
    setEmail(data.user?.email ?? null);
    return;
  }
  setUserId(data.user.id ?? null);
  setStaff(data.user.staff);
  setEmail(data.user.email ?? null);
}

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [staff, setStaff] = useState<AdminStaffSession | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchSession = useCallback(async (): Promise<SessionPayload | null> => {
    try {
      const res = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        setUserId(null);
        setStaff(null);
        setEmail(null);
        return null;
      }
      return (await res.json()) as SessionPayload;
    } catch {
      setUserId(null);
      setStaff(null);
      setEmail(null);
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSession();
      if (data) applySessionPayload(data, setUserId, setStaff, setEmail);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [fetchSession]);

  const loadSilent = useCallback(async () => {
    const data = await fetchSession();
    if (data) applySessionPayload(data, setUserId, setStaff, setEmail);
  }, [fetchSession]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && hasLoadedOnce.current) {
        void loadSilent();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadSilent]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadSilent();
    }, PERMISSIONS_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadSilent]);

  const isSuperAdmin = staff?.isSuperAdmin ?? false;
  const sections = staff?.sections ?? [];

  const canAccessSection = useCallback(
    (section: AdminSectionId | 'staff') => {
      if (isSuperAdmin) return true;
      if (section === 'staff') return false;
      if (section === ADMIN_SECTION_DASHBOARD) return true;
      return sections.includes(section);
    },
    [isSuperAdmin, sections],
  );

  const canAccessPathname = useCallback(
    (pathname: string) => staffCanAccessAdminPath(pathname, sections, isSuperAdmin),
    [isSuperAdmin, sections],
  );

  const value = useMemo(
    (): AdminPermissionsContextValue => ({
      loading,
      userId,
      staff,
      email,
      isSuperAdmin,
      sections,
      canAccessSection,
      canAccessPathname,
      refresh: load,
    }),
    [loading, userId, staff, email, isSuperAdmin, sections, canAccessSection, canAccessPathname, load],
  );

  return (
    <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions(): AdminPermissionsContextValue {
  const ctx = useContext(AdminPermissionsContext);
  if (!ctx) {
    throw new Error('useAdminPermissions must be used within AdminPermissionsProvider');
  }
  return ctx;
}

export function useAdminPermissionsOptional(): AdminPermissionsContextValue | null {
  return useContext(AdminPermissionsContext);
}

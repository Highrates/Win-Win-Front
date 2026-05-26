'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getCachedIsAuthenticated,
  primeCachedIsAuthenticated,
  USER_SESSION_CHANGED_EVENT,
} from '@/lib/userSessionClient';

type UserAuthContextValue = {
  auth: boolean | null;
};

const UserAuthContext = createContext<UserAuthContextValue | null>(null);

type Props = {
  children: ReactNode;
  /** С сервера: сессия проверена через GET /auth/me (не только наличие cookie). */
  initialAuthenticated?: boolean;
};

export function UserAuthProvider({ children, initialAuthenticated }: Props) {
  const [auth, setAuth] = useState<boolean | null>(
    initialAuthenticated === undefined ? null : initialAuthenticated,
  );

  useEffect(() => {
    if (initialAuthenticated !== undefined) {
      primeCachedIsAuthenticated(initialAuthenticated);
      setAuth(initialAuthenticated);
    }
  }, [initialAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getCachedIsAuthenticated().then((ok) => {
        if (!cancelled) setAuth(ok);
      });
    };
    refresh();
    window.addEventListener(USER_SESSION_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(USER_SESSION_CHANGED_EVENT, refresh);
    };
  }, []);

  const value = useMemo(() => ({ auth }), [auth]);

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

/** `undefined` — вне провайдера. */
export function usePageAuth(): boolean | null | undefined {
  const ctx = useContext(UserAuthContext);
  if (!ctx) return undefined;
  return ctx.auth;
}

'use client';

import React, { useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import * as transition from './transitionLogic';

type TransitionContextType = {
  navigateWithTransition: (href: string, fromMenu?: boolean) => void;
};

const Context = React.createContext<TransitionContextType | null>(null);

export function useSiteTransition() {
  const ctx = useContext(Context);
  return ctx;
}

export function SiteTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const navigateWithTransition = useCallback(
    (href: string, fromMenu: boolean = false) => {
      transition.entering();
      transition.exit(fromMenu ? 'menu' : 'default').then(() => {
        router.push(href);
      });
    },
    [router]
  );

  return (
    <Context.Provider value={{ navigateWithTransition }}>
      {children}
    </Context.Provider>
  );
}


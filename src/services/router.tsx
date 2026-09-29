/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export type NavigationPath =
  | '/'
  | '/login'
  | '/signup'
  | '/patient/onboarding'
  | '/doctor/onboarding'
  | '/patient/dashboard'
  | '/patient/profile'
  | '/patient/care-team'
  | '/patient/medications'
  | '/patient/twin'
  | '/patient/scanner'
  | '/patient/analysis'
  | '/patient/simulator'
  | '/patient/reports'
  | '/patient/passport'
  | '/patient/settings'
  | '/passport/view'
  | '/doctor/dashboard'
  | '/doctor/connect'
  | '/doctor/patients'
  | '/doctor/patient-detail'
  | '/doctor/patient-view'
  | '/doctor/requests'
  | '/doctor/analysis'
  | '/doctor/simulator'
  | '/doctor/reports'
  | '/doctor/profile'
  | '/doctor/settings'
  | '/access-denied';

interface RouterContextType {
  currentPath: string;
  pathname: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  attemptedRestrictedPath?: string | null;
  setAttemptedRestrictedPath: (path: string | null) => void;
  getParam: (key: string) => string | null;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function getPathFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') {
    return '/';
  }
  const clean = hash.replace(/^#/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(getPathFromHash);
  const [attemptedRestrictedPath, setAttemptedRestrictedPath] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const newPath = getPathFromHash();
      setCurrentPath(newPath);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const pathname = currentPath.split('?')[0];

  const getParam = (key: string): string | null => {
    // 1. Check hash query string (e.g. #/passport/view?token=123)
    const hashQuery = currentPath.includes('?') ? currentPath.split('?')[1] : '';
    if (hashQuery) {
      const params = new URLSearchParams(hashQuery);
      const val = params.get(key);
      if (val) return val;
    }

    // 2. Check window.location.search (e.g. ?token=123#/passport/view)
    if (typeof window !== 'undefined' && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const val = searchParams.get(key);
      if (val) return val;
    }

    return null;
  };

  const navigate = (path: string, options?: { replace?: boolean }) => {
    const formatted = path.startsWith('/') ? path : `/${path}`;
    if (options?.replace) {
      const url = `${window.location.pathname}#${formatted}`;
      window.location.replace(url);
    } else {
      window.location.hash = formatted;
    }
    setCurrentPath(formatted);
  };

  return (
    <RouterContext.Provider
      value={{
        currentPath,
        pathname,
        navigate,
        attemptedRestrictedPath,
        setAttemptedRestrictedPath,
        getParam,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

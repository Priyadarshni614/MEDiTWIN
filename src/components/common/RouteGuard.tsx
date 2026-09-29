/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRouter } from '../../services/router';
import { Activity } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();
  const { currentPath, navigate, setAttemptedRestrictedPath } = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = currentPath === '/' || currentPath === '/login' || currentPath === '/signup' || currentPath.startsWith('/passport/view');
    const isDoctorRoute = currentPath.startsWith('/doctor/');
    const isPatientRoute = currentPath.startsWith('/patient/');
    const isAccessDeniedRoute = currentPath === '/access-denied';

    // 1. Unauthenticated user trying to access protected routes
    if (!isAuthenticated) {
      if (isDoctorRoute || isPatientRoute) {
        setAttemptedRestrictedPath(currentPath);
        navigate('/login', { replace: true });
        return;
      }
      return;
    }

    // 2. Authenticated user visiting login/signup
    if (currentPath === '/login' || currentPath === '/signup') {
      if (!hasCompletedOnboarding) {
        navigate(user?.role === 'DOCTOR' ? '/doctor/onboarding' : '/patient/onboarding', { replace: true });
      } else {
        navigate(user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard', { replace: true });
      }
      return;
    }

    // 3. Authenticated user without completed onboarding trying to access dashboards
    if (!hasCompletedOnboarding) {
      if (user?.role === 'PATIENT' && currentPath !== '/patient/onboarding' && !isPublicRoute) {
        navigate('/patient/onboarding', { replace: true });
        return;
      }
      if (user?.role === 'DOCTOR' && currentPath !== '/doctor/onboarding' && !isPublicRoute) {
        navigate('/doctor/onboarding', { replace: true });
        return;
      }
    }

    // 4. Role Violation: Patient attempting Doctor route
    if (user?.role === 'PATIENT' && isDoctorRoute) {
      setAttemptedRestrictedPath(currentPath);
      navigate('/access-denied', { replace: true });
      return;
    }

    // 5. Role Violation: Doctor attempting Patient route
    if (user?.role === 'DOCTOR' && isPatientRoute) {
      setAttemptedRestrictedPath(currentPath);
      navigate('/access-denied', { replace: true });
      return;
    }

  }, [currentPath, isAuthenticated, isLoading, hasCompletedOnboarding, user, navigate, setAttemptedRestrictedPath]);

  // Loading spinner while verifying session credentials
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Verifying Clinical Authentication Session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

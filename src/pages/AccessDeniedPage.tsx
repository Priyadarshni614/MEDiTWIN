/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { ShieldX, ArrowLeft, HeartHandshake, Stethoscope } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate, attemptedRestrictedPath } = useRouter();

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';

  const returnTarget = isDoctor ? '/doctor/dashboard' : isPatient ? '/patient/dashboard' : '/login';

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-rose-200 p-8 text-center">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldX className="w-8 h-8" />
        </div>

        {/* 403 Title */}
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          403 Access Denied
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mt-4">
          Role-Based Access Restricted
        </h1>

        {/* Dynamic explanation based on role */}
        <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
          {isPatient && (
            <p>
              You are currently authenticated with a <strong className="text-sky-700">Patient Account</strong>. The requested page (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono text-xs">{attemptedRestrictedPath || 'Doctor Portal'}</code>) requires clinical Doctor credentials.
            </p>
          )}

          {isDoctor && (
            <p>
              You are currently authenticated with a <strong className="text-teal-700">Doctor Account</strong>. The requested route (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono text-xs">{attemptedRestrictedPath || 'Patient Portal'}</code>) is a private patient boundary. Doctors cannot directly open patient portals without a patient-authorized referral.
            </p>
          )}

          {!user && (
            <p>
              You must be logged in with appropriate credentials to access this area.
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            id="access-denied-return-btn"
            onClick={() => navigate(returnTarget)}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {isDoctor ? 'Doctor Dashboard' : isPatient ? 'Patient Dashboard' : 'Login'}</span>
          </button>
        </div>

        {/* Current Identity Footnote */}
        {user && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            {isPatient ? <HeartHandshake className="w-3.5 h-3.5 text-sky-600" /> : <Stethoscope className="w-3.5 h-3.5 text-teal-600" />}
            <span>Authenticated as <strong>{user.name}</strong> ({user.role})</span>
          </div>
        )}

      </div>
    </div>
  );
};

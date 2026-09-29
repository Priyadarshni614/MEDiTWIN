/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from '../services/router';
import { EmergencyPassportSummary } from '../models/passportTypes';
import { passportService } from '../services/passportService';
import { MedicationPassportCard } from '../components/passport/MedicationPassportCard';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Printer, 
  Lock, 
  HeartHandshake,
  FileText
} from 'lucide-react';

export const EmergencyPassportViewPage: React.FC = () => {
  const { getParam, navigate } = useRouter();
  const token = getParam('token');

  const [passport, setPassport] = useState<EmergencyPassportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorStatus('MISSING_TOKEN');
      setErrorMessage('No emergency access token was provided in the request link.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      setLoading(true);
      try {
        const result = await passportService.fetchSharedPassportByToken(token);
        if (!result.success || !result.data) {
          setErrorStatus(result.status || 'INVALID');
          setErrorMessage(result.error || 'Failed to verify emergency access token.');
        } else {
          setPassport(result.data);
          setExpiresAt(result.expiresAt || null);
        }
      } catch (err: any) {
        setErrorStatus('ERROR');
        setErrorMessage(err.message || 'Error communicating with verification service.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <span className="inline-block w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-emerald-400">
            Verifying Cryptographic Emergency Token...
          </h2>
          <p className="text-xs text-slate-400">
            Checking patient authorization status and expiration window
          </p>
        </div>
      </div>
    );
  }

  // ACCESS DENIED / REVOKED / EXPIRED VIEWS
  if (errorStatus || !passport) {
    const isRevoked = errorStatus === 'REVOKED';
    const isExpired = errorStatus === 'EXPIRED';

    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-5">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-inner ${
            isRevoked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">
              {isRevoked ? 'Emergency Access Revoked' : isExpired ? 'Emergency Token Expired' : 'Access Restricted'}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {errorMessage || 'This emergency access link is no longer valid.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-700/80 text-left text-xs text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Patient Privacy Guarantee:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Under MEDiTWIN AI security standards, patients maintain absolute sovereignty over their pharmacological data. Once access is revoked or the validity window passes, token validation terminates immediately.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Go to MEDiTWIN AI Portal
          </button>
        </div>
      </div>
    );
  }

  // VALID EMERGENCY PASSPORT VIEW
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Emergency Status Bar */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">Authorized Emergency Medication Passport</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                  Verified Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Authorized by patient for acute clinical reference and emergency medical triage.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            {expiresAt && (
              <div className="text-right text-xs text-slate-300">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Valid Until</span>
                <span className="font-mono text-emerald-300">{new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Passport</span>
            </button>
          </div>
        </div>

        {/* Passport Card */}
        <MedicationPassportCard passport={passport} showEmergencyBanner={true} />

        {/* Security and Informational Footer */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-1 shadow-2xs">
          <p className="font-semibold text-slate-700">
            MEDiTWIN AI Emergency Clinical Gateway
          </p>
          <p className="text-[11px] text-slate-400">
            Access to this passport is strictly read-only and governed by cryptographic patient authorization.
          </p>
        </div>

      </div>
    </div>
  );
};

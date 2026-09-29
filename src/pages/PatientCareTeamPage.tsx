/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { DoctorPatientRelationship } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { demoService } from '../services/demoService';
import { 
  Stethoscope, 
  ArrowLeft, 
  KeyRound, 
  Copy, 
  Check, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Mail, 
  Lock, 
  History,
  Info
} from 'lucide-react';

export const PatientCareTeamPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [activeDoctor, setActiveDoctor] = useState<DoctorPatientRelationship | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DoctorPatientRelationship[]>([]);
  const [pastRelationships, setPastRelationships] = useState<DoctorPatientRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Revoke confirmation dialog state
  const [revokingRel, setRevokingRel] = useState<DoctorPatientRelationship | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDemo = demoService.isDemoUser(user?.email);
  const connectionCode = patientProfile?.connectionCode || 'PT-PENDING';

  const loadCareTeam = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const active = await authorizationService.getActiveRelationshipForPatient(user.id);
      setActiveDoctor(active);

      const pending = await authorizationService.getPendingRequestsForPatient(user.id);
      setPendingRequests(pending);

      const all = await authorizationService.getRelationshipsForPatient(user.id);
      const past = all.filter((r: DoctorPatientRelationship) => r.status === 'REVOKED' || r.status === 'DECLINED');
      setPastRelationships(past);
    } catch (err) {
      console.error('Error loading care team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareTeam();
  }, [user]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleAcceptRequest = async (relId: string) => {
    if (!user) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await authorizationService.authorizeDoctor(relId, user.id);
      if (result.success) {
        setActionSuccess('Doctor connection authorized successfully! The doctor can now view your Medication Twin.');
        await loadCareTeam();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(result.error || 'Failed to authorize doctor request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during authorization.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineRequest = async (relId: string) => {
    if (!user) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await authorizationService.declineDoctor(relId, user.id);
      if (result.success) {
        setActionSuccess('Connection request declined.');
        await loadCareTeam();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(result.error || 'Failed to decline request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!user || !revokingRel) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await authorizationService.revokeDoctorAccess(revokingRel.id, user.id);
      if (result.success) {
        setActionSuccess(`Clinical access for Dr. ${revokingRel.doctorName} has been revoked.`);
        setRevokingRel(null);
        await loadCareTeam();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(result.error || 'Failed to revoke access.');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while revoking access.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            Patient Code: {connectionCode}
          </span>
        </div>

        {/* Demo Warning Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Mode
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL PATIENT INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Care Team Management
            </span>
          </div>
        )}

        {/* Status Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-medium flex items-center space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs font-medium flex items-center space-x-2.5 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Patient Privacy &amp; Care Team</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              My Doctor &amp; Care Team
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              You have complete ownership of your medication data. Healthcare professionals can only view your records when you provide your Connection Code and explicitly approve their request.
            </p>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Consent-Driven Access</span>
          </div>
        </div>

        {/* Permanent Connection Code Sharing Card */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-100">
                  Your Unique Patient Connection Code
                </span>
                <span className="px-2 py-0.5 bg-emerald-400/30 text-white text-[10px] font-semibold rounded-full border border-white/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-sky-50 mt-1 max-w-lg leading-relaxed">
                Provide this permanent code to your doctor, clinical pharmacist, or specialist. They will enter it into their portal to request clinical access. You will review and authorize the connection here.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/25 w-full md:w-auto justify-between md:justify-start">
            <span className="font-mono text-base sm:text-xl font-extrabold tracking-wider text-white select-all">
              {connectionCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-semibold"
              title="Copy Code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* PENDING CONNECTION REQUESTS */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50/70 rounded-2xl p-6 border border-amber-300/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Pending Connection Requests ({pendingRequests.length})
                </h3>
                <p className="text-xs text-amber-800">
                  The following clinician has requested access to view your Medication Twin profile.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div 
                  key={req.id}
                  className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {req.doctorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {req.doctorName.startsWith('Dr.') ? req.doctorName : `Dr. ${req.doctorName}`}
                        </h4>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                          Pending Approval
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.doctorOrganization} • {req.doctorRole}</span>
                        </div>
                        {req.doctorSpecialization && (
                          <div className="text-slate-500 text-[11px]">
                            Focus: {req.doctorSpecialization}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{req.doctorEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Doctor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE CONNECTED DOCTOR */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Current Primary Clinician</h2>
                <p className="text-xs text-slate-500">
                  The healthcare provider authorized to view your active medications and clinical profile.
                </p>
              </div>
            </div>

            {activeDoctor && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Connection</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading care team relationships...
            </div>
          ) : activeDoctor ? (
            <div className="p-5 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-lg shadow-xs shrink-0">
                  {activeDoctor.doctorName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {activeDoctor.doctorName.startsWith('Dr.') ? activeDoctor.doctorName : `Dr. ${activeDoctor.doctorName}`}
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full">
                      Authorized
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 mt-1.5 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{activeDoctor.doctorOrganization}</span>
                      <span className="text-slate-400">•</span>
                      <span>{activeDoctor.doctorRole}</span>
                    </div>

                    {activeDoctor.doctorSpecialization && (
                      <div className="text-slate-500 text-xs">
                        Specialization: <span className="font-medium text-slate-700">{activeDoctor.doctorSpecialization}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeDoctor.doctorEmail}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">
                      Authorized on {new Date(activeDoctor.authorizedAt || activeDoctor.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto flex justify-end">
                <button
                  type="button"
                  onClick={() => setRevokingRel(activeDoctor)}
                  className="px-4 py-2 bg-white border border-rose-300 hover:border-rose-400 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>Revoke Doctor Access</span>
                </button>
              </div>
            </div>
          ) : (
            /* Compliant empty state when no doctor connected */
            <div className="text-center py-10 px-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No doctor connected yet
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                To establish an authorized clinical connection, give your Connection Code <span className="font-mono font-bold text-slate-700">({connectionCode})</span> to your physician. Once they send a request, approve it above.
              </p>
              <div className="mt-5 inline-flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero unauthorized clinician data disclosure</span>
              </div>
            </div>
          )}
        </div>

        {/* Access History & Audit Log */}
        {pastRelationships.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-700">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Access Audit History
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {pastRelationships.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Dr. {r.doctorName}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({r.doctorOrganization})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      r.status === 'REVOKED' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Revoke Confirmation Dialog */}
      {revokingRel && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Revoke Clinical Access?
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Are you sure you want to revoke access for <strong className="text-slate-800">Dr. {revokingRel.doctorName}</strong> ({revokingRel.doctorOrganization})?
              </p>
              <p className="mt-2 text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                The doctor will immediately lose access to your Medication Twin, chronic conditions, and active medications.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevokingRel(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Revoking...' : 'Confirm Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

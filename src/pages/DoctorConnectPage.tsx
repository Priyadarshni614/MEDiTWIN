/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { PatientProfile } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { demoService } from '../services/demoService';
import { 
  UserPlus, 
  ArrowLeft, 
  KeyRound, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export const DoctorConnectPage: React.FC = () => {
  const { user, doctorProfile } = useAuth();
  const { navigate } = useRouter();

  const [inputCode, setInputCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [patientPreview, setPatientPreview] = useState<PatientProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alreadyStatus, setAlreadyStatus] = useState<string | null>(null);

  const isDemoDoctor = user?.email?.toLowerCase().includes('joel') || user?.email?.toLowerCase().includes('demo');

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || inputCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter a patient connection code.');
      return;
    }

    setSearching(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAlreadyStatus(null);
    setPatientPreview(null);

    try {
      const patient = await authorizationService.getPatientByConnectionCode(code);
      if (!patient) {
        setErrorMessage(`No patient found matching connection code "${code}". Please ask the patient to confirm their code.`);
        return;
      }

      // Check existing relationship
      if (user) {
        const existingRel = await authorizationService.checkExistingRelationship(user.id, patient.userId);
        if (existingRel) {
          if (existingRel.status === 'ACTIVE') {
            setAlreadyStatus(`You already have an ACTIVE authorized relationship with ${patient.fullName}. You can view their profile directly.`);
          } else if (existingRel.status === 'PENDING') {
            setAlreadyStatus(`A connection request is already PENDING for ${patient.fullName}. Awaiting patient approval.`);
          }
        }
      }

      setPatientPreview(patient);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error looking up patient code.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !patientPreview) return;
    setSendingRequest(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await authorizationService.requestConnectionByCode(user.id, patientPreview.connectionCode);
      if (result.success) {
        setSuccessMessage(`Connection request sent to ${patientPreview.fullName}! They must now log into their portal and accept the request.`);
        setAlreadyStatus('PENDING');
      } else {
        setErrorMessage(result.error || 'Failed to send connection request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleFillDemoCode = () => {
    const demoCode = 'PT-ANGELIN-4821';
    setInputCode(demoCode);
    handleLookup(demoCode);
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Doctor Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/doctor/requests')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
          >
            View Pending Requests →
          </button>
        </div>

        {/* Demo Doctor Banner */}
        {isDemoDoctor && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Mode
              </span>
              <span className="font-semibold">Dr. Joel Miller Demo Active</span>
            </div>
            <button
              onClick={handleFillDemoCode}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Connect Angelin Steve (PT-ANGELIN-4821)</span>
            </button>
          </div>
        )}

        {/* Card: Connect Patient by Code */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Patient Authorization Workflow</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Connect With Patient
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              MediTwin AI mandates strict patient consent. To connect with a patient, request their unique <strong className="text-slate-700">Patient Connection Code</strong>, verify their identity, and submit an authorization request.
            </p>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Lookup Notice: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Request Dispatched: </span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Search Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Patient Connection Code
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="doc-connect-input"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. PT-ANGELIN-4821"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all uppercase"
                />
              </div>

              <button
                type="button"
                id="doc-connect-lookup-btn"
                onClick={() => handleLookup()}
                disabled={searching || !inputCode.trim()}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {searching ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Patients find their code on their Dashboard or Profile page. Format: PT-NAME-XXXX
            </p>
          </div>

          {/* Quick Demo Pre-Fill */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Demo Scenario:</span>
            <button
              type="button"
              onClick={handleFillDemoCode}
              className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Use Angelin Steve's Code (PT-ANGELIN-4821)
            </button>
          </div>

          {/* Patient Preview Card */}
          {patientPreview && (
            <div className="mt-6 p-5 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                    {patientPreview.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {patientPreview.fullName}
                    </h3>
                    <div className="text-xs text-slate-600 mt-0.5 space-x-2">
                      <span>Age: {patientPreview.age} yrs</span>
                      <span>•</span>
                      <span className="capitalize">{patientPreview.gender}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{patientPreview.connectionCode}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                  Code Verified
                </span>
              </div>

              {/* Privacy Wall Warning */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-slate-800">Privacy Protection Active: </strong>
                  Medical history, chronic conditions, and medication regimens remain encrypted and hidden until the patient authorizes this request from their portal.
                </div>
              </div>

              {alreadyStatus ? (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span>{alreadyStatus}</span>
                  {alreadyStatus.includes('ACTIVE') ? (
                    <button
                      onClick={() => navigate(`/doctor/patient-view?patientId=${patientPreview.userId}`)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Open Patient Chart →
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/doctor/requests')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Check Status →
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    id="doc-send-request-btn"
                    onClick={handleSendRequest}
                    disabled={sendingRequest}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sendingRequest ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Send Connection Request</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

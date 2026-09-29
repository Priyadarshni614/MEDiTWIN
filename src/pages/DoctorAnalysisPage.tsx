/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { authorizationService } from '../services/authorizationService';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { medicationService } from '../services/medicationService';
import { PatientProfile, DoctorPatientRelationship, Medication } from '../models/types';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { SafetyAnalysisView } from '../components/safety/SafetyAnalysisView';
import {
  ShieldAlert,
  ArrowLeft,
  Users,
  AlertOctagon,
  RefreshCw,
  Clock,
  User,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const DoctorAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const { getParam, navigate } = useRouter();

  const [authorizedPatients, setAuthorizedPatients] = useState<{
    relationship: DoctorPatientRelationship;
    profile: PatientProfile;
  }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [patientMeds, setPatientMeds] = useState<Medication[]>([]);
  const [report, setReport] = useState<MedicationSafetyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialPatientId = getParam('patientId');

  // Load doctor's authorized patients
  useEffect(() => {
    if (!user) return;

    const loadAuthorizedPatients = async () => {
      setLoading(true);
      try {
        const patients = await authorizationService.getAuthorizedPatientsForDoctor(user.id);
        setAuthorizedPatients(patients);

        if (initialPatientId && patients.some((p) => p.profile.userId === initialPatientId)) {
          setSelectedPatientId(initialPatientId);
        } else if (patients.length > 0) {
          setSelectedPatientId(patients[0].profile.userId);
        }
      } catch (err: any) {
        console.error('Error fetching authorized patients:', err);
        setError('Failed to load authorized patient panel.');
      } finally {
        setLoading(false);
      }
    };

    loadAuthorizedPatients();
  }, [user, initialPatientId]);

  // When selectedPatientId changes, run/fetch safety analysis
  const runAnalysis = useCallback(async () => {
    if (!user || !selectedPatientId) return;

    setAnalyzing(true);
    setError(null);
    try {
      const isAuth = await authorizationService.canDoctorAccessPatient(user.id, selectedPatientId);
      if (!isAuth) {
        setError('Access denied: You do not possess an active authorization relationship with this patient.');
        setReport(null);
        return;
      }

      const found = authorizedPatients.find((p) => p.profile.userId === selectedPatientId);
      if (found) {
        setSelectedPatientProfile(found.profile);
      }

      const activeMeds = await medicationService.getActiveMedications(selectedPatientId);
      setPatientMeds(activeMeds);

      const safetyReport = await safetyAnalysisService.getAuthorizedPatientSafetyAnalysis(
        user.id,
        selectedPatientId
      );
      setReport(safetyReport);
    } catch (err: any) {
      console.error('Failed to run doctor safety analysis:', err);
      setError(err?.message || 'Error generating clinical safety review.');
    } finally {
      setAnalyzing(false);
    }
  }, [user, selectedPatientId, authorizedPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      runAnalysis();
    }
  }, [selectedPatientId, runAnalysis]);

  if (loading) {
    return (
      <div className="flex-1 py-16 px-4 bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Checking clinical authorization permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Patient Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Doctor Dashboard</span>
          </button>

          {/* Patient Selector Dropdown */}
          {authorizedPatients.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Authorized Patient:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-teal-600 cursor-pointer"
              >
                {authorizedPatients.map((p) => (
                  <option key={p.profile.userId} value={p.profile.userId}>
                    {p.profile.fullName} (Age: {p.profile.age} • {p.relationship.patientConnectionCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Doctor Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>Phase 4 • Clinical Pharmacotherapy Risk Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Patient Medication Safety Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Evidence-based polypharmacy review synthesizing FDA clinical pharmacology labeling, 2023 AGS Beers Criteria, duplicate ingredient detection, and documented patient hypersensitivities.
            </p>
          </div>

          {selectedPatientId && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Evaluating...' : 'Re-run Clinical Check'}</span>
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block">Authorization or Execution Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Zero Authorized Patients */}
        {authorizedPatients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                No Authorized Patient Connections
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You do not currently have any active patient relationships authorized to review. Request connection using the patient&apos;s connection code.
              </p>
            </div>
            <button
              onClick={() => navigate('/doctor/connect')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Connect a Patient</span>
            </button>
          </div>
        ) : (
          report && (
            <SafetyAnalysisView
              report={report}
              userRole="DOCTOR"
              onReanalyze={runAnalysis}
              isReanalyzing={analyzing}
            />
          )
        )}
      </div>
    </div>
  );
};

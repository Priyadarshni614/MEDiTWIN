/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { medicationService } from '../services/medicationService';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { Medication } from '../models/types';
import { SafetyAnalysisView } from '../components/safety/SafetyAnalysisView';
import {
  ShieldAlert,
  ArrowLeft,
  Dna,
  RefreshCw,
  Plus,
  AlertCircle,
  Pill,
} from 'lucide-react';

export const PatientAnalysisPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [report, setReport] = useState<MedicationSafetyReport | null>(null);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!user) return;
    setAnalyzing(true);
    setError(null);
    try {
      const active = await medicationService.getActiveMedications(user.id);
      setActiveMeds(active);

      const newReport = await safetyAnalysisService.runAnalysisForPatient(user.id);
      setReport(newReport);
    } catch (err: any) {
      console.error('Safety analysis failed:', err);
      setError(err?.message || 'Failed to complete medication safety analysis.');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (loading) {
    return (
      <div className="flex-1 py-16 px-4 bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Synthesizing clinical safety data against active Medication Twin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumb / Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patient/twin')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Medication Twin</span>
          </button>
          
          <button
            onClick={() => navigate('/patient/twin')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            <Dna className="w-4 h-4" />
            <span>Manage Regimen ({activeMeds.length} Active)</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Phase 4 • Clinical Medication Safety Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Medication Safety &amp; Interaction Review
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Real-time pharmacological evaluation of your active medications against documented allergies, age parameters, chronic health conditions, and drug-drug interactions.
            </p>
          </div>

          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Safety...' : 'Run New Safety Check'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block">Analysis Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State: Zero Active Medications */}
        {activeMeds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                No Active Medications to Analyze
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your Medication Twin currently does not have any active prescription drugs. Add your medications or scan a prescription slip to run a complete safety check.
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/twin')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication to Twin</span>
            </button>
          </div>
        ) : (
          report && (
            <SafetyAnalysisView
              report={report}
              userRole="PATIENT"
              onReanalyze={runAnalysis}
              isReanalyzing={analyzing}
            />
          )
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { Medication, PatientProfile } from '../models/types';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { EmergencyPassportShare } from '../models/passportTypes';
import { medicationService } from '../services/medicationService';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { authorizationService } from '../services/authorizationService';
import { pdfReportService } from '../services/pdfReportService';
import { passportService } from '../services/passportService';
import { demoService } from '../services/demoService';
import { 
  FileText, 
  Download, 
  Printer, 
  QrCode, 
  ShieldAlert, 
  ShieldCheck, 
  Pill, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  Calendar,
  BookOpen
} from 'lucide-react';

export const PatientReportsPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [safetyReport, setSafetyReport] = useState<MedicationSafetyReport | null>(null);
  const [activeShare, setActiveShare] = useState<EmergencyPassportShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isDemo = demoService.isDemoUser(user?.email);

  useEffect(() => {
    if (!user) return;

    const loadReportData = async () => {
      setLoading(true);
      try {
        const meds = await medicationService.getActiveMedications(user.id);
        setActiveMeds(meds);

        let report = await safetyAnalysisService.getLatestReportForPatient(user.id);
        if (!report && patientProfile) {
          try {
            report = await safetyAnalysisService.runAnalysisForPatient(user.id);
          } catch (e) {
            console.warn('Could not auto-generate safety report:', e);
          }
        }
        setSafetyReport(report);

        const share = await passportService.getActiveShare(user.id);
        setActiveShare(share);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [user, patientProfile]);

  const handleDownloadPdf = async () => {
    if (!patientProfile || !user) return;
    setDownloadingPdf(true);
    try {
      const rel = await authorizationService.getActiveRelationshipForPatient(user.id);

      const doc = pdfReportService.generateMedicationReport({
        patient: patientProfile,
        medications: activeMeds,
        safetyReport,
        relationship: rel,
        reportTitle: 'Official Medication Twin & Safety Analysis Report',
      });

      doc.save(`meditwin-clinical-report-${patientProfile.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      setFeedback('Official Medication Report PDF downloaded successfully.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 py-16 px-4 bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Compiling Clinical Medication Reports...
          </p>
        </div>
      </div>
    );
  }

  const verifiedFindings = (safetyReport?.findings || []).filter((f) => f.verificationState === 'VERIFIED');

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Demo Patient Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Patient
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL PATIENT INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Reports Center
            </span>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs text-emerald-900 flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Clinical Reports &amp; Exports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Medication Twin Reports &amp; Exports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Generate official clinical summaries, export high-fidelity PDF documentation, and print medication reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              id="report-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>

            <button
              id="report-print-btn"
              onClick={() => window.print()}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Print Clinical Report"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Quick Report Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Official Medication Twin */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Medication Twin
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200">
                  Official Record
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeMeds.length} Active Medications
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Reflects verified active prescriptions and self-recorded drugs. Excludes temporary simulation scenarios.
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/twin')}
              className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center space-x-1 pt-2 border-t border-slate-100"
            >
              <span>Manage Active Regimen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Verified Safety Findings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phase 4 Safety Analysis
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  verifiedFindings.length > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {verifiedFindings.length} Verified Issues
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {safetyReport?.scoreBreakdown?.isCalculable ? `Score: ${safetyReport.scoreBreakdown.score}/100` : 'Score Unavailable'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Allergy contraindications, duplicate therapies, and drug interactions screened against verified rules.
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/analysis')}
              className="text-xs text-rose-700 hover:text-rose-800 font-bold flex items-center space-x-1 pt-2 border-t border-slate-100"
            >
              <span>View Safety Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Emergency Passport Status */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Emergency QR Status
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  activeShare && activeShare.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {activeShare && activeShare.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeShare && activeShare.status === 'ACTIVE' ? 'Sharing Enabled' : 'Sharing Disabled'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Time-limited, revocable cryptographic link for first responders without exposing raw data in the QR.
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/passport')}
              className="text-xs text-slate-800 hover:text-teal-700 font-bold flex items-center space-x-1 pt-2 border-t border-slate-100"
            >
              <span>Open Emergency Passport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Live Preview of Official Report Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Official Medication Report Preview
              </h2>
              <p className="text-xs text-slate-500">
                Data included in your exportable clinical PDF summary
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Report Target: {patientProfile?.fullName || 'Authenticated Patient'}
            </span>
          </div>

          {/* Section: Patient Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Name</span>
              <span className="font-bold text-slate-800">{patientProfile?.fullName || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
              <span className="font-semibold text-slate-800">
                {patientProfile?.age ? `${patientProfile.age} yrs` : 'Not provided'} / {patientProfile?.gender || 'Not provided'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Allergies</span>
              <span className="font-semibold text-rose-700">
                {patientProfile?.allergies?.length ? patientProfile.allergies.join(', ') : 'None recorded'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Conditions</span>
              <span className="font-semibold text-slate-800">
                {patientProfile?.chronicConditions?.length ? patientProfile.chronicConditions.join(', ') : 'None recorded'}
              </span>
            </div>
          </div>

          {/* Active Drugs Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Medications ({activeMeds.length})
            </h3>
            {activeMeds.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                No active medications currently registered.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Medication</th>
                      <th className="px-4 py-2 text-left">Strength</th>
                      <th className="px-4 py-2 text-left">Dose &amp; Frequency</th>
                      <th className="px-4 py-2 text-left">Route</th>
                      <th className="px-4 py-2 text-left">Prescriber / Source</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {activeMeds.map((med) => (
                      <tr key={med.id}>
                        <td className="px-4 py-2 font-bold text-slate-900">
                          {med.name} {med.brandName && <span className="text-slate-500 font-normal">({med.brandName})</span>}
                        </td>
                        <td className="px-4 py-2 text-slate-700">{med.strength || 'Not provided'}</td>
                        <td className="px-4 py-2 text-slate-700">{med.dosage || 'Not provided'} • {med.frequency || 'Not provided'}</td>
                        <td className="px-4 py-2 text-slate-700 capitalize">{med.route || 'Not provided'}</td>
                        <td className="px-4 py-2 text-slate-500 text-[11px]">{med.prescribedBy || (med.source === 'PRESCRIPTION_OCR' ? 'OCR Slip' : 'Self-recorded')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Safety Findings List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Safety Analysis Findings ({verifiedFindings.length})
            </h3>
            {verifiedFindings.length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                No verified clinical contraindications or high-risk interactions identified in current active list.
              </div>
            ) : (
              <div className="space-y-2">
                {verifiedFindings.map((f) => (
                  <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">[{f.severity?.toUpperCase()}] {f.title}</span>
                      <span className="text-[10px] text-slate-500">{f.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{f.explanation}</p>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Documented Source Reference: {f.sourceReference}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advisory Box */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Medical Disclaimer:</strong> This official report is compiled solely for informational reference and clinical review. It does NOT constitute a prescription, medical order, or clinical recommendation. All medication decisions must be evaluated by a licensed prescribing physician or clinical pharmacist.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

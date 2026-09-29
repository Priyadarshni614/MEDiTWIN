/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { PatientProfile, DoctorPatientRelationship, Medication, Prescription, MedicationTwin } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { medicationService } from '../services/medicationService';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { pdfReportService } from '../services/pdfReportService';
import { demoService } from '../services/demoService';
import { MedicationDetailsModal } from '../components/medications/MedicationDetailsModal';
import { PrescriptionDetailsModal } from '../components/medications/PrescriptionDetailsModal';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Phone, 
  AlertTriangle, 
  HeartPulse, 
  Pill, 
  Activity, 
  Lock, 
  Clock, 
  CheckCircle2, 
  Sliders, 
  FileSpreadsheet,
  Building2,
  Calendar,
  History,
  FileText,
  Eye,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';

export const DoctorPatientViewPage: React.FC = () => {
  const { user } = useAuth();
  const { getParam, navigate } = useRouter();

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [relationship, setRelationship] = useState<DoctorPatientRelationship | null>(null);
  const [medicationTwin, setMedicationTwin] = useState<MedicationTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Active view tab for chart: 'profile' vs 'twin'
  const [chartTab, setChartTab] = useState<'profile' | 'twin'>('twin');
  const [twinSubTab, setTwinSubTab] = useState<'active' | 'history' | 'prescriptions'>('active');

  // Modals for doctor (read-only)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const patientId = getParam('patientId');
  const isDemo = demoService.isDemoUser(patient?.fullName);

  useEffect(() => {
    if (!user || !patientId) {
      setAccessDenied(true);
      setDenialReason('Missing doctor authentication or patient identifier.');
      setLoading(false);
      return;
    }

    const verifyAndLoad = async () => {
      setLoading(true);
      setAccessDenied(false);

      try {
        // Enforce strict relationship verification
        const authorizedProfile = await authorizationService.getAuthorizedPatientProfile(user.id, patientId);

        if (!authorizedProfile) {
          setAccessDenied(true);
          setDenialReason('You do not possess an active, patient-authorized relationship to view this clinical record. The patient has either not granted authorization or has revoked access.');
          setLoading(false);
          return;
        }

        // Fetch relationship details
        const rel = await authorizationService.checkExistingRelationship(user.id, patientId);
        setRelationship(rel);
        setPatient(authorizedProfile);

        // Fetch authorized live Medication Twin
        const twin = await medicationService.getAuthorizedPatientMedicationTwin(user.id, patientId);
        setMedicationTwin(twin);
      } catch (err: any) {
        setAccessDenied(true);
        setDenialReason(err.message || 'Authorization verification failed.');
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoad();
  }, [user, patientId]);

  const handleDownloadPdf = async () => {
    if (!patient || !user) return;
    setDownloadingPdf(true);
    try {
      const activeMeds = medicationTwin?.activeMedications || [];
      const safetyReport = await safetyAnalysisService.getAuthorizedPatientSafetyAnalysis(user.id, patient.userId);

      const doc = pdfReportService.generateMedicationReport({
        patient,
        medications: activeMeds,
        safetyReport,
        relationship,
        reportTitle: `Authorized Clinical Medication Report — ${patient.fullName}`,
      });

      doc.save(`clinical-report-${patient.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF report for doctor:', err);
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
            Enforcing relationship cryptographic permissions...
          </p>
        </div>
      </div>
    );
  }

  // ACCESS DENIED VIEW
  if (accessDenied || !patient) {
    return (
      <div className="flex-1 py-12 px-4 bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-rose-200 shadow-lg text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Zero-Trust Enforcement
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Clinical Access Denied
            </h2>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {denialReason || 'Access to this patient record requires explicit, active patient authorization.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2 text-left">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              In MediTwin AI, patient data belongs exclusively to the patient. Knowing an ID or URL parameter does not bypass relationship consent.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => navigate('/doctor/patients')}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to My Patients
            </button>
            <button
              onClick={() => navigate('/doctor/connect')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Request Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHORIZED PATIENT CHART VIEW
  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Back Link & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/doctor/patients')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Patients</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Active Authorized Clinical Access</span>
          </div>
        </div>

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
              Angelin Steve • Sample Patient Case
            </span>
          </div>
        )}

        {/* Patient Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-xs shrink-0">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {patient.fullName}
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Authorized
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                <span>Age: <strong className="text-slate-700">{patient.age}</strong></span>
                <span>•</span>
                <span className="capitalize">Gender: <strong className="text-slate-700">{patient.gender}</strong></span>
                {patient.weight && (
                  <>
                    <span>•</span>
                    <span>Weight: <strong className="text-slate-700">{patient.weight}</strong></span>
                  </>
                )}
                <span>•</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {patient.connectionCode}
                </span>
              </div>

              {relationship && (
                <div className="text-[11px] text-slate-400 mt-2 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Authorization active since {new Date(relationship.authorizedAt || relationship.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate(`/doctor/reports?patientId=${patient.userId}`)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Reports &amp; Passport</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={() => navigate(`/doctor/simulator?patientId=${patient.userId}`)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Simulate What-If</span>
            </button>
            <button
              onClick={() => navigate(`/doctor/analysis?patientId=${patient.userId}`)}
              className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Analyze Safety</span>
            </button>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">
              Read-only clinical view — Authorized Clinical Access
            </span>
          </div>
        </div>

        {/* Clinical Chart Mode Switcher: Medication Twin vs Safety Analysis vs Clinical Profile */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setChartTab('twin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              chartTab === 'twin'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Personalized Medication Twin ({medicationTwin?.totalActiveMedications || 0})</span>
          </button>

          <button
            onClick={() => navigate(`/doctor/analysis?patientId=${patient.userId}`)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Medication Safety Analysis</span>
          </button>

          <button
            onClick={() => setChartTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              chartTab === 'profile'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Patient Clinical Baseline &amp; Vitals</span>
          </button>
        </div>

        {/* TAB 1: PERSONALIZED MEDICATION TWIN (DOCTOR READ-ONLY) */}
        {chartTab === 'twin' && (
          <div className="space-y-5">
            
            {/* Required Stage 4 Notice */}
            <div className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 rounded-2xl border border-sky-300 flex items-start space-x-3 text-xs shadow-xs">
              <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sky-950 text-sm">
                  Clinical Decision Support Engine (Phase 4 Ready)
                </h4>
                <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                  Risk analysis will be available in the next phase. Drug-drug interactions, duplicate therapies, Beer's criteria geriatric risks, and anticholinergic cognitive burdens will be computed from this patient's live Medication Twin.
                </p>
              </div>
            </div>

            {/* Sub-tabs for Doctor: Current / History / Prescriptions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTwinSubTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  twinSubTab === 'active'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active Regimen ({medicationTwin?.activeMedications.length || 0})
              </button>
              <button
                onClick={() => setTwinSubTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  twinSubTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Medication History ({medicationTwin?.medicationHistory.length || 0})
              </button>
              <button
                onClick={() => setTwinSubTab('prescriptions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  twinSubTab === 'prescriptions'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Prescription Records ({medicationTwin?.prescriptions.length || 0})
              </button>
            </div>

            {/* Active Regimen Cards */}
            {twinSubTab === 'active' && (
              <div>
                {(!medicationTwin?.activeMedications || medicationTwin.activeMedications.length === 0) ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-xs text-slate-500">
                    No active medications recorded for this patient.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medicationTwin.activeMedications.map((med) => (
                      <div
                        key={med.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {med.strength || 'Standard'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                              {med.source === 'PRESCRIPTION_OCR' ? 'Prescription Scan' : 'Manual Entry'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900">{med.name}</h3>
                          {med.genericName && (
                            <p className="text-xs text-slate-500 mt-0.5">Generic: {med.genericName}</p>
                          )}

                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Dosage:</span>
                              <span className="font-semibold text-slate-800">{med.dosage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Frequency:</span>
                              <span className="font-semibold text-slate-800">{med.frequency}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Route:</span>
                              <span className="font-semibold text-slate-800">{med.route}</span>
                            </div>
                          </div>

                          {med.purpose && (
                            <p className="mt-2 text-xs text-slate-600 line-clamp-1">
                              <span className="text-slate-400">Indication:</span> {med.purpose}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Prescriber: {med.prescribedBy || 'Clinic'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedMedication(med)}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Clinical Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Historical Regimen */}
            {twinSubTab === 'history' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {(!medicationTwin?.medicationHistory || medicationTwin.medicationHistory.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No historical medications recorded for this patient.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {medicationTwin.medicationHistory.map((med) => (
                      <div key={med.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {med.strength}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              DISCONTINUED
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {med.dosage} • {med.frequency} • {med.route}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Active from {med.startDate || 'Prior'} to {med.endDate || 'Discontinued'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMedication(med)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescriptions */}
            {twinSubTab === 'prescriptions' && (
              <div>
                {(!medicationTwin?.prescriptions || medicationTwin.prescriptions.length === 0) ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-400">
                    No prescription slips uploaded by this patient.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medicationTwin.prescriptions.map((rx) => (
                      <div key={rx.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                        <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                          <img src={rx.imageUrl} alt={rx.fileName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 truncate">{rx.fileName}</h4>
                          <p className="text-[11px] text-slate-500">Doctor: {rx.doctorName || 'Not stated'}</p>
                          <p className="text-[11px] text-slate-500">Date: {rx.prescriptionDate || 'Undetected'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPrescription(rx)}
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        >
                          View Prescription Document
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PATIENT CLINICAL BASELINE (CONDITIONS, ALLERGIES, EMERGENCY) */}
        {chartTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Chronic Conditions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900">Chronic Conditions</h2>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  {patient.chronicConditions?.length || 0}
                </span>
              </div>

              {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                <div className="space-y-2">
                  {patient.chronicConditions.map((cond, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs font-medium text-amber-950 flex items-center justify-between"
                    >
                      <span>{cond}</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        Documented
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No chronic medical conditions recorded.
                </p>
              )}
            </div>

            {/* Documented Allergies */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">Known Allergies</h2>
                </div>
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                  {patient.allergies?.length || 0}
                </span>
              </div>

              {patient.allergies && patient.allergies.length > 0 ? (
                <div className="space-y-2">
                  {patient.allergies.map((allergy, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/60 text-xs font-semibold text-rose-950 flex items-center justify-between"
                    >
                      <span>{allergy}</span>
                      <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                        High Alert
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No active allergies documented.
                </p>
              )}
            </div>

            {/* Emergency Contact & Vitals */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Emergency Contact</h2>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              {patient.emergencyContact?.name ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                    <span className="font-bold text-slate-900">{patient.emergencyContact.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Relationship</span>
                    <span className="font-medium text-slate-700">{patient.emergencyContact.relationship}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-mono font-bold text-teal-700">{patient.emergencyContact.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No emergency contact registered.
                </p>
              )}

              {patient.pregnancyStatus && patient.pregnancyStatus !== 'not-applicable' && (
                <div className="pt-2 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pregnancy Status</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {patient.pregnancyStatus.replace('-', ' ')}
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* READ-ONLY MODALS FOR DOCTOR */}
        <MedicationDetailsModal
          isOpen={!!selectedMedication}
          onClose={() => setSelectedMedication(null)}
          medication={selectedMedication}
          isReadOnly={true}
        />

        <PrescriptionDetailsModal
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          prescription={selectedPrescription}
        />

      </div>
    </div>
  );
};

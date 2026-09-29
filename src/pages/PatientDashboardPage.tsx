/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { DoctorPatientRelationship, Medication, Prescription } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { medicationService } from '../services/medicationService';
import { prescriptionService } from '../services/prescriptionService';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { passportService } from '../services/passportService';
import { pdfReportService } from '../services/pdfReportService';
import { demoService } from '../services/demoService';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { EmergencyPassportSummary, EmergencyPassportShare } from '../models/passportTypes';
import { EmergencyQrModal } from '../components/passport/EmergencyQrModal';
import { 
  HeartHandshake, 
  Dna, 
  Pill, 
  ScanLine, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  QrCode, 
  UserCheck, 
  ArrowRight, 
  Stethoscope, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Clock,
  Sparkles,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';

export const PatientDashboardPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [activeDoctorRel, setActiveDoctorRel] = useState<DoctorPatientRelationship | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DoctorPatientRelationship[]>([]);
  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [safetyReport, setSafetyReport] = useState<MedicationSafetyReport | null>(null);
  const [passportSummary, setPassportSummary] = useState<EmergencyPassportSummary | null>(null);
  const [activeShare, setActiveShare] = useState<EmergencyPassportShare | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isDemo = demoService.isDemoUser(user?.email);

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      const active = await authorizationService.getActiveRelationshipForPatient(user.id);
      setActiveDoctorRel(active);

      const pending = await authorizationService.getPendingRequestsForPatient(user.id);
      setPendingRequests(pending);

      const meds = await medicationService.getActiveMedications(user.id);
      setActiveMedications(meds);

      const rx = await prescriptionService.getPrescriptions(user.id);
      setPrescriptions(rx);

      try {
        let rep = await safetyAnalysisService.getLatestReportForPatient(user.id);
        if (!rep && patientProfile) {
          try {
            rep = await safetyAnalysisService.runAnalysisForPatient(user.id);
          } catch (e) {
            console.warn('Could not auto-generate safety report:', e);
          }
        }
        setSafetyReport(rep);

        const summary = await passportService.getEmergencyPassportSummary(user.id);
        setPassportSummary(summary);

        const share = await passportService.getActiveShare(user.id);
        setActiveShare(share);
      } catch (err) {
        console.error('Failed to load passport/safety data:', err);
      }
    };
    fetchDashboardData();
  }, [user, patientProfile]);

  const handleDownloadPdf = async () => {
    if (!patientProfile || !user) return;
    setDownloadingPdf(true);
    try {
      const doc = pdfReportService.generateMedicationReport({
        patient: patientProfile,
        medications: activeMedications,
        safetyReport,
        relationship: activeDoctorRel,
        reportTitle: 'Official Clinical Medication Twin Report',
      });
      doc.save(`meditwin-report-${patientProfile.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      setActionFeedback('Official Medication Report PDF downloaded successfully.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGenerateShare = async (durationHours: number) => {
    if (!user) return;
    try {
      const share = await passportService.createEmergencyShare(user.id, durationHours);
      setActiveShare(share);
      setActionFeedback(`Emergency QR Code active for ${durationHours} hours.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to generate share:', err);
    }
  };

  const handleRevokeShare = async () => {
    if (!user) return;
    try {
      await passportService.revokeEmergencyShare(user.id, activeShare?.token);
      setActiveShare(null);
      setActionFeedback('Emergency QR access revoked immediately.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  };

  const patientDisplayName = patientProfile?.fullName || user?.name || 'Patient';

  const moduleCards = [
    {
      id: 'my-care-team',
      title: 'My Doctor & Care Team',
      route: '/patient/care-team',
      icon: Stethoscope,
      color: 'teal',
      description: 'Manage authorized healthcare providers and review incoming clinical connection requests.',
      status: activeDoctorRel ? 'Connected' : 'Action available',
      statusColor: activeDoctorRel ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200',
      actionText: 'Manage Team',
    },
    {
      id: 'medication-twin',
      title: 'Medication Twin',
      route: '/patient/twin',
      icon: Dna,
      color: 'sky',
      description: 'Your individualized pharmacological replica synthesized from your age, organ factors, and drug history.',
      status: `${activeMedications.length} active drugs`,
      statusColor: 'bg-teal-50 text-teal-700 border-teal-200 font-bold',
      actionText: 'Open Twin',
    },
    {
      id: 'current-medications',
      title: 'Current Medications',
      route: '/patient/twin',
      icon: Pill,
      color: 'teal',
      description: 'Active prescriptions, over-the-counter supplements, and scheduled dosing regimens.',
      status: `${activeMedications.length} active drugs`,
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      actionText: 'Manage Drugs',
    },
    {
      id: 'prescription-scanner',
      title: 'Prescription Scanner',
      route: '/patient/scanner',
      icon: ScanLine,
      color: 'indigo',
      description: 'Digitize physical prescription slips and medication bottle labels into structured clinical entries.',
      status: `${prescriptions.length} uploaded`,
      statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold',
      actionText: 'Scan Prescription',
    },
    {
      id: 'safety-analysis',
      title: 'Medication Safety Analysis',
      route: '/patient/analysis',
      icon: ShieldAlert,
      color: 'amber',
      description: 'Real-time multi-drug interaction screening and anticholinergic cognitive burden assessment.',
      status: 'Active / Screened',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      actionText: 'View Analysis',
    },
    {
      id: 'what-if-simulator',
      title: 'What-If Simulator',
      route: '/patient/simulator',
      icon: Sliders,
      color: 'purple',
      description: 'Simulate prospective new medications before taking them to preview safety and interaction changes.',
      status: 'Active / Ready',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
      actionText: 'Run Simulator',
    },
    {
      id: 'reports',
      title: 'Reports',
      route: '/patient/reports',
      icon: FileText,
      color: 'blue',
      description: 'Exportable clinical summaries and polypharmacy medication audits formatted for doctor consultations.',
      status: 'Active / Export PDF',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
      actionText: 'Open Reports',
    },
    {
      id: 'emergency-passport',
      title: 'Emergency Medication Passport',
      route: '/patient/passport',
      icon: QrCode,
      color: 'emerald',
      description: 'Quick-access medical summary and critical allergy alert card for first responders.',
      status: activeShare && activeShare.status === 'ACTIVE' ? 'Active / QR Enabled' : 'Ready / Generate QR',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      actionText: 'View Passport',
    },
  ];

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Demo Warning Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Patient
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL PATIENT INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Polypharmacy Profile Active
            </span>
          </div>
        )}

        {/* Personalized Welcome Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Patient Medication Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {patientDisplayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Your personalized medication profile is securely active. Review your health parameters, active medications, and safety analytics.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="patient-dash-care-team-btn"
              onClick={() => navigate('/patient/care-team')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100/70 text-teal-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>My Doctor &amp; Care Team</span>
            </button>
            <button
              id="patient-dash-edit-profile-btn"
              onClick={() => navigate('/patient/profile')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-slate-700 hover:text-sky-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Pending Request Alert Banner if any */}
        {pendingRequests.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 rounded-2xl border border-sky-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-sky-950">
                  Doctor Connection Request Pending ({pendingRequests.length})
                </h4>
                <p className="text-xs text-sky-800 mt-0.5">
                  Dr. {pendingRequests[0].doctorName} ({pendingRequests[0].doctorRole}) has requested access to your medication profile.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/care-team')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Review &amp; Authorize Request
            </button>
          </div>
        )}

        {/* Real Summary Cards (Phase 2 Requirement) */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Medication Safety &amp; Profile Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* 1. Medication Twin */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Medication Twin
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  Not configured yet
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <Dna className="w-4 h-4 text-sky-500" />
                <span>Stage 2 Feature</span>
              </div>
            </div>

            {/* 2. Active Medications */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Active Medications
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  0 medications
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <Pill className="w-4 h-4 text-teal-500" />
                <span>No fake data</span>
              </div>
            </div>

            {/* 3. Health Conditions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Health Conditions
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block truncate" title={patientProfile?.chronicConditions?.join(', ')}>
                  {patientProfile?.chronicConditions?.length
                    ? `${patientProfile.chronicConditions.length} registered`
                    : 'None reported'}
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">
                  {patientProfile?.chronicConditions?.[0] || 'Clear profile'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* 4. Allergies */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Allergies
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block truncate" title={patientProfile?.allergies?.join(', ')}>
                  {patientProfile?.allergies?.length
                    ? `${patientProfile.allergies.length} reported`
                    : 'None reported'}
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">
                  {patientProfile?.allergies?.[0] || 'No allergies recorded'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* 5. Connected Doctor */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Connected Doctor
                </span>
                {activeDoctorRel ? (
                  <div>
                    <span className="text-sm font-bold text-teal-700 mt-1 block truncate">
                      {activeDoctorRel.doctorName}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {activeDoctorRel.doctorOrganization}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-600 mt-1 block">
                    No doctor connected yet
                  </span>
                )}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {activeDoctorRel ? (
                  <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active Provider</span>
                  </span>
                ) : (
                  <button
                    onClick={() => navigate('/patient/care-team')}
                    className="text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-0.5"
                  >
                    <span>Connect Doctor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionFeedback}</span>
            </div>
          </div>
        )}

        {/* Detailed Registered Conditions and Allergies Chips */}
        {((patientProfile?.allergies?.length || 0) > 0 || (patientProfile?.chronicConditions?.length || 0) > 0) && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-700 mr-2">Registered Health Factors:</span>
            {patientProfile?.allergies.map((a) => (
              <span key={a} className="px-2.5 py-1 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                Allergy: {a}
              </span>
            ))}
            {patientProfile?.chronicConditions.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                Condition: {c}
              </span>
            ))}
          </div>
        )}

        {/* PHASE 6: EMERGENCY MEDICATION PASSPORT SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Emergency Medication Passport &amp; Reports</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Emergency Medication Passport
              </h2>
              <p className="text-xs text-slate-500">
                Concise clinical summary containing only verified profile and active Medication Twin records.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Button 1: View Medication Passport */}
              <button
                id="dash-view-passport-btn"
                onClick={() => navigate('/patient/passport')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 text-slate-700 hover:text-teal-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>View Medication Passport</span>
              </button>

              {/* Button 2: Download PDF Report */}
              <button
                id="dash-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF Report'}</span>
              </button>

              {/* Button 3: Generate QR Code */}
              <button
                id="dash-generate-qr-btn"
                onClick={() => setQrModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{activeShare && activeShare.status === 'ACTIVE' ? 'Manage QR Code' : 'Generate QR Code'}</span>
              </button>

              {/* Button 4: Revoke QR Access (only if sharing is enabled) */}
              {activeShare && activeShare.status === 'ACTIVE' && (
                <button
                  id="dash-revoke-qr-btn"
                  onClick={handleRevokeShare}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  title="Immediately revoke emergency QR access"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Revoke QR Access</span>
                </button>
              )}
            </div>
          </div>

          {/* Concise Readable Passport Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Patient Name</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                {passportSummary?.fullName || <span className="italic text-slate-400">Not provided</span>}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Age / Gender</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {passportSummary?.age !== null && passportSummary?.age !== undefined ? `${passportSummary.age} yrs` : 'Not provided'} / {passportSummary?.gender || 'Not provided'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Emergency Contact</span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {passportSummary?.emergencyContact?.name ? `${passportSummary.emergencyContact.name} (${passportSummary.emergencyContact.phone || 'No phone'})` : 'Not provided'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Last Safety Analysis</span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                {passportSummary?.lastSafetyAnalysisDate ? new Date(passportSummary.lastSafetyAnalysisDate).toLocaleDateString() : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Allergies & Medical Conditions Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                Recorded Medication Allergies
              </span>
              {passportSummary?.allergies?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {passportSummary.allergies.map((allergy) => (
                    <span key={allergy} className="px-2.5 py-0.5 bg-white text-rose-700 font-bold text-xs rounded-lg border border-rose-300">
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No medication allergies recorded.</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Recorded Medical Conditions
              </span>
              {passportSummary?.chronicConditions?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {passportSummary.chronicConditions.map((cond) => (
                    <span key={cond} className="px-2.5 py-0.5 bg-white text-amber-900 font-semibold text-xs rounded-lg border border-amber-300">
                      {cond}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No chronic medical conditions recorded.</p>
              )}
            </div>
          </div>

          {/* Current Active Medications Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Current Active Medications ({activeMedications.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Name, strength, dose, frequency, route
              </span>
            </div>

            {activeMedications.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl italic">
                No active medications recorded in Medication Twin.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Medication</th>
                      <th className="px-3 py-2 text-left">Strength</th>
                      <th className="px-3 py-2 text-left">Dose &amp; Frequency</th>
                      <th className="px-3 py-2 text-left">Route</th>
                      <th className="px-3 py-2 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {activeMedications.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 font-bold text-slate-900">{m.name}</td>
                        <td className="px-3 py-2 text-slate-700">{m.strength?.trim() ? m.strength : <span className="italic text-slate-400">Not provided</span>}</td>
                        <td className="px-3 py-2 text-slate-700">{m.dosage?.trim() ? m.dosage : <span className="italic text-slate-400">Not provided</span>} • {m.frequency?.trim() ? m.frequency : <span className="italic text-slate-400">Not provided</span>}</td>
                        <td className="px-3 py-2 text-slate-700 capitalize">{m.route?.trim() ? m.route : <span className="italic text-slate-400">Not provided</span>}</td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{m.source === 'PRESCRIPTION_OCR' ? 'Prescription OCR' : 'Patient Recorded'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Important Verified Findings from Phase 4 */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Important Verified Findings (Latest Phase 4 Analysis)
            </h3>
            {passportSummary?.importantVerifiedFindings?.length ? (
              <div className="space-y-2">
                {passportSummary.importantVerifiedFindings.map((f) => (
                  <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">[{f.severity?.toUpperCase() || 'CAUTION'}] {f.title}</span>
                      <span className="text-[10px] text-slate-500">{f.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{f.explanation}</p>
                    <p className="text-[10px] text-teal-800 font-medium">Guidance: {f.recommendationNote}</p>
                    <p className="text-[10px] text-slate-400">Source: {f.sourceReference}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No critical verified contraindications identified in current active medications.</span>
              </div>
            )}
          </div>

          {/* Clear Informational Disclaimer */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Informational Advisory:</strong> This medication passport is informational and does not replace medical advice. Discuss any proposed medication changes with your prescribing doctor or clinical pharmacist.
            </p>
          </div>
        </div>

        {/* Modular Navigation Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Patient Clinical Modules
              </h2>
              <p className="text-xs text-slate-500">
                Phase 2 patient and doctor relationship established. Select a module to explore details and features.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  id={`card-${card.id}`}
                  onClick={() => navigate(card.route)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 flex items-center justify-center transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.statusColor}`}>
                        {card.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-sky-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      <span>{card.actionText}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency QR Sharing Modal */}
        <EmergencyQrModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          activeShare={activeShare}
          onGenerateShare={handleGenerateShare}
          onRevokeShare={handleRevokeShare}
        />

      </div>
    </div>
  );
};

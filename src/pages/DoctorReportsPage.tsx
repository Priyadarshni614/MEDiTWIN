/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { PatientProfile, DoctorPatientRelationship, Medication } from '../models/types';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { authorizationService } from '../services/authorizationService';
import { medicationService } from '../services/medicationService';
import { safetyAnalysisService } from '../services/safetyAnalysisService';
import { pdfReportService } from '../services/pdfReportService';
import { passportService } from '../services/passportService';
import { EmergencyPassportSummary } from '../models/passportTypes';
import { MedicationPassportCard } from '../components/passport/MedicationPassportCard';
import { demoService } from '../services/demoService';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Pill, 
  FileText, 
  ChevronRight, 
  Search,
  AlertCircle,
  Eye
} from 'lucide-react';

export const DoctorReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { getParam, navigate } = useRouter();

  const [authorizedPatients, setAuthorizedPatients] = useState<Array<{
    relationship: DoctorPatientRelationship;
    profile: PatientProfile;
  }>>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(getParam('patientId'));
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<DoctorPatientRelationship | null>(null);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [safetyReport, setSafetyReport] = useState<MedicationSafetyReport | null>(null);
  const [passport, setPassport] = useState<EmergencyPassportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'passport'>('report');
  const [searchTerm, setSearchTerm] = useState('');

  const isDemo = demoService.isDemoUser(user?.email);

  useEffect(() => {
    if (!user) return;

    const loadAuthorizedPatients = async () => {
      setLoading(true);
      try {
        const patients = await authorizationService.getAuthorizedPatientsForDoctor(user.id);
        setAuthorizedPatients(patients);

        const initialId = getParam('patientId') || (patients.length > 0 ? patients[0].profile.userId : null);
        if (initialId) {
          setSelectedPatientId(initialId);
        }
      } catch (err) {
        console.error('Failed to load authorized patients for doctor:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuthorizedPatients();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedPatientId) return;

    const loadPatientDetails = async () => {
      try {
        const profile = await authorizationService.getAuthorizedPatientProfile(user.id, selectedPatientId);
        if (!profile) {
          setSelectedPatient(null);
          return;
        }
        setSelectedPatient(profile);

        const rel = await authorizationService.checkExistingRelationship(user.id, selectedPatientId);
        setSelectedRelationship(rel);

        const meds = await medicationService.getActiveMedications(selectedPatientId);
        setActiveMeds(meds);

        const report = await safetyAnalysisService.getAuthorizedPatientSafetyAnalysis(user.id, selectedPatientId);
        setSafetyReport(report);

        const pass = await passportService.getAuthorizedEmergencyPassport(user.id, selectedPatientId);
        setPassport(pass);
      } catch (err) {
        console.error('Failed to load patient report details:', err);
      }
    };

    loadPatientDetails();
  }, [user, selectedPatientId]);

  const handleDownloadPdf = async () => {
    if (!selectedPatient) return;
    setDownloadingPdf(true);
    try {
      const doc = pdfReportService.generateMedicationReport({
        patient: selectedPatient,
        medications: activeMeds,
        safetyReport,
        relationship: selectedRelationship,
        reportTitle: `Clinical Medication Report — ${selectedPatient.fullName}`,
      });

      doc.save(`clinical-report-${selectedPatient.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Failed to download doctor PDF report:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredPatients = authorizedPatients.filter((p) =>
    p.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profile.connectionCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Demo Doctor Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Physician
              </span>
              <span className="font-semibold">DEMO CLINICAL ENVIRONMENT — AUTHORIZED PATIENT AUDIT</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Dr. Sarah Jenkins • Clinical Reports Center
            </span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Clinical Reports &amp; Documentation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Authorized Patient Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Generate and download official medication twin audits and emergency passports for your authorized patients.
            </p>
          </div>

          {selectedPatient && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="doc-report-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF Report'}</span>
              </button>

              <button
                onClick={() => navigate(`/doctor/patient-view?patientId=${selectedPatient.userId}`)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                <span>View Full Chart</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout: Patient Selector Sidebar + Report Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Authorized Patient Selection (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Authorized Patients ({authorizedPatients.length})</span>
                </h3>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search authorized patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Patient List */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">
                    No authorized patients found.
                  </p>
                ) : (
                  filteredPatients.map(({ profile, relationship }) => {
                    const isSelected = selectedPatientId === profile.userId;
                    return (
                      <div
                        key={profile.userId}
                        onClick={() => setSelectedPatientId(profile.userId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {profile.fullName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            Age: {profile.age} • {profile.allergies?.length || 0} Allergies
                          </p>
                          <span className="font-mono text-[10px] text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
                            {profile.connectionCode}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-300'}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Patient Report Preview (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedPatient ? (
              <div className="space-y-4">
                
                {/* View Mode Toggle: Clinical PDF Report Preview vs Emergency Passport */}
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      activeTab === 'report'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Official Clinical Report Preview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('passport')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      activeTab === 'passport'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Emergency Medication Passport</span>
                  </button>
                </div>

                {activeTab === 'report' ? (
                  /* Clinical Report View */
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          Authorized Clinical Audit
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-1">
                          {selectedPatient.fullName} — Medication Twin &amp; Safety Audit
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {selectedPatient.connectionCode}
                      </span>
                    </div>

                    {/* Patient demographics summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Age / Gender</span>
                        <span className="font-bold text-slate-800">{selectedPatient.age} yrs / {selectedPatient.gender}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Weight</span>
                        <span className="font-semibold text-slate-800">{selectedPatient.weight || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Allergies</span>
                        <span className="font-bold text-rose-700">{selectedPatient.allergies?.join(', ') || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Conditions</span>
                        <span className="font-semibold text-slate-800">{selectedPatient.chronicConditions?.join(', ') || 'None'}</span>
                      </div>
                    </div>

                    {/* Active Drugs */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Active Medications ({activeMeds.length})
                      </h3>
                      {activeMeds.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No active medications registered.</p>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                              <tr>
                                <th className="px-3 py-2 text-left">Drug Name</th>
                                <th className="px-3 py-2 text-left">Strength</th>
                                <th className="px-3 py-2 text-left">Dose &amp; Frequency</th>
                                <th className="px-3 py-2 text-left">Route</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                              {activeMeds.map((med) => (
                                <tr key={med.id}>
                                  <td className="px-3 py-2 font-bold text-slate-900">{med.name}</td>
                                  <td className="px-3 py-2 text-slate-700">{med.strength || 'Not provided'}</td>
                                  <td className="px-3 py-2 text-slate-700">{med.dosage || 'Not provided'} • {med.frequency || 'Not provided'}</td>
                                  <td className="px-3 py-2 text-slate-700 capitalize">{med.route || 'Not provided'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Safety Analysis Findings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Phase 4 Safety Analysis Findings
                        </h3>
                        {safetyReport?.scoreBreakdown?.isCalculable && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            Prototype Score: {safetyReport.scoreBreakdown.score}/100
                          </span>
                        )}
                      </div>

                      {safetyReport?.findings?.filter((f) => f.verificationState === 'VERIFIED').length ? (
                        <div className="space-y-2">
                          {safetyReport.findings.filter((f) => f.verificationState === 'VERIFIED').map((f) => (
                            <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-900">[{f.severity?.toUpperCase()}] {f.title}</span>
                                <span className="text-[10px] text-slate-500">{f.category}</span>
                              </div>
                              <p className="text-[11px] text-slate-600">{f.explanation}</p>
                              <p className="text-[10px] text-slate-400">Source: {f.sourceReference}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-semibold">
                          No verified clinical contraindications identified.
                        </p>
                      )}
                    </div>

                    {/* Legal disclaimer */}
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                      <strong>Physician Advisory:</strong> This official report is compiled for clinical consultation. It does NOT constitute a prescription or medical directive. Healthcare providers must independently evaluate all medications and patient factors.
                    </div>
                  </div>
                ) : (
                  /* Emergency Passport View */
                  passport ? (
                    <MedicationPassportCard passport={passport} showEmergencyBanner={true} />
                  ) : (
                    <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                      Passport details unavailable.
                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Patient Selected</h3>
                <p className="text-xs text-slate-500">
                  Select an authorized patient from the list on the left to preview and download their official reports.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

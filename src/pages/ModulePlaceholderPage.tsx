/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { 
  Dna, 
  ScanLine, 
  ShieldAlert, 
  Sliders, 
  FileSpreadsheet, 
  QrCode, 
  Pill, 
  Users, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

interface ModuleConfig {
  title: string;
  role: 'PATIENT' | 'DOCTOR' | 'BOTH';
  icon: any;
  stage: string;
  summary: string;
  architecturalInterfaces: string[];
  plannedCapabilities: string[];
}

const MODULE_DEFINITIONS: Record<string, ModuleConfig> = {
  '/patient/twin': {
    title: 'Medication Twin Engine',
    role: 'PATIENT',
    icon: Dna,
    stage: 'Stage 2 – Twin Kinetic Synthesis',
    summary: 'Dynamic computational avatar synthesizing patient organ function, age clearance kinetics, and active pharmacological load.',
    architecturalInterfaces: ['MedicationTwin', 'PatientProfile', 'RiskAlert'],
    plannedCapabilities: [
      'Multi-compartment pharmacokinetic clearance estimation',
      'Anticholinergic cognitive load burden aggregation',
      'Metabolic enzyme competition mapping (CYP450 system)',
    ],
  },
  '/patient/medications': {
    title: 'Current Medications Registry',
    role: 'PATIENT',
    icon: Pill,
    stage: 'Stage 2 – Medication Catalog',
    summary: 'Active prescription inventory with frequency schedules, indication tagging, and therapeutic class mapping.',
    architecturalInterfaces: ['Medication', 'Prescription'],
    plannedCapabilities: [
      'Standardized RxNorm / ATC code indexing',
      'Daily dose scheduler and adherence tracking',
      'Discontinued & PRN (as-needed) medication separation',
    ],
  },
  '/patient/scanner': {
    title: 'Prescription OCR Scanner',
    role: 'PATIENT',
    icon: ScanLine,
    stage: 'Stage 2 – Vision & Ingestion',
    summary: 'Intelligent optical character recognition extracting brand/generic names, dosages, and prescribing instructions directly from camera or image upload.',
    architecturalInterfaces: ['Prescription', 'Medication'],
    plannedCapabilities: [
      'Prescription paper slip extraction and dosage parsing',
      'Pharmacy bottle label camera recognition',
      'Automatic patient verification before importing to Twin',
    ],
  },
  '/patient/analysis': {
    title: 'Medication Safety Analysis',
    role: 'PATIENT',
    icon: ShieldAlert,
    stage: 'Stage 2 – Clinical Risk Engine',
    summary: 'Multi-drug interaction analysis scanning for drug-drug interactions, duplicate therapeutic classes, and disease contraindications.',
    architecturalInterfaces: ['MedicationAnalysis', 'RiskAlert', 'RiskSeverity'],
    plannedCapabilities: [
      'Categorized risk alerts (Contraindicated, High, Moderate, Low)',
      'Physiological mechanism explanations in plain patient language',
      'Actionable discussion prompts for clinical consultations',
    ],
  },
  '/patient/simulator': {
    title: 'What-If Prescription Simulator',
    role: 'PATIENT',
    icon: Sliders,
    stage: 'Stage 2 – Predictive Sandbox',
    summary: 'Test potential new medications against your existing Medication Twin before receiving or starting the drug.',
    architecturalInterfaces: ['MedicationTwin', 'MedicationAnalysis'],
    plannedCapabilities: [
      'Hypothetical drug addition and dose titration simulation',
      'Immediate delta score showing risk increase or safety preservation',
      'Deprescribing simulation for polypharmacy burden reduction',
    ],
  },
  '/patient/reports': {
    title: 'Clinical Medication Reports',
    role: 'PATIENT',
    icon: FileSpreadsheet,
    stage: 'Stage 2 – Reporting Module',
    summary: 'Comprehensive clinical medication audits and print-ready visit summaries for primary care and specialist appointments.',
    architecturalInterfaces: ['Report', 'MedicationTwin'],
    plannedCapabilities: [
      'Physician-ready one-page medication reconciliation summaries',
      'Polypharmacy risk audit timeline',
      'Secure PDF export',
    ],
  },
  '/patient/passport': {
    title: 'Emergency Medication Passport',
    role: 'PATIENT',
    icon: QrCode,
    stage: 'Stage 2 – Emergency Card',
    summary: 'Fast-access emergency QR card containing critical allergies, emergency contacts, and active high-alert medications.',
    architecturalInterfaces: ['EmergencyPassport', 'EmergencyContact'],
    plannedCapabilities: [
      'Offline emergency QR code generation',
      'First responder emergency allergy summary',
      'Lock screen and wallet card export',
    ],
  },
  '/doctor/patients': {
    title: 'Clinical Patients Registry',
    role: 'DOCTOR',
    icon: Users,
    stage: 'Stage 1 Foundation Active',
    summary: 'Clinician patient registry with strict data isolation. Patient records remain private until shared via clinical referral.',
    architecturalInterfaces: ['User', 'PatientProfile', 'DoctorProfile'],
    plannedCapabilities: [
      'Secure patient-to-doctor profile connection codes',
      'Patient risk stratification ranking (High Polypharmacy Risk)',
      'Clinical cohort monitoring and medication audit logs',
    ],
  },
  '/doctor/analysis': {
    title: 'Clinician Medication Risk Matrix',
    role: 'DOCTOR',
    icon: ShieldAlert,
    stage: 'Stage 2 – Clinical Matrix',
    summary: 'Advanced pharmacological decision support with evidence grades, CYP enzyme kinetics, and deprescribing criteria (Beers / STOPP/START).',
    architecturalInterfaces: ['MedicationAnalysis', 'RiskAlert'],
    plannedCapabilities: [
      'Beers Criteria and STOPP/START geriatric guidelines integration',
      'Renal (eGFR) and Hepatic dosage adjustment calculators',
      'Therapeutic duplication and prescribing cascade flags',
    ],
  },
  '/doctor/simulator': {
    title: 'What-If Clinical Prescription Simulator',
    role: 'DOCTOR',
    icon: Sliders,
    stage: 'Stage 2 – Clinical Sandbox',
    summary: 'Simulate alternative pharmacological agents, cross-tapering regimens, and dosage titrations before issuing orders.',
    architecturalInterfaces: ['MedicationTwin', 'Prescription'],
    plannedCapabilities: [
      'Alternative drug class recommendation engine',
      'Cross-tapering schedule visualizer',
      'Predicted cumulative anticholinergic reduction',
    ],
  },
  '/doctor/reports': {
    title: 'Clinical Audit & Deprescribing Reports',
    role: 'DOCTOR',
    icon: FileSpreadsheet,
    stage: 'Stage 3 – Clinical Audits',
    summary: 'Generate institutional polypharmacy audit documentation, hospital discharge medication reconciliations, and patient summaries.',
    architecturalInterfaces: ['Report'],
    plannedCapabilities: [
      'Institutional polypharmacy risk audit logs',
      'Deprescribing protocol documentation for EHR integration',
      'Consultation export in HL7 FHIR compatible structure',
    ],
  },
  '/patient/settings': {
    title: 'Patient Account & Privacy Settings',
    role: 'PATIENT',
    icon: Lock,
    stage: 'Settings & Security',
    summary: 'Manage your patient security, authorization access logs, and emergency contact visibility preferences.',
    architecturalInterfaces: ['User', 'PatientProfile'],
    plannedCapabilities: [
      'Revoke all clinical connections with one click',
      'Manage multi-factor verification and data export',
      'Emergency passport public vs private data toggles',
    ],
  },
  '/doctor/settings': {
    title: 'Clinical Practice & Registry Settings',
    role: 'DOCTOR',
    icon: Lock,
    stage: 'Settings & Security',
    summary: 'Manage clinician credentials, hospital affiliation details, and clinical notification preferences.',
    architecturalInterfaces: ['User', 'DoctorProfile'],
    plannedCapabilities: [
      'License and medical council verification updates',
      'Hospital department and ward assignment switches',
      'Automated patient safety alert notification thresholds',
    ],
  },
};

export const ModulePlaceholderPage: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();

  const config = MODULE_DEFINITIONS[currentPath] || {
    title: 'Module Workspace',
    role: 'BOTH',
    icon: Layers,
    stage: 'Stage 2 Module',
    summary: 'This module is scheduled for implementation in the next phase of MediTwin AI.',
    architecturalInterfaces: ['MedicationTwin'],
    plannedCapabilities: ['Architecture ready for module rollout'],
  };

  const Icon = config.icon;
  const returnDashboard = user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard';

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => navigate(returnDashboard)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {config.stage}
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  {config.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold">Coming in the next module</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            {config.summary}
          </p>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-2 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Architecture foundation is active. In accordance with project instructions, fake mock scores and ungrounded medical algorithms are deliberately not displayed.
            </span>
          </div>
        </div>

        {/* Architecture & Interface Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Planned Capabilities */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Target Clinical Capabilities</span>
            </h2>
            <ul className="space-y-2.5">
              {config.plannedCapabilities.map((cap, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* TypeScript Architecture Specs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">TS</span>
              <span>Architectural Data Model Interfaces</span>
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Defined in <code className="text-sky-600 font-mono">src/models/types.ts</code> to ensure continuous evolution without rewriting:
            </p>
            <div className="flex flex-wrap gap-2">
              {config.architecturalInterfaces.map((item) => (
                <span
                  key={item}
                  className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200 font-medium"
                >
                  interface {item}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

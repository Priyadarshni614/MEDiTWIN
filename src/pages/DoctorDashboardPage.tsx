/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { DoctorPatientRelationship, PatientProfile } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { demoService } from '../services/demoService';
import { 
  Stethoscope, 
  Users, 
  ShieldAlert, 
  Sliders, 
  FileSpreadsheet, 
  Building2, 
  Lock, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  Calendar,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface PatientSummaryItem {
  relationship: DoctorPatientRelationship;
  profile: PatientProfile | null;
}

export const DoctorDashboardPage: React.FC = () => {
  const { user, doctorProfile } = useAuth();
  const { navigate } = useRouter();

  const [patientItems, setPatientItems] = useState<PatientSummaryItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DoctorPatientRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemoDoctor = user?.email?.toLowerCase().includes('joel') || user?.email?.toLowerCase().includes('demo');

  useEffect(() => {
    if (!user) return;
    const loadDoctorData = async () => {
      setLoading(true);
      try {
        const activeRels = await authorizationService.getActivePatientsForDoctor(user.id);
        const pendingRels = await authorizationService.getPendingRequestsForDoctor(user.id);
        setPendingRequests(pendingRels);

        // Fetch patient profiles for active relationships
        const items: PatientSummaryItem[] = [];
        for (const rel of activeRels) {
          const profile = await authorizationService.getAuthorizedPatientProfile(user.id, rel.patientId);
          items.push({ relationship: rel, profile });
        }
        setPatientItems(items);
      } catch (err) {
        console.error('Error loading doctor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDoctorData();
  }, [user]);

  const doctorName = doctorProfile?.fullName || user?.name || 'Doctor';
  const role = doctorProfile?.professionalRole || 'Clinical Specialist';
  const specialization = doctorProfile?.specialization || 'Pharmacotherapy & Polypharmacy';
  const organization = doctorProfile?.organization || 'Hospital Health Network';

  const clinicalModules = [
    {
      id: 'doc-patients',
      title: 'My Patients Directory',
      route: '/doctor/patients',
      icon: Users,
      description: 'Manage authorized polypharmacy patients, monitor treatment regimens, and review clinical histories.',
      status: `${patientItems.length} Active`,
      statusColor: patientItems.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: 'Open Directory',
    },
    {
      id: 'doc-requests',
      title: 'Connection Requests',
      route: '/doctor/requests',
      icon: UserPlus,
      description: 'Review outgoing and incoming patient connection statuses, authorization codes, and link requests.',
      status: `${pendingRequests.length} Pending`,
      statusColor: pendingRequests.length > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: 'Review Requests',
    },
    {
      id: 'doc-analysis',
      title: 'Clinical Medication Analysis',
      route: '/doctor/analysis',
      icon: ShieldAlert,
      description: 'Evaluate multidrug regimens, organ clearance loads, anticholinergic burden, and clinical interaction matrices.',
      status: 'Coming in next stage',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: 'Preview Engine',
    },
    {
      id: 'doc-simulator',
      title: 'What-If Prescription Simulator',
      route: '/doctor/simulator',
      icon: Sliders,
      description: 'Test potential new prescriptions against the patient’s existing regimen and organ factors prior to dispensing.',
      status: 'Coming in next stage',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: 'Preview Simulator',
    },
    {
      id: 'doc-reports',
      title: 'Clinical Auditing Reports',
      route: '/doctor/reports',
      icon: FileSpreadsheet,
      description: 'Generate institutional polypharmacy summaries, deprescribing recommendations, and patient discharge packets.',
      status: 'Coming in next stage',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
      actionText: 'Preview Reports',
    },
  ];

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Demo Doctor Banner */}
        {isDemoDoctor && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Physician
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL CLINICAL INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Dr. Joel Miller • Sample Physician Case
            </span>
          </div>
        )}

        {/* Personalized Welcome Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinician Decision Support Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {role} • {specialization} • {organization}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="doc-dash-connect-btn"
              onClick={() => navigate('/doctor/connect')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Connect New Patient</span>
            </button>
            <button
              id="doc-dash-view-patients-btn"
              onClick={() => navigate('/doctor/patients')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 text-slate-700 hover:text-teal-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>View My Patients</span>
            </button>
          </div>
        </div>

        {/* Counters & Profile Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Active Patients Count */}
          <div 
            onClick={() => navigate('/doctor/patients')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Connected Patients
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {loading ? '...' : patientItems.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-semibold">
              <span>Authorized relationships</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pending Requests Counter */}
          <div 
            onClick={() => navigate('/doctor/requests')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Pending Requests
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {loading ? '...' : pendingRequests.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
              <span>Awaiting patient authorization</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Doctor Profile Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Primary Specialty
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate" title={specialization}>
                {specialization}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-1.5 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{organization}</span>
            </div>
          </div>

          {/* Data Isolation Verification */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Access Authorization
              </span>
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Explicit Consent Enforced</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
              Only active relationships grant access
            </div>
          </div>

        </div>

        {/* Connected Patients Section (Real authorized patients list or compliant empty state) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <Users className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Authorized Patients</h2>
                <p className="text-xs text-slate-500">
                  Patients who have explicitly granted clinical access to their Medication Twin profile.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/doctor/connect')}
                className="px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect Code</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Checking authorized patient relationships...</p>
            </div>
          ) : patientItems.length === 0 ? (
            /* Clean, authentic empty state adhering strictly to prompt requirements */
            <div className="text-center py-12 px-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No patients connected yet
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                In MediTwin AI, patient data belongs to the patient. A doctor cannot view a patient profile until the patient shares their Connection Code and approves your request.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/doctor/connect')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect With Patient Code</span>
                </button>
                <button
                  onClick={() => navigate('/doctor/requests')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  View Pending Requests
                </button>
              </div>
              <div className="mt-6 inline-flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Lock className="w-3.5 h-3.5" />
                <span>End-to-end patient authorization model active</span>
              </div>
            </div>
          ) : (
            /* Active Connected Patients Table / Card List */
            <div className="space-y-3">
              {patientItems.map(({ relationship, profile }) => {
                const connectedDate = new Date(relationship.authorizedAt || relationship.createdAt).toLocaleDateString();
                const conditionsCount = profile?.chronicConditions?.length || 0;
                const allergiesCount = profile?.allergies?.length || 0;

                return (
                  <div
                    key={relationship.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-white transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                        {relationship.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {relationship.patientName}
                          </h4>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full">
                            Active Authorized
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {profile?.age && <span>{profile.age} yrs • {profile.gender}</span>}
                          <span>Connected: {connectedDate}</span>
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            {conditionsCount} condition{conditionsCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                            {allergiesCount} allerg{allergiesCount !== 1 ? 'ies' : 'y'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => navigate(`/doctor/patient-view?patientId=${relationship.patientId}`)}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Open Patient Chart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clinical Modules Grid */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Clinical Decision Support Modules
            </h2>
            <p className="text-xs text-slate-500">
              Multi-patient safety auditing, risk models, and clinical simulation tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clinicalModules.slice(2).map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  id={`doc-card-${module.id}`}
                  onClick={() => navigate(module.route)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-600 flex items-center justify-center transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${module.statusColor}`}>
                        {module.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {module.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                      <span>{module.actionText}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

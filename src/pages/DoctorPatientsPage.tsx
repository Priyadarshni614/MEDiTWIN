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
  Users, 
  ArrowLeft, 
  UserPlus, 
  Search, 
  FolderOpen, 
  ShieldCheck, 
  Lock, 
  HeartPulse, 
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';

interface PatientListItem {
  relationship: DoctorPatientRelationship;
  profile: PatientProfile | null;
}

export const DoctorPatientsPage: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [patientItems, setPatientItems] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isDemoDoctor = user?.email?.toLowerCase().includes('joel') || user?.email?.toLowerCase().includes('demo');

  useEffect(() => {
    if (!user) return;
    const loadPatients = async () => {
      setLoading(true);
      try {
        const activeRels = await authorizationService.getActivePatientsForDoctor(user.id);
        const items: PatientListItem[] = [];
        for (const rel of activeRels) {
          const profile = await authorizationService.getAuthorizedPatientProfile(user.id, rel.patientId);
          items.push({ relationship: rel, profile });
        }
        setPatientItems(items);
      } catch (err) {
        console.error('Error loading doctor patient list:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, [user]);

  const filteredItems = patientItems.filter(({ relationship, profile }) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = relationship.patientName.toLowerCase().includes(query);
    const codeMatch = relationship.patientConnectionCode.toLowerCase().includes(query);
    const condMatch = profile?.chronicConditions?.some(c => c.toLowerCase().includes(query));
    return nameMatch || codeMatch || condMatch;
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/doctor/connect')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect New Patient</span>
          </button>
        </div>

        {/* Demo Doctor Banner */}
        {isDemoDoctor && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-semibold">Demo Clinician Mode Active</span>
            <span className="text-[11px] text-amber-700">Dr. Joel Miller</span>
          </div>
        )}

        {/* Header with Search */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Authorized Patient Registry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              My Patients
            </h1>
            <p className="text-xs text-slate-500">
              Patients with active, verified clinical authorizations linked to your account.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or code..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Patients Grid / Empty State */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <span className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Verifying active relationship permissions...</p>
          </div>
        ) : patientItems.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              No patients connected yet
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              MediTwin AI enforces zero-trust patient data ownership. Clinicians can only view patients who have provided their Connection Code and accepted your connection request.
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

            <div className="mt-6 inline-flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict compliance with patient privacy architecture</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
            No authorized patients matched your search query "{searchQuery}".
          </div>
        ) : (
          /* Active Patient Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(({ relationship, profile }) => {
              const connectedDate = new Date(relationship.authorizedAt || relationship.createdAt).toLocaleDateString();
              const isDemoPatient = demoService.isDemoUser(profile?.fullName);

              return (
                <div
                  key={relationship.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-base shrink-0">
                          {relationship.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                              {relationship.patientName}
                            </h3>
                            {isDemoPatient && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                                DEMO
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                            {profile?.age && <span>{profile.age} yrs • <span className="capitalize">{profile.gender}</span></span>}
                            <span>•</span>
                            <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                              {relationship.patientConnectionCode}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Authorized</span>
                      </span>
                    </div>

                    {/* Conditions and Allergies Summary */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Chronic Conditions ({profile?.chronicConditions?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile?.chronicConditions && profile.chronicConditions.length > 0 ? (
                            profile.chronicConditions.map((cond, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-md font-medium">
                                {cond}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None recorded</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Known Allergies ({profile?.allergies?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile?.allergies && profile.allergies.length > 0 ? (
                            profile.allergies.map((allergy, i) => (
                              <span key={i} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-md font-medium">
                                {allergy}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No allergies documented</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Connected {connectedDate}
                    </span>

                    <button
                      onClick={() => navigate(`/doctor/patient-view?patientId=${relationship.patientId}`)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Patient Chart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

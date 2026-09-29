/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { 
  Stethoscope, 
  Building2, 
  User, 
  Mail, 
  AlertCircle, 
  ShieldAlert, 
  ArrowRight,
  Info
} from 'lucide-react';

const COMMON_ROLES = [
  'Clinical Pharmacist',
  'Primary Care Physician (PCP)',
  'Geriatric Specialist',
  'Internal Medicine Specialist',
  'Cardiologist',
  'Hospitalist',
  'Nurse Practitioner',
  'Clinical Researcher',
];

export const DoctorOnboardingPage: React.FC = () => {
  const { user, saveDoctorProfile } = useAuth();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState(user?.name || '');
  const [professionalRole, setProfessionalRole] = useState('Clinical Pharmacist');
  const [customRole, setCustomRole] = useState('');
  const [specialization, setSpecialization] = useState('Geriatric Polypharmacy & Deprescribing');
  const [organization, setOrganization] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    const finalRole = professionalRole === 'Other' ? customRole.trim() : professionalRole;
    if (!finalRole) {
      setErrorMessage('Please select or specify your professional role.');
      return;
    }
    if (!organization.trim()) {
      setErrorMessage('Please provide your Organization, Hospital, or Clinic.');
      return;
    }

    setIsSaving(true);
    try {
      await saveDoctorProfile({
        fullName: fullName.trim(),
        email: user?.email || '',
        professionalRole: finalRole,
        specialization: specialization.trim() || undefined,
        organization: organization.trim(),
      });

      // Proceed to Doctor Dashboard
      navigate('/doctor/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save professional profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl mx-auto">
        
        {/* Onboarding Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Step 1 of 1 • Professional Profile
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Your Professional Profile
              </h1>
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/70 flex items-start space-x-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Prototype Role Notice: </span>
              This application prototype facilitates role-based access for testing clinical decision support. MediTwin AI does not claim independent professional credential verification.
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Incomplete Profile: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="doctor-onboarding-name">
              Full Legal / Professional Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="doctor-onboarding-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Jennifer Hayes, PharmD"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
              />
            </div>
          </div>

          {/* Registered Email (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="doctor-onboarding-email">
              Professional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="doctor-onboarding-email"
                type="email"
                readOnly
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Professional Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="doctor-onboarding-role">
              Professional Role <span className="text-rose-500">*</span>
            </label>
            <select
              id="doctor-onboarding-role"
              value={professionalRole}
              onChange={(e) => setProfessionalRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 bg-white"
            >
              {COMMON_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other Specialty...</option>
            </select>

            {professionalRole === 'Other' && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Specify clinical specialty..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Clinical Specialization */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="doctor-onboarding-spec">
              Clinical Specialization / Focus Area
            </label>
            <input
              id="doctor-onboarding-spec"
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Geriatric Polypharmacy, Pharmacotherapy, Cardiology"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
            />
          </div>

          {/* Organization / Clinic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="doctor-onboarding-org">
              Hospital, Health Network, or Clinic <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                id="doctor-onboarding-org"
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. University Health Center / St. Jude Clinical Pharmacy"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              id="doctor-onboarding-submit-btn"
              disabled={isSaving}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center space-x-2 disabled:opacity-70 cursor-pointer"
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save &amp; Open Doctor Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

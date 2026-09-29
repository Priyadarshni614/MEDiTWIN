/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { PregnancyStatus } from '../models/types';
import { demoService } from '../services/demoService';
import { 
  UserCheck, 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  ShieldCheck, 
  Plus, 
  X, 
  Phone, 
  AlertCircle, 
  Mail, 
  HeartHandshake 
} from 'lucide-react';

const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa Drugs',
  'Aspirin / NSAIDs',
  'Codeine / Opioids',
  'ACE Inhibitors',
  'Latex',
  'Contrast Dye',
];

const COMMON_CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Chronic Kidney Disease (CKD)',
  'Asthma / COPD',
  'Atrial Fibrillation',
  'Heart Failure',
  'Hypothyroidism',
  'GERD / Acid Reflux',
];

export const PatientProfilePage: React.FC = () => {
  const { user, patientProfile, savePatientProfile } = useAuth();
  const { navigate } = useRouter();

  const isDemo = demoService.isDemoUser(user?.email);

  const [fullName, setFullName] = useState(patientProfile?.fullName || user?.name || '');
  const [age, setAge] = useState<string>(patientProfile?.age ? String(patientProfile.age) : '');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'prefer-not-to-say'>(patientProfile?.gender || 'female');
  const [weight, setWeight] = useState(patientProfile?.weight ? patientProfile.weight.replace(/[^0-9.]/g, '') : '');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(patientProfile?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(patientProfile?.chronicConditions || []);
  const [customCondition, setCustomCondition] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>(patientProfile?.pregnancyStatus || 'not-applicable');
  const [contactName, setContactName] = useState(patientProfile?.emergencyContact?.name || '');
  const [contactRelationship, setContactRelationship] = useState(patientProfile?.emergencyContact?.relationship || '');
  const [contactPhone, setContactPhone] = useState(patientProfile?.emergencyContact?.phone || '');

  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const connectionCode = patientProfile?.connectionCode || 'PT-PENDING';

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !selectedConditions.includes(customCondition.trim())) {
      setSelectedConditions([...selectedConditions, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(false);

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setErrorMessage('Please enter a valid age.');
      return;
    }

    setIsSaving(true);
    try {
      await savePatientProfile({
        fullName: fullName.trim(),
        age: parsedAge,
        gender,
        weight: weight.trim() ? `${weight.trim()} kg` : undefined,
        allergies: selectedAllergies,
        chronicConditions: selectedConditions,
        pregnancyStatus,
        connectionCode,
        emergencyContact: {
          name: contactName.trim(),
          relationship: contactRelationship.trim(),
          phone: contactPhone.trim(),
        },
      });
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            Profile Record ID: {user?.id}
          </span>
        </div>

        {/* Demo Warning Banner */}
        {isDemo && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Mode
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL PATIENT INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Sample Patient Case
            </span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-sky-600" />
              <span>My Medication Profile</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Update your health parameters to keep your Medication Twin and clinical care team updated.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Patient-Controlled Access</span>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-semibold">Profile updated successfully! All doctor views and risk calculations will reflect these changes.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email (Account)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="125"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-900 bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight in kg
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 64"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pregnancy / Lactation Status
              </label>
              <select
                value={pregnancyStatus}
                onChange={(e: any) => setPregnancyStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-900 bg-white"
              >
                <option value="not-applicable">Not Applicable</option>
                <option value="not-pregnant">Not Pregnant</option>
                <option value="pregnant-first-trimester">Pregnant (First Trimester)</option>
                <option value="pregnant-second-trimester">Pregnant (Second Trimester)</option>
                <option value="pregnant-third-trimester">Pregnant (Third Trimester)</option>
                <option value="breastfeeding">Breastfeeding</option>
              </select>
            </div>

          </div>

          {/* Allergies */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2">Drug Allergies</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {allergy} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Other allergy..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2">Chronic Conditions</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cond} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Other condition..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={addCustomCondition}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              <span>Emergency Contact Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Steve"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse / Sibling"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 382-9912"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/patient/care-team')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Manage Connected Care Team</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Update Medication Profile'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

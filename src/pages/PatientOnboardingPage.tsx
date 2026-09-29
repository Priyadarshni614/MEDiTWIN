/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../services/router';
import { useAuth } from '../auth/AuthContext';
import { PregnancyStatus } from '../models/types';
import { generatePatientConnectionCode } from '../services/localStorageDataService';
import { 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  AlertCircle, 
  Plus, 
  X, 
  Phone, 
  Sparkles,
  ArrowRight
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

export const PatientOnboardingPage: React.FC = () => {
  const { user, savePatientProfile } = useAuth();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState(user?.name || '');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [weight, setWeight] = useState('');
  
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');

  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>('not-applicable');

  const [contactName, setContactName] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle allergy chip
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

  // Toggle condition chip
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 125) {
      setErrorMessage('Please enter a valid age between 1 and 125.');
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
        emergencyContact: {
          name: contactName.trim(),
          relationship: contactRelationship.trim(),
          phone: contactPhone.trim(),
        },
        connectionCode: generatePatientConnectionCode(fullName.trim()),
      });

      // Proceed to Patient Dashboard
      navigate('/patient/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save medication profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        
        {/* Onboarding Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
                Step 1 of 1 • Profile Setup
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Your Medication Profile
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            MediTwin AI pairs your pharmacological history with your unique physiology. This baseline establishes your personal Medication Twin parameters to calculate interaction risks accurately.
          </p>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Strict data isolation: Your health profile is private to your authenticated account ID ({user?.id}).</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Required Fields: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          
          {/* Section 1: Demographics */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <User className="w-4 h-4 text-sky-600" />
              <span>Basic Demographics &amp; Physiology</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="patient-onboarding-name">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="patient-onboarding-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="patient-onboarding-age">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="patient-onboarding-age"
                  type="number"
                  min="1"
                  max="125"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 68"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="patient-onboarding-gender">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  id="patient-onboarding-gender"
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 bg-white"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              {/* Weight */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="patient-onboarding-weight">
                  Body Weight in kg (Optional - used for renal dosage calculations)
                </label>
                <div className="relative">
                  <input
                    id="patient-onboarding-weight"
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Allergies */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Drug &amp; Substance Allergies</span>
              </h2>
              <span className="text-[11px] text-slate-500">Select all that apply</span>
            </div>
            
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {allergy} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Allergy input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Add other allergy..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAllergy();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Selected Summary Tags */}
            {selectedAllergies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selectedAllergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className="text-rose-500 hover:text-rose-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Chronic Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">
                Chronic Health Conditions
              </h2>
              <span className="text-[11px] text-slate-500">Crucial for contraindication modeling</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {cond} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Condition input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Add other diagnosed condition..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomCondition();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={addCustomCondition}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 4: Pregnancy Status (Applicable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="patient-onboarding-pregnancy">
              Pregnancy &amp; Lactation Status
            </label>
            <select
              id="patient-onboarding-pregnancy"
              value={pregnancyStatus}
              onChange={(e: any) => setPregnancyStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 bg-white"
            >
              <option value="not-applicable">Not Applicable</option>
              <option value="not-pregnant">Not Pregnant</option>
              <option value="pregnant-first-trimester">Pregnant (First Trimester: 1-12 weeks)</option>
              <option value="pregnant-second-trimester">Pregnant (Second Trimester: 13-27 weeks)</option>
              <option value="pregnant-third-trimester">Pregnant (Third Trimester: 28+ weeks)</option>
              <option value="breastfeeding">Currently Breastfeeding / Lactating</option>
            </select>
          </div>

          {/* Section 5: Emergency Contact */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Phone className="w-4 h-4 text-sky-600" />
              <span>Emergency Contact</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="patient-onboarding-ec-name">
                  Contact Name
                </label>
                <input
                  id="patient-onboarding-ec-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="patient-onboarding-ec-rel">
                  Relationship
                </label>
                <input
                  id="patient-onboarding-ec-rel"
                  type="text"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  placeholder="e.g. Spouse / Sibling"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1" htmlFor="patient-onboarding-ec-phone">
                  Phone Number
                </label>
                <input
                  id="patient-onboarding-ec-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              id="patient-onboarding-submit-btn"
              disabled={isSaving}
              className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center space-x-2 disabled:opacity-70 cursor-pointer"
            >
              {isSaving ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save &amp; Continue</span>
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

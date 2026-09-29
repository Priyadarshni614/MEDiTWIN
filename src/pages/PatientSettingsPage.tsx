/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { PregnancyStatus, DoctorPatientRelationship } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import { passportService } from '../services/passportService';
import { EmergencyPassportShare } from '../models/passportTypes';
import {
  Settings,
  ArrowLeft,
  User,
  Shield,
  HeartPulse,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Stethoscope,
  UserX,
  QrCode,
  LogOut,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  FileText,
  Lock,
  ExternalLink,
  RefreshCw,
  BellOff
} from 'lucide-react';

const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa Drugs',
  'Aspirin / NSAIDs',
  'Codeine / Opioids',
  'ACE Inhibitors',
  'Latex',
  'Contrast Dye',
  'Macrolides',
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
  'Osteoarthritis',
];

export const PatientSettingsPage: React.FC = () => {
  const { user, patientProfile, savePatientProfile, logout, deleteAccount } = useAuth();
  const { navigate } = useRouter();

  // Profile Form States
  const [fullName, setFullName] = useState(patientProfile?.fullName || user?.name || '');
  const [age, setAge] = useState(patientProfile?.age ? String(patientProfile.age) : '');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'prefer-not-to-say'>(
    patientProfile?.gender || 'female'
  );
  const [weight, setWeight] = useState(
    patientProfile?.weight ? patientProfile.weight.replace(/[^0-9.]/g, '') : ''
  );
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus>(
    patientProfile?.pregnancyStatus || 'not-applicable'
  );

  // Allergies & Conditions
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(patientProfile?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    patientProfile?.chronicConditions || []
  );
  const [customCondition, setCustomCondition] = useState('');

  // Emergency Contact
  const [contactName, setContactName] = useState(patientProfile?.emergencyContact?.name || '');
  const [contactRelationship, setContactRelationship] = useState(
    patientProfile?.emergencyContact?.relationship || ''
  );
  const [contactPhone, setContactPhone] = useState(patientProfile?.emergencyContact?.phone || '');

  // Connected Doctors & Care Team
  const [activeRelationships, setActiveRelationships] = useState<DoctorPatientRelationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DoctorPatientRelationship[]>([]);
  const [revokingRel, setRevokingRel] = useState<DoctorPatientRelationship | null>(null);

  // Emergency Passport Sharing
  const [emergencyShare, setEmergencyShare] = useState<EmergencyPassportShare | null>(null);
  const [revokingPassport, setRevokingPassport] = useState(false);

  // Account Deletion Dialog
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // UI Feedback States
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [careTeamLoading, setCareTeamLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Expandable Real Documentation
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  const connectionCode = patientProfile?.connectionCode || 'PT-PENDING';

  // Load Connected Doctors & Emergency Passport Share
  const loadClinicalData = async () => {
    if (!user) return;
    setCareTeamLoading(true);
    try {
      const allRels = await authorizationService.getRelationshipsForPatient(user.id);
      setActiveRelationships(allRels.filter((r) => r.status === 'ACTIVE'));
      setPendingRequests(allRels.filter((r) => r.status === 'PENDING'));

      const activeShare = await passportService.getActiveShare(user.id);
      setEmergencyShare(activeShare);
    } catch (err) {
      console.error('Error loading clinical settings data:', err);
    } finally {
      setCareTeamLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, [user]);

  // Synchronize initial form values if profile changes
  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.fullName || user?.name || '');
      setAge(patientProfile.age ? String(patientProfile.age) : '');
      setGender(patientProfile.gender || 'female');
      setWeight(patientProfile.weight ? patientProfile.weight.replace(/[^0-9.]/g, '') : '');
      setPregnancyStatus(patientProfile.pregnancyStatus || 'not-applicable');
      setSelectedAllergies(patientProfile.allergies || []);
      setSelectedConditions(patientProfile.chronicConditions || []);
      setContactName(patientProfile.emergencyContact?.name || '');
      setContactRelationship(patientProfile.emergencyContact?.relationship || '');
      setContactPhone(patientProfile.emergencyContact?.phone || '');
    }
  }, [patientProfile, user]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {}
  };

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

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
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

  const removeCondition = (condition: string) => {
    setSelectedConditions(selectedConditions.filter((c) => c !== condition));
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!fullName.trim()) {
      setSaveError('Full Name is required.');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      setSaveError('Please enter a valid age between 0 and 125.');
      return;
    }

    setIsSaving(true);
    try {
      await savePatientProfile({
        fullName: fullName.trim(),
        age: parsedAge,
        gender,
        weight: weight.trim() ? `${weight.trim()} kg` : undefined,
        pregnancyStatus,
        allergies: selectedAllergies,
        chronicConditions: selectedConditions,
        connectionCode,
        emergencyContact: {
          name: contactName.trim(),
          relationship: contactRelationship.trim(),
          phone: contactPhone.trim(),
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Revoke Doctor Access
  const handleConfirmRevokeDoctor = async () => {
    if (!revokingRel || !user) return;
    try {
      const res = await authorizationService.revokeDoctorAccess(revokingRel.id, user.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Access for ${revokingRel.doctorName} was immediately revoked. They can no longer view your Medication Twin.`,
        });
        await loadClinicalData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to revoke doctor access.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error occurred while revoking access.' });
    } finally {
      setRevokingRel(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Authorize Pending Doctor Request
  const handleAuthorizeDoctor = async (relId: string) => {
    if (!user) return;
    try {
      const res = await authorizationService.authorizeDoctor(relId, user.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: 'Doctor connection successfully authorized. The doctor can now view your Medication Twin.',
        });
        await loadClinicalData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to authorize doctor.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error during authorization.' });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Decline Pending Doctor Request
  const handleDeclineDoctor = async (relId: string) => {
    if (!user) return;
    try {
      const res = await authorizationService.declineDoctor(relId, user.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: 'Doctor connection request declined.',
        });
        await loadClinicalData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to decline request.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error declining request.' });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Revoke Emergency Passport QR Access
  const handleRevokePassportShare = async () => {
    if (!user) return;
    setRevokingPassport(true);
    try {
      const revoked = await passportService.revokeEmergencyShare(user.id);
      if (revoked) {
        setEmergencyShare(null);
        setActionMessage({
          type: 'success',
          text: 'Emergency QR access was revoked on both server and device. Any existing QR code is now inactive.',
        });
      } else {
        setActionMessage({ type: 'error', text: 'Failed to revoke emergency access.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error revoking emergency access.' });
    } finally {
      setRevokingPassport(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Safe Account Deletion
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete account.' });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
              <Settings className="w-6 h-6 text-sky-600" />
              <span>Patient Account & Privacy Settings</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Manage clinical identity, allergies, connected physicians, and emergency QR sharing.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Action Banner */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: Basic Clinical Profile & Contact */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Personal & Clinical Identity</h2>
                <p className="text-[11px] text-slate-500">Core clinical parameters driving kinetic twin analysis</p>
              </div>
            </div>

            {/* Connection Code Pill */}
            <div className="flex items-center space-x-2 bg-sky-50 border border-sky-200/80 px-3 py-1 rounded-xl">
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider font-semibold text-sky-800">Connection Code</span>
                <span className="font-mono text-xs font-bold text-sky-900">{connectionCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-sky-700 hover:text-sky-900 rounded-md hover:bg-sky-200/50 cursor-pointer"
                title="Copy connection code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile details and clinical history saved successfully.</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address <span className="text-slate-400 font-normal">(Account Identity)</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pregnancy Status</label>
                <select
                  value={pregnancyStatus}
                  onChange={(e) => setPregnancyStatus(e.target.value as PregnancyStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="not-applicable">Not Applicable</option>
                  <option value="not-pregnant">Not Pregnant</option>
                  <option value="pregnant-first-trimester">1st Trimester</option>
                  <option value="pregnant-second-trimester">2nd Trimester</option>
                  <option value="pregnant-third-trimester">3rd Trimester</option>
                  <option value="breastfeeding">Breastfeeding</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Emergency Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Joel Steve"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Parent"
                    value={contactRelationship}
                    onChange={(e) => setContactRelationship(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0144"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Allergies & Chronic Conditions */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Recorded Medication Allergies ({selectedAllergies.length})
                  </label>
                  <span className="text-[11px] text-slate-500">Tap to toggle or add custom below</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = selectedAllergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                        }`}
                      >
                        {allergy} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Allergies Chips */}
                {selectedAllergies.some((a) => !COMMON_ALLERGIES.includes(a)) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedAllergies
                      .filter((a) => !COMMON_ALLERGIES.includes(a))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => removeAllergy(custom)}
                            className="ml-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    placeholder="Enter custom drug allergy..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergy}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Add Allergy
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Recorded Chronic Conditions ({selectedConditions.length})
                  </label>
                  <span className="text-[11px] text-slate-500">Tap to toggle or add custom below</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = selectedConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleCondition(cond)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                        }`}
                      >
                        {cond} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Conditions Chips */}
                {selectedConditions.some((c) => !COMMON_CONDITIONS.includes(c)) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedConditions
                      .filter((c) => !COMMON_CONDITIONS.includes(c))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() => removeCondition(custom)}
                            className="ml-1 text-amber-600 hover:text-amber-800 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    placeholder="Enter custom chronic condition..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={addCustomCondition}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Add Condition
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-70 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile & Clinical History'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: Connected Doctors & Access Revocation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Connected Clinical Care Team</h2>
                <p className="text-[11px] text-slate-500">
                  Doctors and clinical pharmacists authorized to view your Medication Twin
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/care-team')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
            >
              Manage Full Team
            </button>
          </div>

          {careTeamLoading ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              <span>Verifying clinical authorization records...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                    Pending Incoming Connection Request
                  </span>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white p-3 rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{req.doctorName}</div>
                        <div className="text-slate-600 text-[11px]">
                          {req.doctorRole} • {req.doctorOrganization}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAuthorizeDoctor(req.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-2xs"
                        >
                          Authorize Access
                        </button>
                        <button
                          onClick={() => handleDeclineDoctor(req.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Connected Doctors */}
              {activeRelationships.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                  <p className="font-medium text-slate-800">No doctors currently have authorized access.</p>
                  <p className="mt-1 text-slate-500">
                    To connect a physician, share your patient connection code:{' '}
                    <strong className="font-mono text-sky-700">{connectionCode}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{rel.doctorName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active
                          </span>
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          {rel.doctorRole} {rel.doctorSpecialization && `• ${rel.doctorSpecialization}`}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {rel.doctorOrganization} • Authorized on{' '}
                          {rel.authorizedAt ? new Date(rel.authorizedAt).toLocaleDateString() : 'Active'}
                        </div>
                      </div>

                      <button
                        onClick={() => setRevokingRel(rel)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center space-x-1.5 cursor-pointer self-start sm:self-center transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 4: Emergency Medication Passport & QR Sharing Consent */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Emergency Medication Passport & QR Access</h2>
                <p className="text-[11px] text-slate-500">
                  Non-guessable emergency link for first responders and ER clinicians
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/passport')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
            >
              Open QR Card
            </button>
          </div>

          {emergencyShare && emergencyShare.status === 'ACTIVE' ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Emergency Share Active (Patient Consented)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 mt-1">
                    Valid until{' '}
                    <strong>
                      {new Date(emergencyShare.expiresAt).toLocaleDateString()} at{' '}
                      {new Date(emergencyShare.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Token ID:{' '}
                    <code className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-900">
                      {emergencyShare.token.substring(0, 8)}...
                    </code>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`#/passport/view?token=${encodeURIComponent(emergencyShare.token)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Link</span>
                  </a>

                  <button
                    onClick={handleRevokePassportShare}
                    disabled={revokingPassport}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{revokingPassport ? 'Revoking...' : 'Revoke QR Access'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800">No Active Emergency QR Pass</span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  Emergency clinicians cannot scan your passport until you explicitly grant consent and generate a secure QR pass.
                </p>
              </div>
              <button
                onClick={() => navigate('/patient/passport')}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-2xs self-start sm:self-center"
              >
                Generate Emergency QR
              </button>
            </div>
          )}
        </div>

        {/* SECTION 5: Notification Preferences (Truthful Status) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <BellOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notification Preferences & System Alerts</h2>
              <p className="text-[11px] text-slate-500">Communication channels and clinical advisory delivery</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-bold text-slate-900">In-Session Clinical Advisories Only</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              MediTwin AI operates with zero unsolicited external messaging. Automated push notifications, SMS alerts, and marketing emails are not configured in this prototype deployment. High-risk drug interactions and clinical polypharmacy advisories are rendered directly in real time inside your Medication Twin, Scanner, and Analysis dashboards during your active sessions.
            </p>
          </div>
        </div>

        {/* SECTION 6: Documentation, Privacy & Support (Real Content) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-600" />
            <span>Security Architecture, Privacy & Clinical Support</span>
          </h2>

          {/* Privacy Policy Toggle */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>MediTwin AI Data Isolation & Privacy Policy</span>
              </div>
              {showPrivacyPolicy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showPrivacyPolicy && (
              <div className="p-4 text-xs text-slate-600 space-y-2.5 border-t border-slate-200 bg-white leading-relaxed">
                <p>
                  <strong>1. Zero Plaintext Passwords:</strong> Credentials are encrypted using the Web Crypto API utilizing SHA-256 cryptographic hashing with a 16-byte random salt per user.
                </p>
                <p>
                  <strong>2. Strict Patient-Directed Data Isolation:</strong> Clinicians and doctors cannot browse or search unassociated patient records. Access requires your explicit authorization via your unique Patient Connection Code.
                </p>
                <p>
                  <strong>3. Instant Revocability:</strong> You maintain total sovereignty over your health data. When you revoke a doctor's access or an emergency QR code, access terminates immediately.
                </p>
                <p>
                  <strong>4. Simulation Sandboxing:</strong> All "What-If" prescription simulations and dosage titrations are transient and never alter your official active prescription registry.
                </p>
              </div>
            )}
          </div>

          {/* Help & Support Toggle */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHelpSupport(!showHelpSupport)}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Help, Clinical Usage Guidelines & Technical Support</span>
              </div>
              {showHelpSupport ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showHelpSupport && (
              <div className="p-4 text-xs text-slate-600 space-y-2 border-t border-slate-200 bg-white leading-relaxed">
                <p>
                  <strong>Connecting With Your Doctor:</strong> Share your unique Connection Code ({connectionCode}) with your clinician. Once they submit a connection request, you can authorize it from this Settings page or your Care Team dashboard.
                </p>
                <p>
                  <strong>Scanning Prescriptions:</strong> Use the Prescription Scanner tab to capture medication slips or prescription bottles. Always review extracted dosages before confirming additions to your twin.
                </p>
                <p>
                  <strong>Technical Questions:</strong> For prototype platform support, email the developer at{' '}
                  <a href="mailto:bew19073@gmail.com" className="text-sky-600 underline font-medium">
                    bew19073@gmail.com
                  </a>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 7: Danger Zone (Account Deletion) */}
        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-rose-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">Danger Zone • Account & Medical Data Deletion</h2>
              <p className="text-[11px] text-rose-600">
                Permanently purge your patient profile, medications, prescriptions, safety analyses, and clinical authorizations
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-600 max-w-xl">
              Deleting your account is permanent. All medications, kinetic avatar parameters, active QR passes, and doctor relationships will be completely removed from local storage and server records.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>

        {/* Medical Safety Disclaimer Notice */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950">Prototype Medical Safety Disclaimer:</span>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              MediTwin AI is an investigative decision-support prototype. It does not provide medical diagnoses, treatment orders, or emergency clinical intervention. Always consult licensed medical providers before altering drug regimens.
            </p>
          </div>
        </div>

      </div>

      {/* Revoke Doctor Confirmation Modal */}
      {revokingRel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revoke Clinical Access</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to revoke access for <strong>{revokingRel.doctorName}</strong> ({revokingRel.doctorRole})?
                They will immediately lose permission to view your Medication Twin, prescriptions, and safety findings.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokingRel(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeDoctor}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-rose-200">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">Confirm Irreversible Account Deletion</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will immediately and permanently erase your account credentials, clinical avatar, medication inventory, prescriptions, emergency passport shares, and all doctor links.
              </p>
              <p className="text-xs text-slate-800 font-semibold mt-3">
                Type <span className="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs disabled:opacity-40"
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

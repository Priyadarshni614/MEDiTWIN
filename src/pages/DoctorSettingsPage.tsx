/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { DoctorPatientRelationship } from '../models/types';
import { authorizationService } from '../services/authorizationService';
import {
  Settings,
  ArrowLeft,
  Stethoscope,
  Building2,
  Users,
  Clock,
  UserX,
  XCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Trash2,
  Shield,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BellOff,
  Info,
  UserPlus
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
  'Other',
];

export const DoctorSettingsPage: React.FC = () => {
  const { user, doctorProfile, saveDoctorProfile, logout, deleteAccount } = useAuth();
  const { navigate } = useRouter();

  // Profile Form States
  const [fullName, setFullName] = useState(doctorProfile?.fullName || user?.name || '');
  const [professionalRole, setProfessionalRole] = useState(
    doctorProfile?.professionalRole || 'Clinical Pharmacist'
  );
  const [customRole, setCustomRole] = useState('');
  const [specialization, setSpecialization] = useState(
    doctorProfile?.specialization || 'Geriatric Polypharmacy & Deprescribing'
  );
  const [organization, setOrganization] = useState(doctorProfile?.organization || '');

  // Patient Relationships States
  const [activePatients, setActivePatients] = useState<DoctorPatientRelationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DoctorPatientRelationship[]>([]);
  const [disconnectingRel, setDisconnectingRel] = useState<DoctorPatientRelationship | null>(null);

  // UI Feedback States
  const [isLoadingClinicalData, setIsLoadingClinicalData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Account Deletion Dialog
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Expandable Real Documentation
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  // Load Connected Patients & Outgoing Pending Requests
  const loadClinicalData = async () => {
    if (!user) return;
    setIsLoadingClinicalData(true);
    try {
      const allRels = await authorizationService.getRelationshipsForDoctor(user.id);
      setActivePatients(allRels.filter((r) => r.status === 'ACTIVE'));
      setPendingRequests(allRels.filter((r) => r.status === 'PENDING'));
    } catch (err) {
      console.error('Error loading doctor patient relationships:', err);
    } finally {
      setIsLoadingClinicalData(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, [user]);

  // Synchronize profile values if changed externally
  useEffect(() => {
    if (doctorProfile) {
      setFullName(doctorProfile.fullName || user?.name || '');
      if (COMMON_ROLES.includes(doctorProfile.professionalRole)) {
        setProfessionalRole(doctorProfile.professionalRole);
      } else {
        setProfessionalRole('Other');
        setCustomRole(doctorProfile.professionalRole);
      }
      setSpecialization(doctorProfile.specialization || '');
      setOrganization(doctorProfile.organization || '');
    }
  }, [doctorProfile, user]);

  // Save Professional Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!fullName.trim()) {
      setSaveError('Full Name is required.');
      return;
    }

    const finalRole = professionalRole === 'Other' ? customRole.trim() : professionalRole;
    if (!finalRole) {
      setSaveError('Please select or specify your clinical professional role.');
      return;
    }

    if (!organization.trim()) {
      setSaveError('Organization, Hospital, or Practice Name is required.');
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save professional profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Disconnect / Revoke Patient Access from Doctor side
  const handleConfirmDisconnectPatient = async () => {
    if (!disconnectingRel || !user) return;
    try {
      const res = await authorizationService.revokePatientAccessByDoctor(disconnectingRel.id, user.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Patient relationship with ${disconnectingRel.patientName} was disconnected. Access to their Medication Twin has ended.`,
        });
        await loadClinicalData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to disconnect patient.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error disconnecting patient.' });
    } finally {
      setDisconnectingRel(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Cancel Outgoing Pending Connection Request
  const handleCancelPendingRequest = async (relId: string) => {
    if (!user) return;
    try {
      const res = await authorizationService.cancelPendingRequestByDoctor(relId, user.id);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: 'Connection request canceled.',
        });
        await loadClinicalData();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to cancel request.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error canceling request.' });
    } finally {
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
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete clinician account.' });
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
              onClick={() => navigate('/doctor/dashboard')}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Clinician Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
              <Settings className="w-6 h-6 text-teal-600" />
              <span>Clinician Practice & Account Settings</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Manage professional identity, patient connections, and clinical authorization preferences.
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

        {/* SECTION 1: Professional Clinical Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Professional Identity & Practice Profile</h2>
              <p className="text-[11px] text-slate-500">
                Credentials displayed to patients when establishing authorization relationships
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Professional profile details updated successfully.</span>
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
                  Full Clinician Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Joel Miller"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Email Address <span className="text-slate-400 font-normal">(Account Identity)</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={professionalRole}
                  onChange={(e) => setProfessionalRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {COMMON_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {professionalRole === 'Other' && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Specify clinical role..."
                    className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Specialization / Focus
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Geriatric Polypharmacy & Deprescribing"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital, Health System, or Practice Organization <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. St. Jude Regional Medical Center"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-70 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Practice Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: Connected Patients & Access Revocation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Authorized Connected Patients ({activePatients.length})</h2>
                <p className="text-[11px] text-slate-500">
                  Patients who have authorized access for medication twin monitoring and safety reconciliations
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/doctor/connect')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Connect New Patient</span>
            </button>
          </div>

          {isLoadingClinicalData ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>Loading patient relationships...</span>
            </div>
          ) : activePatients.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
              <p className="font-medium text-slate-800">No active patient connections.</p>
              <p className="mt-1 text-slate-500">
                To connect with a patient, request their unique Connection Code (e.g. PT-ANGELIN-4821) and connect via the Connect Patient screen.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePatients.map((rel) => (
                <div
                  key={rel.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <span>{rel.patientName}</span>
                      <span className="font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800">
                        {rel.patientConnectionCode}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Authorized on {rel.authorizedAt ? new Date(rel.authorizedAt).toLocaleDateString() : 'Active'} • Full Twin Access
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/patient-view?patientId=${encodeURIComponent(rel.patientId)}`)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs"
                    >
                      View Twin
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisconnectingRel(rel)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Outgoing Pending Requests */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pending Outgoing Connection Requests ({pendingRequests.length})</h2>
                <p className="text-[11px] text-slate-500">
                  Requests sent to patient connection codes waiting for patient authorization
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/doctor/requests')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
            >
              View Requests Log
            </button>
          </div>

          {isLoadingClinicalData ? (
            <div className="py-4 text-center text-xs text-slate-400">Loading pending requests...</div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              No outgoing requests currently awaiting patient approval.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-amber-950 flex items-center space-x-2">
                      <span className="font-mono bg-amber-100/90 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
                        {req.patientConnectionCode}
                      </span>
                      <span className="text-amber-800 font-medium">{req.patientName}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Requested on {new Date(req.createdAt).toLocaleDateString()} • Pending patient confirmation
                    </p>
                  </div>

                  <button
                    onClick={() => handleCancelPendingRequest(req.id)}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cancel Request</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Clinical Alerts & Notification Status (Truthful) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <BellOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Alert Thresholds & Notifications</h2>
              <p className="text-[11px] text-slate-500">Automated alerting status and messaging configuration</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-bold text-slate-900">Synchronous In-App Decision Support Only</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              MediTwin AI operates with zero asynchronous SMS or automated pager integration in this deployment. Clinical risk alerts (e.g. STOPP/START, Beers criteria, Contraindications, CYP interactions) are calculated deterministically and presented directly in the Clinical Risk Matrix, Patient View, and Simulation Sandbox during active clinician reviews.
            </p>
          </div>
        </div>

        {/* SECTION 5: Security Architecture, Privacy & Clinical Guidelines */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Clinical Data Governance & Support Guidelines</span>
          </h2>

          {/* Privacy Policy Toggle */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
              className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Clinician Data Governance & Privacy Architecture</span>
              </div>
              {showPrivacyPolicy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showPrivacyPolicy && (
              <div className="p-4 text-xs text-slate-600 space-y-2.5 border-t border-slate-200 bg-white leading-relaxed">
                <p>
                  <strong>1. Strict Patient Consent Barrier:</strong> Clinicians cannot query, browse, or discover unassociated patients. Entering a connection code only issues an authorization request; no medical records are transmitted until the patient explicitly accepts.
                </p>
                <p>
                  <strong>2. Bilateral Access Disconnection:</strong> Either party can revoke clinical access at any time. When disconnected, clinician permissions are revoked immediately and patient medical data is rendered inaccessible.
                </p>
                <p>
                  <strong>3. Cryptographic Storage:</strong> Authentication credentials use Web Crypto SHA-256 with individualized 16-byte cryptographic salt. No plaintext credentials or patient data are stored insecurely.
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
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Clinical Support & Decision Engine Documentation</span>
              </div>
              {showHelpSupport ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showHelpSupport && (
              <div className="p-4 text-xs text-slate-600 space-y-2 border-t border-slate-200 bg-white leading-relaxed">
                <p>
                  <strong>Establishing Connections:</strong> Request the patient's unique code from their Patient Profile (e.g. PT-ANGELIN-4821) and enter it via the Connect Patient screen.
                </p>
                <p>
                  <strong>Clinical Decision Support Engine:</strong> Evidence ratings and interaction mechanisms follow established clinical pharmacology compendia and geriatric guidelines (Beers criteria).
                </p>
                <p>
                  <strong>Technical Questions:</strong> For prototype platform support, email the developer at{' '}
                  <a href="mailto:bew19073@gmail.com" className="text-teal-600 underline font-medium">
                    bew19073@gmail.com
                  </a>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Danger Zone (Account Deletion) */}
        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-rose-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">Danger Zone • Clinician Account Deletion</h2>
              <p className="text-[11px] text-rose-600">
                Permanently purge your clinician profile, hospital credentials, and revoke all patient links
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-600 max-w-xl">
              Deleting your clinician account immediately disconnects all patient relationships and removes your professional profile from the registry.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Clinician Account</span>
            </button>
          </div>
        </div>

        {/* Medical Safety Disclaimer Notice */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950">Clinical Prototype Safety Disclaimer:</span>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              MediTwin AI is a decision-support prototype. It does not replace clinical judgment, institutional hospital formulary guidelines, or individualized physician review. Always verify clinical recommendations with authoritative clinical compendia.
            </p>
          </div>
        </div>

      </div>

      {/* Disconnect Patient Confirmation Modal */}
      {disconnectingRel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Disconnect Patient</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to disconnect <strong>{disconnectingRel.patientName}</strong> ({disconnectingRel.patientConnectionCode})?
                You will immediately lose access to their Medication Twin and clinical records.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectingRel(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnectPatient}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Confirm Disconnect
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
              <h3 className="text-base font-bold text-rose-900">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will permanently delete your clinician profile, hospital credentials, and disconnect all patient links.
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

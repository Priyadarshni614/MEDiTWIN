/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { EmergencyPassportSummary, EmergencyPassportShare } from '../models/passportTypes';
import { passportService } from '../services/passportService';
import { authorizationService } from '../services/authorizationService';
import { MedicationPassportCard } from '../components/passport/MedicationPassportCard';
import { EmergencyQrModal } from '../components/passport/EmergencyQrModal';
import { demoService } from '../services/demoService';
import { 
  ArrowLeft, 
  QrCode, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

export const PatientPassportPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  const [passport, setPassport] = useState<EmergencyPassportSummary | null>(null);
  const [activeShare, setActiveShare] = useState<EmergencyPassportShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isDemo = demoService.isDemoUser(user?.email);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const summary = await passportService.getEmergencyPassportSummary(user.id);
        setPassport(summary);

        const share = await passportService.getActiveShare(user.id);
        setActiveShare(share);
      } catch (err) {
        console.error('Failed to load emergency passport:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleGenerateShare = async (durationHours: number) => {
    if (!user) return;
    try {
      const share = await passportService.createEmergencyShare(user.id, durationHours);
      setActiveShare(share);
      setFeedbackMessage(`Emergency QR access generated! Active for ${durationHours} hours.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate share:', err);
    }
  };

  const handleRevokeShare = async () => {
    if (!user) return;
    try {
      await passportService.revokeEmergencyShare(user.id, activeShare?.token);
      setActiveShare(null);
      setFeedbackMessage('Emergency QR access revoked immediately.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 py-16 px-4 bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Synthesizing Emergency Medication Passport...
          </p>
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="flex-1 py-12 px-4 bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Passport Unavailable</h2>
          <p className="text-xs text-slate-500">
            Could not compile emergency passport. Please complete your patient profile and add active medications.
          </p>
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {activeShare && activeShare.status === 'ACTIVE' ? (
              <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>QR Access Active</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                QR Access Inactive
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{feedbackMessage}</span>
            </div>
          </div>
        )}

        {/* Demo Patient Banner */}
        {isDemo && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] tracking-wide uppercase">
                Demo Patient
              </span>
              <span className="font-semibold">DEMO DATA — NOT REAL PATIENT INFORMATION</span>
            </div>
            <span className="text-[11px] text-amber-700 hidden sm:inline">
              Angelin Steve • Emergency Passport Active
            </span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Emergency Medication Passport
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid-access pharmacological summary with verified safety warnings and critical allergy alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            
            {/* View / Generate QR Code Button */}
            <button
              id="passport-qr-btn"
              onClick={() => setQrModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{activeShare && activeShare.status === 'ACTIVE' ? 'View Emergency QR' : 'Generate QR Code'}</span>
            </button>

            {/* Revoke QR Access if active */}
            {activeShare && activeShare.status === 'ACTIVE' && (
              <button
                id="passport-revoke-btn"
                onClick={handleRevokeShare}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 shadow-xs flex items-center space-x-1.5 cursor-pointer"
                title="Immediately revoke emergency QR access"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Revoke QR Access</span>
              </button>
            )}
          </div>
        </div>

        {/* Passport Card View */}
        <MedicationPassportCard passport={passport} showEmergencyBanner={true} />

        {/* QR Code Modal */}
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

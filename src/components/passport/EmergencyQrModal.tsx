/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Copy, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Lock, 
  Download,
  ExternalLink
} from 'lucide-react';
import { EmergencyPassportShare } from '../../models/passportTypes';

interface EmergencyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShare: EmergencyPassportShare | null;
  onGenerateShare: (durationHours: number) => Promise<void>;
  onRevokeShare: () => Promise<void>;
}

export const EmergencyQrModal: React.FC<EmergencyQrModalProps> = ({
  isOpen,
  onClose,
  activeShare,
  onGenerateShare,
  onRevokeShare,
}) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [durationHours, setDurationHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
  const shareUrl = activeShare
    ? `${origin}${pathname}#/passport/view?token=${encodeURIComponent(activeShare.token)}`
    : '';

  const handleGenerate = async () => {
    if (!hasConsented && !activeShare) return;
    setLoading(true);
    try {
      await onGenerateShare(durationHours);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await onRevokeShare();
      setHasConsented(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = () => {
    if (!activeShare?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = activeShare.qrDataUrl;
    a.download = `meditwin-emergency-qr-${activeShare.patientName.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Emergency Medication QR Access</h3>
              <p className="text-xs text-slate-300">
                Secure, revocable access token for emergency first responders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Active QR View */}
          {activeShare && activeShare.status === 'ACTIVE' ? (
            <div className="space-y-5 text-center">
              
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Emergency QR Access Active</span>
              </div>

              {/* QR Image Container */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
                {activeShare.qrDataUrl ? (
                  <img
                    src={activeShare.qrDataUrl}
                    alt="Emergency Medication Passport QR Code"
                    className="w-56 h-56 mx-auto rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                    Generating QR code...
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  Token: {activeShare.token.substring(0, 8)}... (Cryptographic)
                </p>
              </div>

              {/* Expiration Details */}
              <div className="bg-sky-50 rounded-xl p-3 border border-sky-200 text-left text-xs text-sky-900 flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Expires:</span>
                  <p className="text-sky-800">
                    {new Date(activeShare.expiresAt).toLocaleString()} ({Math.max(0, Math.round((new Date(activeShare.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))} hours remaining)
                  </p>
                </div>
              </div>

              {/* Security Architecture Notice */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Privacy &amp; Security Architecture:</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Medical records and allergy lists are <strong>never embedded</strong> directly inside the QR code matrix. The QR code contains only a secure, non-guessable random token URL. Access can be immediately revoked below at any time.
                </p>
              </div>

              {/* Action Buttons for Active Share */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Secure Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct View Link */}
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-sky-600 hover:text-sky-700 font-semibold"
              >
                <span>Preview Emergency View in Browser</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Revoke Button */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{loading ? 'Revoking Access...' : 'Revoke QR Access Immediately'}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  Revoking invalidates this token immediately. Anyone scanning the QR code will be denied access.
                </p>
              </div>

            </div>
          ) : (
            /* Creation & Consent View */
            <div className="space-y-4">
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3 text-xs text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Authorized Emergency Sharing</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Generate a temporary, non-guessable QR access token for first responders, emergency medical personnel, or hospital triage.
                  </p>
                </div>
              </div>

              {/* Security Guarantees */}
              <div className="space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-900">Security &amp; Privacy Protocol:</h4>
                <ul className="space-y-1.5 list-disc pl-5 text-[11px] text-slate-600">
                  <li><strong>Zero Raw Data in QR:</strong> Sensitive medical details, allergies, and diagnoses are never embedded directly in the QR code matrix.</li>
                  <li><strong>Unguessable Token:</strong> Encodes only a 128-bit cryptographic token URL.</li>
                  <li><strong>Automatic Expiration:</strong> Token automatically expires after your selected duration.</li>
                  <li><strong>Instant Revocation:</strong> You can revoke access at any second with a single click.</li>
                  <li><strong>Strictly Read-Only:</strong> Emergency personnel cannot modify your records.</li>
                </ul>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Token Validity Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { hours: 1, label: '1 Hour' },
                    { hours: 12, label: '12 Hours' },
                    { hours: 24, label: '24 Hours (Standard)' },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setDurationHours(opt.hours)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        durationHours === opt.hours
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandatory Consent Checkbox */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4 border-slate-300"
                  />
                  <span className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    <strong>Explicit Patient Consent:</strong> I authorize MEDiTWIN AI to generate a temporary, revocable emergency access token for my medication passport. I understand I can revoke this token at any time.
                  </span>
                </label>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!hasConsented || loading}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{loading ? 'Generating Secure QR...' : 'Generate Emergency QR Code'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            MEDiTWIN AI Emergency Access Control
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  HeartPulse, 
  AlertTriangle, 
  Pill, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Calendar, 
  Clock, 
  Info,
  Phone,
  FileCheck2,
  BookOpen
} from 'lucide-react';
import { EmergencyPassportSummary } from '../../models/passportTypes';

interface MedicationPassportCardProps {
  passport: EmergencyPassportSummary;
  showEmergencyBanner?: boolean;
}

export const MedicationPassportCard: React.FC<MedicationPassportCardProps> = ({
  passport,
  showEmergencyBanner = false,
}) => {
  const {
    fullName,
    age,
    gender,
    weight,
    allergies,
    chronicConditions,
    emergencyContact,
    activeMedications,
    lastSafetyAnalysisDate,
    safetyScore,
    safetyRating,
    importantVerifiedFindings,
    disclaimer,
    generatedAt,
  } = passport;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Emergency Responder Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Emergency Medication Passport</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {fullName || <span className="italic text-slate-400">Not provided</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
              <span>
                Age: <strong className="text-white">{age !== null && age !== undefined ? `${age} yrs` : 'Not provided'}</strong>
              </span>
              <span>•</span>
              <span className="capitalize">
                Gender: <strong className="text-white">{gender || 'Not provided'}</strong>
              </span>
              <span>•</span>
              <span>
                Weight: <strong className="text-white">{weight || 'Not provided'}</strong>
              </span>
              <span>•</span>
              <span>
                Blood Type: <strong className="text-slate-400">Not provided</strong>
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-mono font-bold">
              ID: {passport.patientId ? `PT-${passport.patientId.substring(0, 8).toUpperCase()}` : 'Unavailable'}
            </span>
            <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
              <p>
                <strong>Last Updated:</strong>{' '}
                {new Date(passport.lastUpdated || generatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-slate-400 text-[10px]">
                Snapshot ID: {generatedAt ? new Date(generatedAt).toISOString().slice(0, 10) : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Prominent Warning: Information May Be Incomplete or Outdated */}
        <div className="mt-4 p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300">CLINICAL NOTICE — INCOMPLETE / OUTDATED DATA WARNING:</span>
            <p className="text-amber-100 leading-relaxed text-[11px]">
              This emergency medication passport reflects patient-reported and clinician-verified records as of the recorded timestamp. The information presented may be incomplete or outdated. Healthcare providers and first responders must exercise independent clinical discretion before administering treatment.
            </p>
          </div>
        </div>

        {showEmergencyBanner && (
          <div className="mt-2.5 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Emergency Triage Note:</strong> Check documented allergies and critical drug interactions before administering acute pharmaceutical interventions.
            </span>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        
        {/* SECTION 1: CRITICAL ALLERGIES & MEDICAL CONDITIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Allergies Box */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Documented Medication Allergies</span>
            </div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-3 py-1 bg-white text-rose-700 font-bold text-xs rounded-xl border border-rose-300 shadow-2xs flex items-center space-x-1"
                  >
                    <span>⚠️</span>
                    <span>{allergy}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic pt-1">
                No medication allergies recorded.
              </p>
            )}
          </div>

          {/* Chronic Conditions Box */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <HeartPulse className="w-4 h-4 text-amber-700" />
              <span>Relevant Medical Conditions</span>
            </div>
            {chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {chronicConditions.map((cond) => (
                  <span
                    key={cond}
                    className="px-3 py-1 bg-white text-amber-900 font-semibold text-xs rounded-xl border border-amber-300 shadow-2xs"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic pt-1">
                No chronic medical conditions recorded.
              </p>
            )}
          </div>

        </div>

        {/* SECTION 2: EMERGENCY CONTACT */}
        {emergencyContact ? (
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Emergency Contact
                </span>
                <span className="font-bold text-slate-800">
                  {emergencyContact.name} ({emergencyContact.relationship || 'Contact'})
                </span>
              </div>
            </div>
            <a
              href={`tel:${emergencyContact.phone}`}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-500 text-teal-700 font-bold rounded-xl transition-all shadow-xs"
            >
              {emergencyContact.phone || 'No phone'}
            </a>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Emergency Contact: <strong className="text-slate-600">Not provided</strong></span>
            <span className="text-[11px] text-slate-400">Can be updated in patient profile</span>
          </div>
        )}

        {/* SECTION 3: CURRENT ACTIVE MEDICATIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Current Active Medications ({activeMedications.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Recorded in Medication Twin
            </span>
          </div>

          {activeMedications.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500 italic">
              No active medications currently registered in this patient's profile.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Medication Name</th>
                    <th scope="col" className="px-4 py-3 text-left">Strength</th>
                    <th scope="col" className="px-4 py-3 text-left">Dose &amp; Frequency</th>
                    <th scope="col" className="px-4 py-3 text-left">Route</th>
                    <th scope="col" className="px-4 py-3 text-left">Prescriber / Purpose</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeMedications.map((med, idx) => (
                    <tr key={med.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div>
                          <span>{med.name}</span>
                          {med.brandName && (
                            <span className="text-[11px] text-slate-500 block font-normal">
                              Brand: {med.brandName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {med.strength !== 'Not provided' ? (
                          <span className="font-semibold">{med.strength}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>
                          <span>{med.dosage}</span>
                          <span className="text-slate-500 block text-[11px]">{med.frequency}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">
                        {med.route}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        <div>
                          <span>{med.prescribedBy || (med.source === 'PRESCRIPTION_OCR' ? 'Prescription Slip' : 'Self-recorded')}</span>
                          {med.purpose && (
                            <span className="text-slate-400 block truncate max-w-xs">{med.purpose}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 4: IMPORTANT VERIFIED FINDINGS (PHASE 4 SAFETY ANALYSIS) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Verified Medication Safety Findings (Phase 4)
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">
                Last Analysis: <strong className="text-slate-700">{lastSafetyAnalysisDate ? new Date(lastSafetyAnalysisDate).toLocaleDateString() : 'Unavailable'}</strong>
              </span>
              {safetyScore !== null && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
                  Prototype Score: {safetyScore}/100
                </span>
              )}
            </div>
          </div>

          {importantVerifiedFindings.length === 0 ? (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-start space-x-3 text-xs text-emerald-950">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No verified clinical issues or contraindications identified</span>
                <p className="text-emerald-800 mt-0.5">
                  Absence of documented issues does not guarantee absolute safety. Always review all combinations with a clinical pharmacist or prescribing physician.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {importantVerifiedFindings.map((finding) => {
                const isContra = finding.severity === 'contraindicated';
                const isHigh = finding.severity === 'high';
                return (
                  <div
                    key={finding.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                      isContra
                        ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                        : isHigh
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wide border ${
                          isContra
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {finding.severity || 'Caution'}
                        </span>
                        <span className="text-sm font-extrabold">{finding.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {finding.category}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-700">
                      Involved: <span className="font-bold text-slate-900">{finding.involvedMedications.join(' + ')}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {finding.explanation}
                    </p>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[11px] text-slate-600 font-medium">
                        <strong className="text-slate-800">Clinical Significance:</strong> {finding.clinicalSignificance}
                      </div>
                      <div className="text-[11px] text-teal-900 font-medium">
                        <strong className="text-teal-950">Action Guidance:</strong> {finding.recommendationNote}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: {finding.sourceReference}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 5: PROMINENT CLINICAL & LEGAL DISCLAIMER */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">INFORMATIONAL PASSPORT ADVISORY</span>
            <p className="text-amber-900 leading-relaxed text-[11px]">
              {disclaimer}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Prescription } from '../../models/types';
import { X, FileText, CheckCircle2, AlertCircle, Clock, Stethoscope, Calendar, ExternalLink } from 'lucide-react';

interface PrescriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

export const PrescriptionDetailsModal: React.FC<PrescriptionDetailsModalProps> = ({
  isOpen,
  onClose,
  prescription,
}) => {
  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Prescription Slip Details
              </h3>
              <p className="text-xs text-slate-300">
                Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()} • {prescription.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              prescription.verificationStatus === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verification: {prescription.verificationStatus}</span>
            </span>

            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>OCR Status: {prescription.extractionStatus}</span>
            </span>
          </div>

          {/* Image Preview & Prescription Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Prescription Slip Document
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center relative group">
                <img
                  src={prescription.imageUrl}
                  alt={prescription.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Clinical Metadata
              </span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Prescribing Doctor</span>
                  <span className="font-bold text-slate-800">{prescription.doctorName || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Prescription Date</span>
                  <span className="font-bold text-slate-800">{prescription.prescriptionDate || 'Not detected'}</span>
                </div>
                {prescription.notes && (
                  <div>
                    <span className="text-slate-400 font-medium block">Clinical Notes</span>
                    <span className="text-slate-700">{prescription.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Extracted Medications List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Medications ({prescription.extractedMedications?.length || 0})
              </span>
            </div>

            {(!prescription.extractedMedications || prescription.extractedMedications.length === 0) ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                No medications extracted from this document.
              </div>
            ) : (
              <div className="space-y-2">
                {prescription.extractedMedications.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        {item.strength && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            {item.strength}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.dosage} • {item.frequency} • {item.route || 'Oral'} {item.duration ? `• ${item.duration}` : ''}
                      </p>
                    </div>

                    {item.confidence && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        item.confidence === 'High'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.confidence === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.confidence} Confidence
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

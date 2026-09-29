/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Medication } from '../../models/types';
import { 
  X, 
  Pill, 
  Clock, 
  Calendar, 
  Stethoscope, 
  ShieldAlert, 
  Sparkles, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';

interface MedicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
  isReadOnly?: boolean;
  onEdit?: (medication: Medication) => void;
  onDiscontinue?: (medication: Medication) => void;
}

export const MedicationDetailsModal: React.FC<MedicationDetailsModalProps> = ({
  isOpen,
  onClose,
  medication,
  isReadOnly = false,
  onEdit,
  onDiscontinue,
}) => {
  if (!isOpen || !medication) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {medication.name}
                </h3>
                {medication.strength && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {medication.strength}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {medication.genericName ? `Generic: ${medication.genericName}` : 'Medication Clinical Details'}
                {medication.brandName ? ` • Brand: ${medication.brandName}` : ''}
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status & Source Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {medication.active ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Regimen</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Discontinued / Historical</span>
              </span>
            )}

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              <FileText className="w-3 h-3 text-sky-600" />
              <span>Source: {medication.source === 'PRESCRIPTION_OCR' ? 'Prescription Scan' : 'Manual Entry'}</span>
            </span>

            {isReadOnly && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span>Read-only clinical view</span>
              </span>
            )}
          </div>

          {/* Core Regimen Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Dosage</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.dosage}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Frequency</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.frequency}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Route</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.route || 'Oral'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Duration</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.duration || 'Ongoing'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Start Date</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.startDate || 'Not recorded'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">End Date</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{medication.endDate || (medication.active ? 'Active' : 'Ended')}</span>
            </div>
          </div>

          {/* Clinical Purpose & Doctor */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Clinical Purpose / Indication
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                {medication.purpose || 'No specific clinical indication entered.'}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Prescribed By / Care Facility
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{medication.prescribedBy || 'Attending Physician'}</span>
              </div>
            </div>
          </div>

          {/* Required Notice: Risk analysis will be available in next phase */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 to-teal-50 rounded-xl border border-sky-200 flex items-start space-x-3 text-xs">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-950 block">
                Medication Safety &amp; Risk Analysis
              </span>
              <p className="text-sky-800 mt-0.5 text-[11px]">
                Risk analysis will be available in the next phase. Drug-drug interactions, duplicate therapies, and anticholinergic cognitive burdens will be computed by the Stage 4 engine.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            ID: {medication.id}
          </div>

          <div className="flex items-center space-x-2">
            {!isReadOnly && medication.active && onDiscontinue && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDiscontinue(medication);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Discontinue
              </button>
            )}

            {!isReadOnly && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(medication);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

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
    </div>
  );
};

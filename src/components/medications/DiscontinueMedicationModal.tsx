/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medication } from '../../models/types';
import { medicationService } from '../../services/medicationService';
import { AlertTriangle, X, Check, Calendar } from 'lucide-react';

interface DiscontinueMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  medication: Medication | null;
  onDiscontinued: (medication: Medication) => void;
}

export const DiscontinueMedicationModal: React.FC<DiscontinueMedicationModalProps> = ({
  isOpen,
  onClose,
  patientId,
  medication,
  onDiscontinued,
}) => {
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !medication) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await medicationService.discontinueMedication(
        patientId,
        medication.id,
        endDate
      );
      onDiscontinued(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to discontinue medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Discontinue Medication
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Are you sure you want to discontinue <span className="font-bold text-slate-900">{medication.name}</span> ({medication.strength})?
          </p>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            This medication will be moved from your <span className="font-semibold text-slate-900">Current Medications</span> to your permanent <span className="font-semibold text-slate-900">Medication History</span>. It will not be deleted.
          </div>
        </div>

        {/* Input Fields */}
        <div className="px-6 space-y-3">
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discontinuation Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinical Reason / Notes (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Course completed, switched therapy, side effect"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-5 mt-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Updating Twin...' : 'Confirm Discontinue'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

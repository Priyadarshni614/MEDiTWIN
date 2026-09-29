/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      {/* Medical Safety Disclaimer Notice */}
      <div className="bg-amber-50/70 border-b border-amber-200/60 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start space-x-3 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-800">
            <span className="font-semibold text-amber-900">Medical Safety Disclaimer:</span> MediTwin AI is a prototype clinical decision-support tool. It does not diagnose disease or replace a qualified healthcare professional. Always consult licensed medical providers for diagnostic, therapeutic, and prescribing decisions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-sm tracking-tight">MEDiTWIN AI</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Personalized Medication Safety & Polypharmacy Intelligence</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Personalized kinetic digital twin for multi-drug safety, interaction intelligence, and deprescribing guidance.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/70">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isolated Architecture & Web Crypto</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

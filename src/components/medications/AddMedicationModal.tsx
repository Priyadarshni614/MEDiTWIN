/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Medication } from '../../models/types';
import { medicationCatalogService, CatalogMedication } from '../../services/medicationCatalogService';
import { medicationService, AddMedicationInput } from '../../services/medicationService';
import { X, Search, Sparkles, AlertCircle, Pill, Calendar, User, Check, Stethoscope } from 'lucide-react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  medicationToEdit?: Medication | null;
  onSaved: (medication: Medication) => void;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  isOpen,
  onClose,
  patientId,
  medicationToEdit,
  onSaved,
}) => {
  const isEditing = !!medicationToEdit;

  // Form State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [dosageUnit, setDosageUnit] = useState('tablet');
  const [frequency, setFrequency] = useState('Once daily');
  const [route, setRoute] = useState('Oral');
  const [duration, setDuration] = useState('Ongoing');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<CatalogMedication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name || '');
      setGenericName(medicationToEdit.genericName || '');
      setBrandName(medicationToEdit.brandName || '');
      setStrength(medicationToEdit.strength || '');
      setDosage(medicationToEdit.dosage || '1 tablet');
      setDosageUnit(medicationToEdit.dosageUnit || 'tablet');
      setFrequency(medicationToEdit.frequency || 'Once daily');
      setRoute(medicationToEdit.route || 'Oral');
      setDuration(medicationToEdit.duration || 'Ongoing');
      setStartDate(medicationToEdit.startDate || '');
      setEndDate(medicationToEdit.endDate || '');
      setPurpose(medicationToEdit.purpose || '');
      setPrescribedBy(medicationToEdit.prescribedBy || '');
    } else {
      // Defaults for new medication
      setName('');
      setGenericName('');
      setBrandName('');
      setStrength('');
      setDosage('1 tablet');
      setDosageUnit('tablet');
      setFrequency('Once daily');
      setRoute('Oral');
      setDuration('Ongoing');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setPurpose('');
      setPrescribedBy('');
    }
    setErrors({});
    setSuggestions([]);
    setShowSuggestions(false);
  }, [medicationToEdit, isOpen]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
    if (val.trim().length >= 2) {
      const results = medicationCatalogService.search(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: CatalogMedication) => {
    setName(item.name);
    setGenericName(item.genericName);
    setBrandName(item.brandName);
    setStrength(item.defaultStrength);
    setDosage(item.defaultDosage);
    setDosageUnit(item.defaultDosageUnit);
    setFrequency(item.defaultFrequency);
    setRoute(item.defaultRoute);
    setPurpose(item.defaultPurpose);
    setShowSuggestions(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Medicine Name is required';
    if (!dosage.trim()) errs.dosage = 'Dosage is required (e.g. 1 tablet)';
    if (!frequency.trim()) errs.frequency = 'Frequency is required (e.g. Twice daily)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const inputData: AddMedicationInput = {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        brandName: brandName.trim() || undefined,
        strength: strength.trim(),
        dosage: dosage.trim(),
        dosageUnit: dosageUnit.trim() || undefined,
        frequency: frequency.trim(),
        route: route.trim(),
        duration: duration.trim() || 'Ongoing',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        purpose: purpose.trim() || undefined,
        prescribedBy: prescribedBy.trim() || undefined,
        source: medicationToEdit ? medicationToEdit.source : 'MANUAL',
      };

      let saved: Medication;
      if (isEditing && medicationToEdit) {
        saved = await medicationService.updateMedication(patientId, medicationToEdit.id, inputData);
      } else {
        saved = await medicationService.addMedication(patientId, inputData);
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save medication' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Medication' : 'Add Medication Manually'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing
                  ? 'Update medication details in your Personalized Digital Medication Twin.'
                  : 'Enter prescription or over-the-counter medication details.'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Autocomplete Search & Medicine Name */}
          <div ref={searchContainerRef} className="relative">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="med-input-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Metformin, Lisinopril, Atorvastatin..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                }`}
                autoComplete="off"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50/80 border-b border-teal-100 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Clinical Catalog Suggestions (Click to autofill)</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {item.defaultStrength}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>Brand: {item.brandName}</span>
                      <span>•</span>
                      <span className="truncate">{item.defaultPurpose}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generic Name & Brand Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Generic Molecule Name
              </label>
              <input
                id="med-input-generic"
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Metformin hydrochloride"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brand / Trade Name
              </label>
              <input
                id="med-input-brand"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Glucophage"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Strength, Dosage, Dosage Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Strength
              </label>
              <input
                id="med-input-strength"
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg, 10 mg"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dosage <span className="text-rose-500">*</span>
              </label>
              <input
                id="med-input-dosage"
                type="text"
                value={dosage}
                onChange={(e) => {
                  setDosage(e.target.value);
                  if (errors.dosage) setErrors((prev) => ({ ...prev, dosage: '' }));
                }}
                placeholder="e.g. 1 tablet, 2 capsules"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  errors.dosage ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                }`}
              />
              {errors.dosage && <p className="text-[10px] text-rose-600 mt-0.5">{errors.dosage}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dosage Form / Unit
              </label>
              <select
                id="med-select-unit"
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="mg">mg</option>
                <option value="ml">ml (liquid)</option>
                <option value="puffs">Puffs (inhaler)</option>
                <option value="drops">Drops</option>
                <option value="patch">Patch</option>
                <option value="units">Units (insulin)</option>
              </select>
            </div>
          </div>

          {/* Frequency & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Frequency <span className="text-rose-500">*</span>
              </label>
              <input
                id="med-input-frequency"
                type="text"
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  if (errors.frequency) setErrors((prev) => ({ ...prev, frequency: '' }));
                }}
                placeholder="e.g. Twice daily with meals, Once daily"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  errors.frequency ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                }`}
              />
              {errors.frequency && <p className="text-[10px] text-rose-600 mt-0.5">{errors.frequency}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Route
              </label>
              <select
                id="med-select-route"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="Oral">Oral (PO)</option>
                <option value="Sublingual">Sublingual</option>
                <option value="Inhalation">Inhalation</option>
                <option value="Topical">Topical</option>
                <option value="Subcutaneous">Subcutaneous (SC)</option>
                <option value="Intravenous">Intravenous (IV)</option>
                <option value="Ophthalmic">Ophthalmic (Eye drops)</option>
                <option value="Otic">Otic (Ear drops)</option>
              </select>
            </div>
          </div>

          {/* Duration, Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration
              </label>
              <input
                id="med-input-duration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. Ongoing, 30 days, 7 days"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                id="med-input-startdate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date (Optional)
              </label>
              <input
                id="med-input-enddate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Purpose & Prescribed By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Purpose / Indication
              </label>
              <input
                id="med-input-purpose"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, High blood pressure"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prescribed By (Doctor / Clinic)
              </label>
              <input
                id="med-input-prescribedby"
                type="text"
                value={prescribedBy}
                onChange={(e) => setPrescribedBy(e.target.value)}
                placeholder="e.g. Dr. Joel Steve, MD"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="med-save-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Medication' : 'Save to Medication Twin'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

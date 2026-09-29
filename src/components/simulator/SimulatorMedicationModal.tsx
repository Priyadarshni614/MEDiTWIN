/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ProposedMedicationItem } from '../../models/simulatorTypes';
import { medicationCatalogService, CatalogMedication } from '../../services/medicationCatalogService';
import { X, Search, Sparkles, AlertCircle, Pill } from 'lucide-react';

interface SimulatorMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  itemToEdit?: ProposedMedicationItem | null;
  onApply: (item: ProposedMedicationItem) => void;
}

export const SimulatorMedicationModal: React.FC<SimulatorMedicationModalProps> = ({
  isOpen,
  onClose,
  patientId,
  itemToEdit,
  onApply,
}) => {
  const isEditing = !!itemToEdit;

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [dosageUnit, setDosageUnit] = useState('tablet');
  const [frequency, setFrequency] = useState('Once daily');
  const [route, setRoute] = useState('Oral');
  const [duration, setDuration] = useState('Ongoing');
  const [purpose, setPurpose] = useState('');

  const [suggestions, setSuggestions] = useState<CatalogMedication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setGenericName(itemToEdit.genericName || '');
      setBrandName(itemToEdit.brandName || '');
      setStrength(itemToEdit.strength || '');
      setDosage(itemToEdit.dosage || '1 tablet');
      setDosageUnit(itemToEdit.dosageUnit || 'tablet');
      setFrequency(itemToEdit.frequency || 'Once daily');
      setRoute(itemToEdit.route || 'Oral');
      setDuration(itemToEdit.duration || 'Ongoing');
      setPurpose(itemToEdit.purpose || '');
    } else {
      setName('');
      setGenericName('');
      setBrandName('');
      setStrength('');
      setDosage('1 tablet');
      setDosageUnit('tablet');
      setFrequency('Once daily');
      setRoute('Oral');
      setDuration('Ongoing');
      setPurpose('');
    }
    setErrors({});
    setShowSuggestions(false);
  }, [itemToEdit, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim().length >= 2) {
      const results = medicationCatalogService.search(val, 6);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (catMed: CatalogMedication) => {
    setName(catMed.name);
    setGenericName(catMed.genericName);
    setBrandName(catMed.brandName);
    setStrength(catMed.defaultStrength);
    setDosage(catMed.defaultDosage);
    setDosageUnit(catMed.defaultDosageUnit);
    setFrequency(catMed.defaultFrequency);
    setRoute(catMed.defaultRoute);
    setPurpose(catMed.defaultPurpose);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Medication name is required';
    if (!dosage.trim()) newErrors.dosage = 'Dosage is required (e.g. 1 tablet)';
    if (!frequency.trim()) newErrors.frequency = 'Frequency is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const now = new Date().toISOString();

    if (isEditing && itemToEdit) {
      // Build modification summary
      const changes: string[] = [];
      if (itemToEdit.strength !== strength) changes.push(`strength changed (${itemToEdit.strength} → ${strength})`);
      if (itemToEdit.dosage !== dosage) changes.push(`dosage changed (${itemToEdit.dosage} → ${dosage})`);
      if (itemToEdit.frequency !== frequency) changes.push(`frequency changed (${itemToEdit.frequency} → ${frequency})`);
      if (itemToEdit.name !== name) changes.push(`name changed`);

      const updatedItem: ProposedMedicationItem = {
        ...itemToEdit,
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        brandName: brandName.trim() || undefined,
        strength: strength.trim(),
        dosage: dosage.trim(),
        dosageUnit: dosageUnit.trim() || undefined,
        frequency: frequency.trim(),
        route: route.trim() || 'Oral',
        duration: duration.trim() || 'Ongoing',
        purpose: purpose.trim() || undefined,
        simulationAction: itemToEdit.simulationAction === 'ADDED' ? 'ADDED' : 'MODIFIED',
        modificationSummary: changes.length > 0 ? changes.join(', ') : 'Details modified in simulation',
        updatedAt: now,
      };
      onApply(updatedItem);
    } else {
      const newItem: ProposedMedicationItem = {
        id: `sim_med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        patientId,
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        brandName: brandName.trim() || undefined,
        strength: strength.trim(),
        dosage: dosage.trim(),
        dosageUnit: dosageUnit.trim() || undefined,
        frequency: frequency.trim(),
        route: route.trim() || 'Oral',
        duration: duration.trim() || 'Ongoing',
        purpose: purpose.trim() || undefined,
        source: 'MANUAL',
        createdAt: now,
        updatedAt: now,
        active: true,
        simulationAction: 'ADDED',
        modificationSummary: 'Proposed new medication added to temporary scenario',
      };
      onApply(newItem);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Modify Proposed Medication' : 'Add Proposed Medication to Simulation'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Temporary scenario edit • Does NOT modify your real Medication Twin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Autocomplete Medication Name */}
          <div ref={searchContainerRef} className="relative space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Medication Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Lisinopril, Metformin, Ibuprofen..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600 ${
                  errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-56 overflow-y-auto">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold bg-slate-50">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Catalog Matches</span>
                  </span>
                  <span>Click to autofill</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left p-2.5 hover:bg-purple-50/60 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {item.genericName} • {item.defaultStrength} • {item.category}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generic Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Generic Active Ingredient (Optional)
            </label>
            <input
              type="text"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Lisinopril, Acetaminophen"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600"
            />
          </div>

          {/* Strength & Dosage Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Strength <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg, 10 mg"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Dose Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 tablet, 2 puffs"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600 ${
                  errors.dosage ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {errors.dosage && <p className="text-[11px] text-rose-600">{errors.dosage}</p>}
            </div>
          </div>

          {/* Frequency & Route Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Frequency <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Once daily, Every 8 hours"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600 ${
                  errors.frequency ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {errors.frequency && <p className="text-[11px] text-rose-600">{errors.frequency}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-teal-600 bg-white"
              >
                <option value="Oral">Oral (by mouth)</option>
                <option value="Inhalation">Inhalation</option>
                <option value="Sublingual">Sublingual</option>
                <option value="Topical">Topical</option>
                <option value="Subcutaneous">Subcutaneous Injection</option>
              </select>
            </div>
          </div>

          {/* Clinical Indication / Purpose */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Intended Purpose / Indication (Optional)
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Blood pressure reduction, Joint pain relief"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-600"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isEditing ? 'Apply Simulation Edit' : 'Add to Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

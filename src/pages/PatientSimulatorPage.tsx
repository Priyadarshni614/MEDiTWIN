/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { medicationService } from '../services/medicationService';
import { prescriptionSimulatorService } from '../services/prescriptionSimulatorService';
import { Medication } from '../models/types';
import {
  ProposedMedicationItem,
  SimulationResult,
} from '../models/simulatorTypes';
import { SimulatorMedicationModal } from '../components/simulator/SimulatorMedicationModal';
import {
  Sliders,
  ArrowLeft,
  Dna,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  HelpCircle,
  FileCheck2,
  FileQuestion,
  Pill,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export const PatientSimulatorPage: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const { navigate } = useRouter();

  // Baseline real medications
  const [currentMeds, setCurrentMeds] = useState<Medication[]>([]);
  // Temporary proposed scenario in memory
  const [proposedItems, setProposedItems] = useState<ProposedMedicationItem[]>([]);
  // Simulation comparison output
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProposedMedicationItem | null>(null);

  // Success / notification message
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Load real active medications and initialize in-memory scenario
  const loadBaseline = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const active = await medicationService.getActiveMedications(user.id);
      setCurrentMeds(active);
      const initialProposed = prescriptionSimulatorService.createInitialProposedScenario(active);
      setProposedItems(initialProposed);

      // Run initial simulation if profile exists
      if (patientProfile) {
        const initialResult = prescriptionSimulatorService.runSimulation(
          patientProfile,
          active,
          initialProposed
        );
        setSimulationResult(initialResult);
      }
    } catch (err) {
      console.error('Failed to load baseline medications for simulator:', err);
    } finally {
      setLoading(false);
    }
  }, [user, patientProfile]);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  // Helper to re-evaluate simulation with new proposed items
  const recalculateSimulation = (newProposed: ProposedMedicationItem[]) => {
    if (!patientProfile) return;
    const result = prescriptionSimulatorService.runSimulation(
      patientProfile,
      currentMeds,
      newProposed
    );
    setSimulationResult(result);
  };

  // Execute Simulation manually on button click
  const handleRunSimulation = () => {
    if (!patientProfile) return;
    setSimulating(true);
    try {
      const result = prescriptionSimulatorService.runSimulation(
        patientProfile,
        currentMeds,
        proposedItems
      );
      setSimulationResult(result);
      setNoticeMessage('Simulation successfully executed against current Phase 4 clinical knowledge base.');
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Reset Scenario: Restores proposed scenario to mirror current Medication Twin exactly
  const handleResetScenario = () => {
    const initialProposed = prescriptionSimulatorService.createInitialProposedScenario(currentMeds);
    setProposedItems(initialProposed);
    if (patientProfile) {
      const resetResult = prescriptionSimulatorService.runSimulation(
        patientProfile,
        currentMeds,
        initialProposed
      );
      setSimulationResult(resetResult);
    }
    setNoticeMessage('Temporary proposed scenario reset to match your current Medication Twin.');
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Add proposed medication
  const handleAddMedication = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Edit proposed medication
  const handleEditItem = (item: ProposedMedicationItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Apply add or edit to proposed scenario
  const handleApplyItem = (item: ProposedMedicationItem) => {
    setProposedItems((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === item.id);
      let next: ProposedMedicationItem[];
      if (existsIndex >= 0) {
        next = [...prev];
        next[existsIndex] = item;
      } else {
        next = [...prev, item];
      }
      recalculateSimulation(next);
      return next;
    });
  };

  // Mark medication as REMOVED in proposed scenario or completely delete if it was newly ADDED
  const handleRemoveItem = (item: ProposedMedicationItem) => {
    setProposedItems((prev) => {
      let next: ProposedMedicationItem[];
      if (item.simulationAction === 'ADDED') {
        // Completely remove temporary item
        next = prev.filter((p) => p.id !== item.id);
      } else {
        // Mark existing original item as REMOVED
        next = prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                simulationAction: 'REMOVED',
                modificationSummary: 'Simulated removal from active regimen',
              }
            : p
        );
      }
      recalculateSimulation(next);
      return next;
    });
  };

  // Restore previously removed item back to scenario
  const handleRestoreItem = (item: ProposedMedicationItem) => {
    setProposedItems((prev) => {
      const next = prev.map((p) =>
        p.id === item.id
          ? {
              ...p,
              simulationAction: 'ORIGINAL' as const,
              modificationSummary: undefined,
            }
          : p
      );
      recalculateSimulation(next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 py-16 px-4 bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Initializing What-If Prescription Simulator sandbox...
          </p>
        </div>
      </div>
    );
  }

  const activeProposed = proposedItems.filter((i) => i.simulationAction !== 'REMOVED');
  const removedProposed = proposedItems.filter((i) => i.simulationAction === 'REMOVED');

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/patient/twin')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Medication Twin</span>
          </button>

          <button
            onClick={() => navigate('/patient/twin')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            <Dna className="w-4 h-4" />
            <span>Live Regimen: {currentMeds.length} Active Medications</span>
          </button>
        </div>

        {/* PROMINENT MANDATORY CLINICAL ADVISORY (Required by Section 4) */}
        <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 flex items-start space-x-3 text-xs leading-relaxed shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-amber-950 text-sm uppercase tracking-wide">
              Important Informational Notice
            </h4>
            <p className="font-semibold text-amber-900">
              This simulator is for informational comparison only. It does not recommend starting, stopping, or changing medication. Discuss any proposed medication change with the prescribing doctor or pharmacist.
            </p>
            <p className="text-amber-800 text-[11px]">
              All changes in this simulator are temporary in-memory drafts. Your real Medication Twin is NOT modified.
            </p>
          </div>
        </div>

        {/* Header with Scenario Controls */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Phase 5 • What-If Prescription Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Prescription Sandbox &amp; Interaction Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Model temporary medication adjustments, simulate adding a new prescription drug, or test removing a therapy to evaluate potential safety differences against verified pharmacology rules.
            </p>
          </div>

          {/* Scenario Action Controls (Required by Section 5) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="sim-run-btn"
              onClick={handleRunSimulation}
              disabled={simulating}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Evaluating...' : 'Run Simulation'}</span>
            </button>

            <button
              id="sim-reset-btn"
              onClick={handleResetScenario}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Scenario</span>
            </button>

            <button
              id="sim-add-med-btn"
              onClick={handleAddMedication}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Add Proposed Drug</span>
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {noticeMessage && (
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* SECTION 2: COMPARISON SUMMARY CARDS */}
        {simulationResult && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Medications Added
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                +{simulationResult.comparisonSummary.medicationsAddedCount}
              </span>
              <span className="text-[10px] text-slate-500">Proposed new items</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Medications Removed
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                -{simulationResult.comparisonSummary.medicationsRemovedCount}
              </span>
              <span className="text-[10px] text-slate-500">Simulated exclusions</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Details Changed
              </span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                {simulationResult.comparisonSummary.medicationsChangedCount}
              </span>
              <span className="text-[10px] text-slate-500">Dose/frequency edits</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Verified Issues
              </span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {simulationResult.comparisonSummary.checksCompletedCount}
              </span>
              <span className="text-[10px] text-slate-500">In proposed regimen</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Unable to Verify
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {simulationResult.comparisonSummary.checksUnableToVerifyCount}
              </span>
              <span className="text-[10px] text-slate-500">Missing parameters</span>
            </div>
          </div>
        )}

        {/* SECTION 2: SIDE-BY-SIDE LISTS (Current vs Proposed Scenario) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMN 1: Current Medication Twin */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Dna className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Current Medication Twin ({currentMeds.length})
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                Active Regimen
              </span>
            </div>

            {/* Profile Context summary */}
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Patient Demographics:</span>
                <strong>{patientProfile?.age} yo {patientProfile?.gender}</strong>
              </div>
              <div className="flex justify-between">
                <span>Recorded Allergies:</span>
                <strong>{patientProfile?.allergies?.length || 0} documented</strong>
              </div>
              <div className="flex justify-between">
                <span>Chronic Conditions:</span>
                <strong>{patientProfile?.chronicConditions?.length || 0} documented</strong>
              </div>
            </div>

            {/* Current Meds List */}
            <div className="space-y-2.5">
              {currentMeds.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No active medications currently registered in Medication Twin.
                </div>
              ) : (
                currentMeds.map((med) => (
                  <div
                    key={med.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        <span>{med.name}</span>
                        {med.strength && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            • {med.strength}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {med.dosage} • {med.frequency} • {med.route}
                      </div>
                      {med.purpose && (
                        <div className="text-[10px] text-teal-700 italic">
                          Indication: {med.purpose}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {med.id.slice(-6)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: Proposed Scenario (Interactive) */}
          <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Proposed Scenario ({activeProposed.length} Active)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                Temporary Draft
              </span>
            </div>

            {/* Active Proposed Meds List */}
            <div className="space-y-2.5">
              {activeProposed.length === 0 ? (
                <div className="p-6 text-center text-xs text-purple-400 italic">
                  All medications removed from proposed scenario. Click &quot;Add Proposed Drug&quot; or &quot;Reset Scenario&quot;.
                </div>
              ) : (
                activeProposed.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border text-xs transition-all space-y-2 ${
                      item.simulationAction === 'ADDED'
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : item.simulationAction === 'MODIFIED'
                        ? 'bg-purple-50/70 border-purple-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                          <Pill className="w-3.5 h-3.5 text-purple-600" />
                          <span>{item.name}</span>
                          {item.strength && (
                            <span className="text-[11px] font-semibold text-slate-600">
                              • {item.strength}
                            </span>
                          )}
                          {item.simulationAction === 'ADDED' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                              Proposed Add
                            </span>
                          )}
                          {item.simulationAction === 'MODIFIED' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-900 uppercase">
                              Modified
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {item.dosage} • {item.frequency} • {item.route}
                        </div>
                        {item.modificationSummary && (
                          <div className="text-[10px] text-purple-700 font-semibold">
                            Diff: {item.modificationSummary}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleEditItem(item)}
                          title="Edit dose or frequency"
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          title="Simulate removing medication"
                          className="w-7 h-7 rounded-lg bg-white hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Removed items in proposed scenario */}
              {removedProposed.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Simulated Removals ({removedProposed.length})
                  </span>
                  {removedProposed.map((remItem) => (
                    <div
                      key={remItem.id}
                      className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between text-xs text-rose-900"
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="line-through font-semibold">{remItem.name}</span>
                        <span className="text-[10px] text-rose-700">({remItem.strength})</span>
                      </div>
                      <button
                        onClick={() => handleRestoreItem(remItem)}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                      >
                        Restore to Scenario
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: SAFETY ANALYSIS FINDING DIFFS */}
        {simulationResult && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Simulation Safety Comparison</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Safety Differences &amp; Risk Dynamics
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Comparing potential verified interactions and contraindications between your active Medication Twin and the proposed temporary scenario.
              </p>
            </div>

            {/* 1. ISSUES PRESENT IN BOTH REGIMENS (PERSISTING FINDINGS) */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Issues Present in Both Regimens ({simulationResult.findingDiff.persistingFindings.length})
                </h3>
              </div>

              {simulationResult.findingDiff.persistingFindings.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                  No issues are shared between the active Medication Twin and the proposed scenario.
                </div>
              ) : (
                <div className="space-y-3">
                  {simulationResult.findingDiff.persistingFindings.map((persisting) => (
                    <div
                      key={persisting.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-2 text-xs text-slate-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{persisting.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                          Present in Both Lists
                        </span>
                      </div>
                      <p className="text-slate-700">{persisting.explanation}</p>
                      <div className="text-[11px] text-slate-600">
                        <strong>Clinical Significance:</strong> {persisting.clinicalSignificance}
                      </div>
                      <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: {persisting.sourceReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. NEWLY IDENTIFIED FINDINGS IN PROPOSED SCENARIO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Newly Identified Potential Issues in Proposed Scenario ({simulationResult.findingDiff.newFindings.length})
                </h3>
              </div>

              {simulationResult.findingDiff.newFindings.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                  No new potential interactions or allergy alerts were triggered by this proposed scenario.
                </div>
              ) : (
                <div className="space-y-3">
                  {simulationResult.findingDiff.newFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-4 bg-rose-50/80 rounded-xl border border-rose-300 space-y-2 text-xs text-rose-950"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 text-sm">{finding.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 uppercase">
                          New Alert in Scenario
                        </span>
                      </div>
                      <p className="text-rose-900">{finding.explanation}</p>
                      <div className="text-[11px] text-rose-800">
                        <strong>Clinical Significance:</strong> {finding.clinicalSignificance}
                      </div>
                      <div className="text-[10px] text-slate-500 italic pt-1 border-t border-rose-200 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: {finding.sourceReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. FINDINGS RESOLVED / NO LONGER PRESENT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Findings No Longer Present in Proposed Scenario ({simulationResult.findingDiff.resolvedFindings.length})
                </h3>
              </div>

              {simulationResult.findingDiff.resolvedFindings.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                  None of the original Medication Twin issues were removed by the proposed changes.
                </div>
              ) : (
                <div className="space-y-3">
                  {simulationResult.findingDiff.resolvedFindings.map((resolved) => (
                    <div
                      key={resolved.id}
                      className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-2 text-xs text-emerald-950"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 text-sm">{resolved.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                          Resolved in Scenario
                        </span>
                      </div>
                      <p className="text-emerald-900">
                        Removing or altering the involved medication(s) in this scenario eliminates this specific warning.
                      </p>
                      <div className="text-[10px] text-slate-500 italic pt-1 border-t border-emerald-200 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>Source: {resolved.sourceReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. CHECKS UNABLE TO VERIFY */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Checks Requiring Additional Information ({simulationResult.findingDiff.unverifiedChecks.length})
                </h3>
              </div>

              {simulationResult.findingDiff.unverifiedChecks.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                  All safety evaluations in this scenario were verified by published reference data.
                </div>
              ) : (
                simulationResult.findingDiff.unverifiedChecks.map((unv) => (
                  <div
                    key={unv.id}
                    className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5 text-xs text-amber-950"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">{unv.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900 uppercase">
                        Unable to Verify
                      </span>
                    </div>
                    <p className="text-amber-900">{unv.explanation}</p>
                    {unv.missingInformation && (
                      <div className="text-[11px] text-amber-800">
                        <strong>Missing Information:</strong> {unv.missingInformation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Safety Score Comparison */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Prototype Safety Indicator Comparison
                </span>
                <p className="text-xs text-slate-600 mt-1">
                  Current Twin Score:{' '}
                  <strong>
                    {simulationResult.currentReport.scoreBreakdown.isCalculable
                      ? `${simulationResult.currentReport.scoreBreakdown.score}/100`
                      : 'Score unavailable'}
                  </strong>{' '}
                  → Proposed Scenario Score:{' '}
                  <strong className="text-purple-700">
                    {simulationResult.proposedReport.scoreBreakdown.isCalculable
                      ? `${simulationResult.proposedReport.scoreBreakdown.score}/100`
                      : 'Score unavailable'}
                  </strong>
                </p>
                {simulationResult.currentReport.scoreBreakdown.isCalculable &&
                  simulationResult.proposedReport.scoreBreakdown.isCalculable && (
                    <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500">
                      Score dynamics:{' '}
                      {(simulationResult.proposedReport.scoreBreakdown.score || 0) >
                      (simulationResult.currentReport.scoreBreakdown.score || 0)
                        ? `+${(simulationResult.proposedReport.scoreBreakdown.score || 0) - (simulationResult.currentReport.scoreBreakdown.score || 0)} pts in prototype indicator`
                        : (simulationResult.proposedReport.scoreBreakdown.score || 0) <
                          (simulationResult.currentReport.scoreBreakdown.score || 0)
                        ? `${(simulationResult.proposedReport.scoreBreakdown.score || 0) - (simulationResult.currentReport.scoreBreakdown.score || 0)} pts in prototype indicator`
                        : 'No score difference calculated'}
                    </span>
                  )}
              </div>
              <div className="text-[11px] text-slate-400 italic max-w-sm">
                Prototype indicator only. Differences in findings or scores do NOT constitute medical advice.
              </div>
            </div>
          </div>
        )}

        {/* Modal for adding/editing proposed scenario item */}
        <SimulatorMedicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patientId={user?.id || ''}
          itemToEdit={editingItem}
          onApply={handleApplyItem}
        />
      </div>
    </div>
  );
};

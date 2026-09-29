/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRouter } from '../services/router';
import { authorizationService } from '../services/authorizationService';
import { medicationService } from '../services/medicationService';
import { prescriptionSimulatorService } from '../services/prescriptionSimulatorService';
import { PatientProfile, DoctorPatientRelationship, Medication } from '../models/types';
import { ProposedMedicationItem, SimulationResult } from '../models/simulatorTypes';
import { SimulatorMedicationModal } from '../components/simulator/SimulatorMedicationModal';
import {
  Sliders,
  ArrowLeft,
  Users,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  ShieldAlert,
  AlertTriangle,
  Pill,
  BookOpen,
  CheckCircle2,
  XCircle,
  Dna,
} from 'lucide-react';

export const DoctorSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const { getParam, navigate } = useRouter();

  const [authorizedPatients, setAuthorizedPatients] = useState<{
    relationship: DoctorPatientRelationship;
    profile: PatientProfile;
  }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);

  const [currentMeds, setCurrentMeds] = useState<Medication[]>([]);
  const [proposedItems, setProposedItems] = useState<ProposedMedicationItem[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProposedMedicationItem | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const initialPatientId = getParam('patientId');

  useEffect(() => {
    if (!user) return;
    const loadAuthorizedPatients = async () => {
      setLoading(true);
      try {
        const patients = await authorizationService.getAuthorizedPatientsForDoctor(user.id);
        setAuthorizedPatients(patients);

        if (initialPatientId && patients.some((p) => p.profile.userId === initialPatientId)) {
          setSelectedPatientId(initialPatientId);
        } else if (patients.length > 0) {
          setSelectedPatientId(patients[0].profile.userId);
        }
      } catch (err) {
        console.error('Error fetching authorized patients:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuthorizedPatients();
  }, [user, initialPatientId]);

  const loadPatientScenario = useCallback(async () => {
    if (!user || !selectedPatientId) return;

    try {
      const isAuth = await authorizationService.canDoctorAccessPatient(user.id, selectedPatientId);
      if (!isAuth) return;

      const found = authorizedPatients.find((p) => p.profile.userId === selectedPatientId);
      if (found) {
        setSelectedPatientProfile(found.profile);
      }

      const active = await medicationService.getActiveMedications(selectedPatientId);
      setCurrentMeds(active);
      const initialProposed = prescriptionSimulatorService.createInitialProposedScenario(active);
      setProposedItems(initialProposed);

      if (found?.profile) {
        const simRes = prescriptionSimulatorService.runSimulation(
          found.profile,
          active,
          initialProposed
        );
        setSimulationResult(simRes);
      }
    } catch (err) {
      console.error('Failed to load patient medications for doctor simulator:', err);
    }
  }, [user, selectedPatientId, authorizedPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientScenario();
    }
  }, [selectedPatientId, loadPatientScenario]);

  // Helper to re-evaluate simulation with new proposed items
  const recalculateSimulation = (newProposed: ProposedMedicationItem[]) => {
    if (!selectedPatientProfile) return;
    const result = prescriptionSimulatorService.runSimulation(
      selectedPatientProfile,
      currentMeds,
      newProposed
    );
    setSimulationResult(result);
  };

  const handleRunSimulation = () => {
    if (!selectedPatientProfile) return;
    setSimulating(true);
    try {
      const result = prescriptionSimulatorService.runSimulation(
        selectedPatientProfile,
        currentMeds,
        proposedItems
      );
      setSimulationResult(result);
      setNoticeMessage('Simulation completed using Phase 4 verified clinical pharmacology rules.');
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetScenario = () => {
    const initialProposed = prescriptionSimulatorService.createInitialProposedScenario(currentMeds);
    setProposedItems(initialProposed);
    if (selectedPatientProfile) {
      const resetResult = prescriptionSimulatorService.runSimulation(
        selectedPatientProfile,
        currentMeds,
        initialProposed
      );
      setSimulationResult(resetResult);
    }
    setNoticeMessage('Proposed scenario reset to mirror patient active Medication Twin.');
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleAddMedication = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ProposedMedicationItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

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

  const handleRemoveItem = (item: ProposedMedicationItem) => {
    setProposedItems((prev) => {
      let next: ProposedMedicationItem[];
      if (item.simulationAction === 'ADDED') {
        next = prev.filter((p) => p.id !== item.id);
      } else {
        next = prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                simulationAction: 'REMOVED' as const,
                modificationSummary: 'Simulated discontinuation in scenario',
              }
            : p
        );
      }
      recalculateSimulation(next);
      return next;
    });
  };

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
            Checking clinical authorization permissions...
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
        
        {/* Navigation & Patient Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Doctor Dashboard</span>
          </button>

          {authorizedPatients.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Authorized Patient:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-teal-600 cursor-pointer"
              >
                {authorizedPatients.map((p) => (
                  <option key={p.profile.userId} value={p.profile.userId}>
                    {p.profile.fullName} (Age: {p.profile.age} • {p.relationship.patientConnectionCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CLINICAL DECISION SUPPORT NOTICE */}
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-950 flex items-start space-x-3 text-xs leading-relaxed shadow-xs">
          <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-indigo-950 text-sm">
              Clinical Pharmacotherapy Simulator (Doctor / Prescriber View)
            </h4>
            <p>
              This simulator assists prescribers and clinical pharmacists in modeling regimen adjustments, anticholinergic loads, and dual therapeutic classes before issuing official orders.
              All proposed changes are strictly temporary in-memory drafts and do not alter the patient&apos;s legal medical record.
            </p>
          </div>
        </div>

        {/* Header with Scenario Controls */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Phase 5 • Clinical Pharmacotherapy Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Regimen Modeling Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Model dose modifications, drug additions, or therapeutic substitutions for {selectedPatientProfile?.fullName || 'authorized patient'} against verified pharmacological databases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Evaluating...' : 'Run Simulation'}</span>
            </button>

            <button
              onClick={handleResetScenario}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Scenario</span>
            </button>

            <button
              onClick={handleAddMedication}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Add Proposed Drug</span>
            </button>
          </div>
        </div>

        {/* Notice Message */}
        {noticeMessage && (
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Side-by-Side Current vs Proposed List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Dna className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Baseline Medication Twin ({currentMeds.length})
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                Active Regimen
              </span>
            </div>

            <div className="space-y-2.5">
              {currentMeds.map((med) => (
                <div key={med.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>{med.name}</span>
                    {med.strength && <span className="text-slate-500 font-semibold">• {med.strength}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {med.dosage} • {med.frequency} • {med.route}
                  </div>
                </div>
              ))}
            </div>
          </div>

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

            <div className="space-y-2.5">
              {activeProposed.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all space-y-1 ${
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
                        {item.strength && <span className="text-slate-600 font-semibold">• {item.strength}</span>}
                        {item.simulationAction === 'ADDED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                            Added
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

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-slate-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {removedProposed.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Simulated Discontinuations ({removedProposed.length})
                  </span>
                  {removedProposed.map((remItem) => (
                    <div
                      key={remItem.id}
                      className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between text-xs text-rose-900"
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="line-through font-semibold">{remItem.name}</span>
                      </div>
                      <button
                        onClick={() => handleRestoreItem(remItem)}
                        className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety Diff Section */}
        {simulationResult && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900">
                Safety Differences &amp; Findings Comparison
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Clinical comparison between active Medication Twin and proposed sandbox regimen.
              </p>
            </div>

            {/* 1. Persisting issues */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs block uppercase">
                Issues Present in Both Regimens ({simulationResult.findingDiff.persistingFindings.length})
              </span>
              {simulationResult.findingDiff.persistingFindings.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No shared issues between current and proposed lists.</p>
              ) : (
                simulationResult.findingDiff.persistingFindings.map((f) => (
                  <div key={f.id} className="text-xs text-slate-800 border-b border-slate-200 pb-1.5 last:border-0">
                    <strong>• {f.title}</strong>
                    <p className="text-[11px] text-slate-600">{f.explanation}</p>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
                <span className="font-bold text-rose-950 text-xs block uppercase">
                  Newly Identified in Proposed ({simulationResult.findingDiff.newFindings.length})
                </span>
                {simulationResult.findingDiff.newFindings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No new issues triggered.</p>
                ) : (
                  simulationResult.findingDiff.newFindings.map((f) => (
                    <div key={f.id} className="text-xs text-rose-900 border-b border-rose-100 pb-1.5 last:border-0">
                      <strong>• {f.title}</strong>
                      <p className="text-[11px] text-rose-800">{f.explanation}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 text-xs block uppercase">
                  Resolved in Proposed ({simulationResult.findingDiff.resolvedFindings.length})
                </span>
                {simulationResult.findingDiff.resolvedFindings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No existing alerts resolved.</p>
                ) : (
                  simulationResult.findingDiff.resolvedFindings.map((f) => (
                    <div key={f.id} className="text-xs text-emerald-900 border-b border-emerald-100 pb-1.5 last:border-0">
                      <strong>• {f.title}</strong>
                      <p className="text-[11px] text-emerald-800">{f.explanation}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checks unable to verify */}
            {simulationResult.findingDiff.unverifiedChecks.length > 0 && (
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-950 text-xs block uppercase">
                  Checks Requiring Additional Information ({simulationResult.findingDiff.unverifiedChecks.length})
                </span>
                {simulationResult.findingDiff.unverifiedChecks.map((unv) => (
                  <div key={unv.id} className="text-xs text-amber-900 border-b border-amber-100 pb-1.5 last:border-0">
                    <strong>• {unv.title}</strong>
                    <p className="text-[11px] text-amber-800">{unv.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prototype Indicator Score Comparison */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Prototype Safety Indicator Comparison
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
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
              </div>
              <div className="text-[11px] text-slate-400 italic max-w-sm">
                Prototype indicator only. Differences in findings or scores do NOT constitute clinical advice.
              </div>
            </div>
          </div>
        )}

        <SimulatorMedicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patientId={selectedPatientId}
          itemToEdit={editingItem}
          onApply={handleApplyItem}
        />
      </div>
    </div>
  );
};

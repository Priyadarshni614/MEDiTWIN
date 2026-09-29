/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, PatientProfile } from '../models/types';
import {
  ProposedMedicationItem,
  SimulationResult,
  ScenarioComparisonSummary,
  SafetyFindingDiff,
} from '../models/simulatorTypes';
import { medicationSafetyEngine } from './medicationSafetyEngine';
import { MedicationSafetyReport, MedicationSafetyFinding } from '../models/safetyTypes';

export class PrescriptionSimulatorService {
  /**
   * Run simulation comparing the patient's current active Medication Twin with a temporary proposed regimen.
   * Reuses the Phase 4 MedicationSafetyEngine and computes transparent diffs.
   *
   * GUARANTEE: This is purely in-memory computation. It DOES NOT mutate storage or alter the real Medication Twin.
   */
  runSimulation(
    patient: PatientProfile,
    currentMedications: Medication[],
    proposedItems: ProposedMedicationItem[]
  ): SimulationResult {
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const simulatedAt = new Date().toISOString();

    // 1. Analyze CURRENT Medication Twin with Phase 4 Engine
    const currentReport: MedicationSafetyReport = medicationSafetyEngine.analyze(
      patient,
      currentMedications
    );

    // 2. Filter proposed scenario to ACTIVE items (excluding simulated REMOVED items)
    const proposedActiveMeds: Medication[] = proposedItems
      .filter((item) => item.simulationAction !== 'REMOVED' && item.active !== false)
      .map((item) => ({
        id: item.id,
        patientId: item.patientId,
        name: item.name,
        genericName: item.genericName,
        brandName: item.brandName,
        strength: item.strength,
        dosage: item.dosage,
        dosageUnit: item.dosageUnit,
        frequency: item.frequency,
        route: item.route,
        duration: item.duration,
        startDate: item.startDate,
        endDate: item.endDate,
        purpose: item.purpose,
        prescribedBy: item.prescribedBy,
        prescriptionId: item.prescriptionId,
        source: item.source,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        active: true,
      }));

    // 3. Analyze PROPOSED Scenario with the same Phase 4 Engine
    const proposedReport: MedicationSafetyReport = medicationSafetyEngine.analyze(
      patient,
      proposedActiveMeds
    );

    // 4. Compute Scenario Comparison Summary
    const addedCount = proposedItems.filter((i) => i.simulationAction === 'ADDED').length;
    const removedCount = proposedItems.filter((i) => i.simulationAction === 'REMOVED').length;
    const changedCount = proposedItems.filter((i) => i.simulationAction === 'MODIFIED').length;

    const comparisonSummary: ScenarioComparisonSummary = {
      medicationsAddedCount: addedCount,
      medicationsRemovedCount: removedCount,
      medicationsChangedCount: changedCount,
      checksCompletedCount: proposedReport.summary.potentialIssuesCount,
      checksUnableToVerifyCount: proposedReport.summary.unverifiedChecksCount,
    };

    // 5. Compute Safety Finding Diffs between Current and Proposed using stable canonical comparison keys
    const getComparisonKey = (finding: MedicationSafetyFinding): string => {
      if (finding.comparisonKey) return finding.comparisonKey;
      return finding.id;
    };

    const currentVerifiedMap = new Map<string, MedicationSafetyFinding>();
    currentReport.findings
      .filter((f) => f.verificationState === 'VERIFIED')
      .forEach((f) => currentVerifiedMap.set(getComparisonKey(f), f));

    const proposedVerified = proposedReport.findings.filter(
      (f) => f.verificationState === 'VERIFIED'
    );
    const proposedVerifiedMap = new Map<string, MedicationSafetyFinding>();
    proposedVerified.forEach((f) => proposedVerifiedMap.set(getComparisonKey(f), f));

    // Newly identified in proposed
    const newFindings: MedicationSafetyFinding[] = proposedVerified.filter(
      (f) => !currentVerifiedMap.has(getComparisonKey(f))
    );

    // Resolved in proposed (existed in current, now gone)
    const resolvedFindings: MedicationSafetyFinding[] = currentReport.findings
      .filter((f) => f.verificationState === 'VERIFIED')
      .filter((f) => !proposedVerifiedMap.has(getComparisonKey(f)));

    // Persisting in both (remains present in proposed scenario)
    const persistingFindings: MedicationSafetyFinding[] = proposedVerified.filter((f) =>
      currentVerifiedMap.has(getComparisonKey(f))
    );

    // Checks unable to verify in proposed
    const unverifiedChecks: MedicationSafetyFinding[] = proposedReport.findings.filter(
      (f) => f.verificationState === 'UNABLE_TO_VERIFY'
    );

    const findingDiff: SafetyFindingDiff = {
      newFindings,
      resolvedFindings,
      persistingFindings,
      unverifiedChecks,
    };

    return {
      simulationId,
      patientId: patient.userId,
      simulatedAt,
      currentRegimen: currentMedications,
      proposedRegimen: proposedItems,
      comparisonSummary,
      currentReport,
      proposedReport,
      findingDiff,
      patientContext: {
        age: patient.age,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
      },
    };
  }

  /**
   * Initializes a temporary proposed scenario cloned from current active medications.
   */
  createInitialProposedScenario(currentMeds: Medication[]): ProposedMedicationItem[] {
    return currentMeds.map((med) => ({
      ...med,
      simulationAction: 'ORIGINAL',
      originalMedicationId: med.id,
    }));
  }
}

export const prescriptionSimulatorService = new PrescriptionSimulatorService();

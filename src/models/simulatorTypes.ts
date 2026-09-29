/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, PatientProfile } from './types';
import {
  MedicationSafetyReport,
  MedicationSafetyFinding,
} from './safetyTypes';

export type ProposedMedicationAction = 'ORIGINAL' | 'ADDED' | 'MODIFIED' | 'REMOVED';

export interface ProposedMedicationItem extends Medication {
  simulationAction: ProposedMedicationAction;
  originalMedicationId?: string; // Points to real medication in twin if modified or original
  modificationSummary?: string;   // e.g. "Strength changed from 500 mg to 1000 mg"
}

export interface ScenarioComparisonSummary {
  medicationsAddedCount: number;
  medicationsRemovedCount: number;
  medicationsChangedCount: number;
  checksCompletedCount: number;
  checksUnableToVerifyCount: number;
}

export interface SafetyFindingDiff {
  newFindings: MedicationSafetyFinding[];       // Newly triggered in proposed scenario
  resolvedFindings: MedicationSafetyFinding[];  // Existed in current twin, resolved in proposed
  persistingFindings: MedicationSafetyFinding[];// Exists in both current and proposed
  unverifiedChecks: MedicationSafetyFinding[];  // Unable to verify in proposed
}

export interface SimulationResult {
  simulationId: string;
  patientId: string;
  simulatedAt: string;
  currentRegimen: Medication[];
  proposedRegimen: ProposedMedicationItem[];
  comparisonSummary: ScenarioComparisonSummary;
  currentReport: MedicationSafetyReport;
  proposedReport: MedicationSafetyReport;
  findingDiff: SafetyFindingDiff;
  patientContext: {
    age: number;
    allergies: string[];
    chronicConditions: string[];
  };
}

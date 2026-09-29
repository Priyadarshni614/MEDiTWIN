/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prescriptionSimulatorService } from './prescriptionSimulatorService';
import { Medication, PatientProfile } from '../models/types';
import { ProposedMedicationItem } from '../models/simulatorTypes';

/**
 * Phase 5 Verification Test:
 * Tests the exact scenario reported by the user:
 * Current Medication Twin:
 * - Two Amoxicillin + Clavulanic acid entries
 * - Two paracetamol/acetaminophen entries
 * - One recorded penicillin allergy
 *
 * Proposed Scenario:
 * - One Amoxicillin + Clavulanic acid entry (one entry removed)
 * - Two paracetamol/acetaminophen entries
 * - Same patient profile and allergy
 *
 * Verifies:
 * 1. Current has 3 verified findings (score 25/100)
 * 2. Proposed has 2 verified findings (score 45/100)
 * 3. The penicillin allergy finding remains (in persisting findings)
 * 4. The duplicate amoxicillin finding is no longer present (in resolved findings)
 * 5. The duplicate paracetamol finding remains (in persisting findings)
 * 6. Current Medication Twin remains completely unchanged (immutability)
 */
export function runPrescriptionSimulatorTests(): { success: boolean; details: Record<string, unknown> } {
  const patient: PatientProfile = {
    userId: 'test_patient_simulator',
    fullName: 'Angelin Steve',
    age: 42,
    gender: 'female',
    pregnancyStatus: 'not-applicable',
    allergies: ['Penicillin (Moderate rash)'],
    chronicConditions: ['Type 2 Diabetes'],
    emergencyContact: {
      name: 'John Steve',
      relationship: 'Spouse',
      phone: '555-0199',
    },
    connectionCode: 'PT-TEST-1234',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const currentMeds: Medication[] = [
    {
      id: 'med_amox_entry_1',
      patientId: 'test_patient_simulator',
      name: 'Amoxicillin and Clavulanate Potassium Tablets',
      genericName: 'Amoxicillin and Clavulanate Potassium',
      dosage: '1 tablet',
      strength: '875mg / 125mg',
      frequency: 'Every 12 hours',
      route: 'Oral',
      source: 'MANUAL',
      active: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'med_amox_entry_2',
      patientId: 'test_patient_simulator',
      name: 'Amoxicillin + Clavulanic acid',
      genericName: 'Amoxicillin and Clavulanate Potassium',
      dosage: '1 tablet',
      strength: '875mg / 125mg',
      frequency: 'Twice daily',
      route: 'Oral',
      source: 'MANUAL',
      active: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'med_para_entry_1',
      patientId: 'test_patient_simulator',
      name: 'Paracetamol Tablets',
      genericName: 'Acetaminophen',
      dosage: '1 tablet',
      strength: '500mg',
      frequency: 'Every 6 hours as needed',
      route: 'Oral',
      source: 'MANUAL',
      active: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'med_para_entry_2',
      patientId: 'test_patient_simulator',
      name: 'Tylenol Extra Strength',
      genericName: 'Acetaminophen',
      dosage: '1 caplet',
      strength: '500mg',
      frequency: 'As needed for fever',
      route: 'Oral',
      source: 'MANUAL',
      active: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  // 1. Initial simulation with identical proposed list
  const initialProposed: ProposedMedicationItem[] =
    prescriptionSimulatorService.createInitialProposedScenario(currentMeds);

  const initialSim = prescriptionSimulatorService.runSimulation(
    patient,
    currentMeds,
    initialProposed
  );

  // Assert current baseline
  const currentVerifiedFindings = initialSim.currentReport.findings.filter(
    (f) => f.verificationState === 'VERIFIED'
  );
  if (currentVerifiedFindings.length !== 3) {
    throw new Error(
      `Expected 3 verified findings in current baseline, got ${currentVerifiedFindings.length}`
    );
  }
  if (initialSim.currentReport.scoreBreakdown.score !== 25) {
    throw new Error(
      `Expected baseline score of 25, got ${initialSim.currentReport.scoreBreakdown.score}`
    );
  }

  // 2. Simulate removing one Amoxicillin entry from proposed scenario
  const modifiedProposed: ProposedMedicationItem[] = initialProposed.map((item) => {
    if (item.id === 'med_amox_entry_2') {
      return {
        ...item,
        simulationAction: 'REMOVED' as const,
        modificationSummary: 'Simulated removal of duplicate amoxicillin order',
      };
    }
    return item;
  });

  const modifiedSim = prescriptionSimulatorService.runSimulation(
    patient,
    currentMeds,
    modifiedProposed
  );

  // Proposed list must have 3 active meds (1 amoxicillin, 2 paracetamols)
  const proposedActiveCount = modifiedProposed.filter((i) => i.simulationAction !== 'REMOVED').length;
  if (proposedActiveCount !== 3) {
    throw new Error(`Expected 3 proposed active items, got ${proposedActiveCount}`);
  }

  // Proposed report must have 2 verified findings
  const proposedVerifiedFindings = modifiedSim.proposedReport.findings.filter(
    (f) => f.verificationState === 'VERIFIED'
  );
  if (proposedVerifiedFindings.length !== 2) {
    throw new Error(
      `Expected 2 verified findings in proposed scenario, got ${proposedVerifiedFindings.length}`
    );
  }

  // Proposed score must recalculate to 45 (100 - 35 allergy - 20 duplicate paracetamol = 45)
  if (modifiedSim.proposedReport.scoreBreakdown.score !== 45) {
    throw new Error(
      `Expected proposed score of 45, got ${modifiedSim.proposedReport.scoreBreakdown.score}`
    );
  }

  // Diffs: Exactly 1 resolved finding (duplicate amoxicillin)
  if (modifiedSim.findingDiff.resolvedFindings.length !== 1) {
    throw new Error(
      `Expected 1 resolved finding, got ${modifiedSim.findingDiff.resolvedFindings.length}`
    );
  }
  const resolvedFinding = modifiedSim.findingDiff.resolvedFindings[0];
  if (resolvedFinding.category !== 'DUPLICATE_THERAPY') {
    throw new Error(
      `Expected resolved finding to be DUPLICATE_THERAPY, got ${resolvedFinding.category}`
    );
  }

  // Diffs: Exactly 2 persisting findings (penicillin allergy and duplicate paracetamol)
  if (modifiedSim.findingDiff.persistingFindings.length !== 2) {
    throw new Error(
      `Expected 2 persisting findings, got ${modifiedSim.findingDiff.persistingFindings.length}`
    );
  }
  const persistingCategories = modifiedSim.findingDiff.persistingFindings.map((f) => f.category);
  if (!persistingCategories.includes('ALLERGY_CONTRAINDICATION')) {
    throw new Error('Expected penicillin allergy finding to remain in persisting findings');
  }
  if (!persistingCategories.includes('DUPLICATE_THERAPY')) {
    throw new Error('Expected duplicate paracetamol finding to remain in persisting findings');
  }

  // Immutability: Current report findings and score remain completely unchanged
  if (modifiedSim.currentReport.findings.filter((f) => f.verificationState === 'VERIFIED').length !== 3) {
    throw new Error('Immutability check failed: Current report findings changed after proposed removal');
  }
  if (modifiedSim.currentReport.scoreBreakdown.score !== 25) {
    throw new Error('Immutability check failed: Current report score changed after proposed removal');
  }
  if (currentMeds.length !== 4) {
    throw new Error('Immutability check failed: Current meds array length mutated');
  }

  return {
    success: true,
    details: {
      currentVerifiedCount: currentVerifiedFindings.length,
      currentScore: initialSim.currentReport.scoreBreakdown.score,
      proposedVerifiedCount: proposedVerifiedFindings.length,
      proposedScore: modifiedSim.proposedReport.scoreBreakdown.score,
      resolvedFindings: modifiedSim.findingDiff.resolvedFindings.map((f) => f.title),
      persistingFindings: modifiedSim.findingDiff.persistingFindings.map((f) => f.title),
      immutabilityConfirmed: true,
    },
  };
}

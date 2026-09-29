/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, MedicationTwin, PatientProfile } from '../models/types';
import { dataService } from './localStorageDataService';
import { authorizationService } from './authorizationService';

export interface AddMedicationInput {
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  route: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  purpose?: string;
  prescribedBy?: string;
  prescriptionId?: string;
  source?: 'MANUAL' | 'PRESCRIPTION_OCR';
}

/**
 * Placeholder interface for Phase 4 Medication Risk Engine.
 */
export interface MedicationSafetyAnalysisResult {
  patientId: string;
  analyzedAt: string;
  status: 'PENDING_STAGE_4_ANALYSIS';
  message: string;
}

export class MedicationService {
  /**
   * Get all active medications for a patient.
   */
  async getActiveMedications(patientId: string): Promise<Medication[]> {
    if (!patientId) return [];
    return dataService.getActiveMedicationsByPatient(patientId);
  }

  /**
   * Get historical / discontinued medications for a patient.
   */
  async getMedicationHistory(patientId: string): Promise<Medication[]> {
    if (!patientId) return [];
    return dataService.getMedicationHistoryByPatient(patientId);
  }

  /**
   * Get full Medication Twin representation for a patient.
   */
  async getMedicationTwin(patientId: string): Promise<MedicationTwin> {
    const active = await dataService.getActiveMedicationsByPatient(patientId);
    const history = await dataService.getMedicationHistoryByPatient(patientId);
    const prescriptions = await dataService.getPrescriptionsByPatient(patientId);

    return {
      patientId,
      generatedAt: new Date().toISOString(),
      totalActiveMedications: active.length,
      totalHistoricalMedications: history.length,
      totalPrescriptions: prescriptions.length,
      activeMedications: active,
      medicationHistory: history,
      prescriptions,
    };
  }

  /**
   * Add a new medication manually for a patient.
   * Validates required fields: name, dosage, frequency.
   */
  async addMedication(patientId: string, input: AddMedicationInput): Promise<Medication> {
    if (!patientId) throw new Error('Patient ID is required');

    // Field validation
    const name = input.name?.trim();
    if (!name) throw new Error('Medication name is required');

    const dosage = input.dosage?.trim();
    if (!dosage) throw new Error('Dosage is required (e.g. 1 tablet)');

    const frequency = input.frequency?.trim();
    if (!frequency) throw new Error('Frequency is required (e.g. Twice daily)');

    const strength = input.strength?.trim() || '';
    const route = input.route?.trim() || 'Oral';
    const now = new Date().toISOString();
    const startDate = input.startDate || now.split('T')[0];

    const newMed = await dataService.createMedication({
      patientId,
      name,
      genericName: input.genericName?.trim() || undefined,
      brandName: input.brandName?.trim() || undefined,
      strength,
      dosage,
      dosageUnit: input.dosageUnit?.trim() || undefined,
      frequency,
      route,
      duration: input.duration?.trim() || 'Ongoing',
      startDate,
      endDate: input.endDate?.trim() || undefined,
      purpose: input.purpose?.trim() || undefined,
      prescribedBy: input.prescribedBy?.trim() || undefined,
      prescriptionId: input.prescriptionId,
      source: input.source || 'MANUAL',
      active: true,
    });

    return newMed;
  }

  /**
   * Update an existing medication.
   */
  async updateMedication(
    patientId: string,
    medicationId: string,
    updates: Partial<AddMedicationInput>
  ): Promise<Medication> {
    if (!patientId || !medicationId) throw new Error('Missing patientId or medicationId');

    const cleanUpdates: Partial<Omit<Medication, 'id' | 'patientId' | 'createdAt'>> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.genericName !== undefined) cleanUpdates.genericName = updates.genericName.trim();
    if (updates.brandName !== undefined) cleanUpdates.brandName = updates.brandName.trim();
    if (updates.strength !== undefined) cleanUpdates.strength = updates.strength.trim();
    if (updates.dosage !== undefined) cleanUpdates.dosage = updates.dosage.trim();
    if (updates.dosageUnit !== undefined) cleanUpdates.dosageUnit = updates.dosageUnit.trim();
    if (updates.frequency !== undefined) cleanUpdates.frequency = updates.frequency.trim();
    if (updates.route !== undefined) cleanUpdates.route = updates.route.trim();
    if (updates.duration !== undefined) cleanUpdates.duration = updates.duration.trim();
    if (updates.startDate !== undefined) cleanUpdates.startDate = updates.startDate;
    if (updates.endDate !== undefined) cleanUpdates.endDate = updates.endDate;
    if (updates.purpose !== undefined) cleanUpdates.purpose = updates.purpose.trim();
    if (updates.prescribedBy !== undefined) cleanUpdates.prescribedBy = updates.prescribedBy.trim();

    return dataService.updateMedication(patientId, medicationId, cleanUpdates);
  }

  /**
   * Discontinue an active medication.
   * Sets active: false, records endDate.
   */
  async discontinueMedication(
    patientId: string,
    medicationId: string,
    endDate?: string
  ): Promise<Medication> {
    if (!patientId || !medicationId) throw new Error('Missing patientId or medicationId');
    return dataService.discontinueMedication(patientId, medicationId, endDate);
  }

  /**
   * Secure Doctor Access Check:
   * Returns patient's medication twin ONLY if doctor has an ACTIVE relationship.
   * Enforces READ-ONLY access.
   */
  async getAuthorizedPatientMedicationTwin(
    doctorId: string,
    patientId: string
  ): Promise<MedicationTwin | null> {
    const isAuthorized = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
    if (!isAuthorized) {
      console.warn(`Unauthorized attempt by doctor ${doctorId} to view patient ${patientId} medication twin`);
      return null;
    }
    return this.getMedicationTwin(patientId);
  }

  /**
   * Future architectural interface stub for Phase 4 Medication Safety Risk Engine.
   * DO NOT implement real medical decision logic here yet.
   */
  async analyzeMedicationSafety(
    _patient: PatientProfile,
    _medications: Medication[]
  ): Promise<MedicationSafetyAnalysisResult> {
    return {
      patientId: _patient.userId,
      analyzedAt: new Date().toISOString(),
      status: 'PENDING_STAGE_4_ANALYSIS',
      message: 'Medication Safety Analysis will be executed by the Clinical Risk Engine in Stage 4.',
    };
  }
}

export const medicationService = new MedicationService();

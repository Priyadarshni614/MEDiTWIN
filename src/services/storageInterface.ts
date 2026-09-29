/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, PatientProfile, DoctorProfile, DoctorPatientRelationship, RelationshipStatus, Medication, Prescription } from '../models/types';

/**
 * Clean data abstraction layer for MEDiTWIN AI.
 * Designed to mirror Firestore collections:
 * - users/{userId}
 * - patientProfiles/{userId}
 * - doctorProfiles/{userId}
 * - doctorPatientRelationships/{relationshipId}
 * - medications/{patientId}/items/{medicationId}
 * - prescriptions/{patientId}/items/{prescriptionId}
 *
 * Enforces strict user data isolation and authorization checks.
 */
export interface IDataService {
  getUser(userId: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;

  getPatientProfile(userId: string): Promise<PatientProfile | null>;
  savePatientProfile(profile: PatientProfile): Promise<void>;
  findPatientByConnectionCode(code: string): Promise<PatientProfile | null>;

  getDoctorProfile(userId: string): Promise<DoctorProfile | null>;
  saveDoctorProfile(profile: DoctorProfile): Promise<void>;

  // Doctor-Patient Relationships
  getRelationshipsForDoctor(doctorId: string): Promise<DoctorPatientRelationship[]>;
  getRelationshipsForPatient(patientId: string): Promise<DoctorPatientRelationship[]>;
  getRelationshipById(id: string): Promise<DoctorPatientRelationship | null>;
  getRelationshipBetween(doctorId: string, patientId: string): Promise<DoctorPatientRelationship | null>;
  createRelationship(
    data: Omit<DoctorPatientRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DoctorPatientRelationship>;
  updateRelationshipStatus(id: string, status: RelationshipStatus): Promise<DoctorPatientRelationship>;

  // Phase 3: Medications
  getMedicationsByPatient(patientId: string): Promise<Medication[]>;
  getActiveMedicationsByPatient(patientId: string): Promise<Medication[]>;
  getMedicationHistoryByPatient(patientId: string): Promise<Medication[]>;
  getMedicationById(patientId: string, medicationId: string): Promise<Medication | null>;
  createMedication(medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication>;
  updateMedication(patientId: string, medicationId: string, updates: Partial<Omit<Medication, 'id' | 'patientId' | 'createdAt'>>): Promise<Medication>;
  discontinueMedication(patientId: string, medicationId: string, endDate?: string): Promise<Medication>;

  // Phase 3: Prescriptions
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  getPrescriptionById(patientId: string, prescriptionId: string): Promise<Prescription | null>;
  createPrescription(prescriptionData: Omit<Prescription, 'id' | 'uploadedAt'>): Promise<Prescription>;
  updatePrescription(patientId: string, prescriptionId: string, updates: Partial<Prescription>): Promise<Prescription>;

  // Data isolation assertion helper
  hasCompletedOnboarding(userId: string, role: 'PATIENT' | 'DOCTOR'): Promise<boolean>;
}

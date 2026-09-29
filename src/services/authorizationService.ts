/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatientProfile, DoctorPatientRelationship } from '../models/types';
import { dataService } from './localStorageDataService';

/**
 * Centralized Authorization Service for MEDiTWIN AI.
 *
 * Core Principle: "Patient information belongs to the patient."
 *
 * Enforces strict access control:
 * - A doctor CANNOT see a patient merely by knowing their name or ID.
 * - A doctor CANNOT see a patient merely by entering their connection code.
 * - A doctor ONLY gains access AFTER the patient has explicitly accepted the connection request.
 * - Only an ACTIVE DoctorPatientRelationship grants doctor access.
 * - If the patient revokes access, the doctor immediately loses access.
 * - If the connection is PENDING or DECLINED, access is strictly denied.
 */
export class AuthorizationService {
  /**
   * Verify if a patient can access their own data.
   */
  canPatientAccessOwnData(authenticatedUserId: string | null | undefined, patientId: string): boolean {
    if (!authenticatedUserId || !patientId) return false;
    return authenticatedUserId === patientId;
  }

  /**
   * Core authorization check: Can a doctor access this patient's profile/medical data?
   * Requires:
   * 1. Valid doctorId and patientId
   * 2. An existing relationship record
   * 3. Relationship status MUST be strictly 'ACTIVE'
   */
  async canDoctorAccessPatient(doctorId: string | null | undefined, patientId: string): Promise<boolean> {
    if (!doctorId || !patientId) return false;

    const relationship = await dataService.getRelationshipBetween(doctorId, patientId);
    if (!relationship) return false;

    return relationship.status === 'ACTIVE';
  }

  /**
   * Verify if a doctor is authorized to view patient medical safety data,
   * Medication Twin, analyses, and reports.
   */
  async canViewPatientMedicalData(doctorId: string | null | undefined, patientId: string): Promise<boolean> {
    return this.canDoctorAccessPatient(doctorId, patientId);
  }

  /**
   * Retrieve ONLY patients who have an ACTIVE relationship with this doctor.
   * Fetches real, live patient profiles from storage to guarantee data freshness.
   * If a patient has revoked access, they will NOT be included in this list.
   */
  async getAuthorizedPatientsForDoctor(doctorId: string): Promise<{
    relationship: DoctorPatientRelationship;
    profile: PatientProfile;
  }[]> {
    if (!doctorId) return [];

    const relationships = await dataService.getRelationshipsForDoctor(doctorId);
    const activeRelationships = relationships.filter((rel) => rel.status === 'ACTIVE');

    const authorizedPatients: {
      relationship: DoctorPatientRelationship;
      profile: PatientProfile;
    }[] = [];

    for (const rel of activeRelationships) {
      const profile = await dataService.getPatientProfile(rel.patientId);
      if (profile) {
        authorizedPatients.push({
          relationship: rel,
          profile,
        });
      }
    }

    return authorizedPatients;
  }

  /**
   * Retrieve the active relationship for a patient, if one exists.
   */
  async getActiveRelationshipForPatient(patientId: string): Promise<DoctorPatientRelationship | null> {
    if (!patientId) return null;
    const relationships = await dataService.getRelationshipsForPatient(patientId);
    return relationships.find((rel) => rel.status === 'ACTIVE') || null;
  }

  /**
   * Retrieve pending incoming connection requests for a patient.
   */
  async getPendingRequestsForPatient(patientId: string): Promise<DoctorPatientRelationship[]> {
    if (!patientId) return [];
    const relationships = await dataService.getRelationshipsForPatient(patientId);
    return relationships.filter((rel) => rel.status === 'PENDING');
  }

  /**
   * Retrieve all relationships for a doctor.
   */
  async getRelationshipsForDoctor(doctorId: string): Promise<DoctorPatientRelationship[]> {
    if (!doctorId) return [];
    return dataService.getRelationshipsForDoctor(doctorId);
  }

  /**
   * Retrieve all relationships for a patient.
   */
  async getRelationshipsForPatient(patientId: string): Promise<DoctorPatientRelationship[]> {
    if (!patientId) return [];
    return dataService.getRelationshipsForPatient(patientId);
  }

  /**
   * Retrieve only active relationships for a doctor.
   */
  async getActivePatientsForDoctor(doctorId: string): Promise<DoctorPatientRelationship[]> {
    if (!doctorId) return [];
    const relationships = await dataService.getRelationshipsForDoctor(doctorId);
    return relationships.filter((rel) => rel.status === 'ACTIVE');
  }

  /**
   * Retrieve pending connection requests sent by a doctor.
   */
  async getPendingRequestsForDoctor(doctorId: string): Promise<DoctorPatientRelationship[]> {
    if (!doctorId) return [];
    const relationships = await dataService.getRelationshipsForDoctor(doctorId);
    return relationships.filter((rel) => rel.status === 'PENDING');
  }

  /**
   * Look up patient by connection code (e.g. PT-ANGELIN-4821).
   */
  async getPatientByConnectionCode(code: string): Promise<PatientProfile | null> {
    if (!code) return null;
    return dataService.findPatientByConnectionCode(code);
  }

  /**
   * Check if any relationship already exists between doctor and patient.
   */
  async checkExistingRelationship(doctorId: string, patientId: string): Promise<DoctorPatientRelationship | null> {
    if (!doctorId || !patientId) return null;
    return dataService.getRelationshipBetween(doctorId, patientId);
  }

  /**
   * Securely retrieve patient profile ONLY if an ACTIVE relationship exists.
   * Returns null if unauthorized or relationship is revoked/pending.
   */
  async getAuthorizedPatientProfile(doctorId: string, patientId: string): Promise<PatientProfile | null> {
    const isAuthorized = await this.canDoctorAccessPatient(doctorId, patientId);
    if (!isAuthorized) return null;
    return dataService.getPatientProfile(patientId);
  }

  /**
   * Doctor requests connection with a patient using the patient's connection code.
   * Status starts as PENDING. The patient must explicitly authorize it.
   */
  async requestConnectionByCode(
    doctorId: string,
    connectionCode: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    if (!doctorId) return { success: false, error: 'Doctor ID is required.' };
    if (!connectionCode) return { success: false, error: 'Patient Connection Code is required.' };

    const patient = await dataService.findPatientByConnectionCode(connectionCode);
    if (!patient) {
      return { success: false, error: `No patient found matching connection code "${connectionCode}".` };
    }

    const doctorProfile = await dataService.getDoctorProfile(doctorId);
    const doctorUser = await dataService.getUser(doctorId);
    if (!doctorProfile && !doctorUser) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    // Check if an existing relationship already exists
    const existing = await dataService.getRelationshipBetween(doctorId, patient.userId);
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { success: false, error: `You already have an active authorized relationship with ${patient.fullName}.` };
      }
      if (existing.status === 'PENDING') {
        return { success: false, error: `A connection request with ${patient.fullName} is already pending authorization.` };
      }
      // If DECLINED or REVOKED, allow creating a new request
      const updated = await dataService.updateRelationshipStatus(existing.id, 'PENDING');
      return { success: true, relationship: updated };
    }

    const doctorName = doctorProfile?.fullName || doctorUser?.name || 'Physician';
    const doctorRole = doctorProfile?.professionalRole || 'Clinician';
    const doctorSpecialization = doctorProfile?.specialization;
    const doctorOrganization = doctorProfile?.organization || 'Hospital';
    const doctorEmail = doctorProfile?.email || doctorUser?.email || '';

    const newRel = await dataService.createRelationship({
      doctorId,
      patientId: patient.userId,
      patientConnectionCode: patient.connectionCode,
      status: 'PENDING',
      requestedBy: 'DOCTOR',
      doctorName,
      doctorRole,
      doctorSpecialization,
      doctorOrganization,
      doctorEmail,
      patientName: patient.fullName,
    });

    return { success: true, relationship: newRel };
  }

  /**
   * Patient authorizes a connection request.
   * Status transitions from PENDING to ACTIVE.
   */
  async authorizeDoctor(
    relationshipId: string,
    patientId: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    const rel = await dataService.getRelationshipById(relationshipId);
    if (!rel) {
      return { success: false, error: 'Relationship request not found.' };
    }

    // Security check: Only the targeted patient can authorize access to their own data
    if (rel.patientId !== patientId) {
      return { success: false, error: 'Unauthorized: Only the patient can authorize this relationship.' };
    }

    const all = (dataService as any).getAllRelationships();
    const now = new Date().toISOString();
    const updated: DoctorPatientRelationship = {
      ...rel,
      status: 'ACTIVE',
      authorizedAt: now,
      updatedAt: now,
    };
    all[relationshipId] = updated;
    (dataService as any).saveAllRelationships(all);

    return { success: true, relationship: updated };
  }

  /**
   * Patient declines a connection request.
   * Status transitions to DECLINED.
   */
  async declineDoctor(
    relationshipId: string,
    patientId: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    const rel = await dataService.getRelationshipById(relationshipId);
    if (!rel) {
      return { success: false, error: 'Relationship request not found.' };
    }

    if (rel.patientId !== patientId) {
      return { success: false, error: 'Unauthorized: Only the patient can decline this relationship.' };
    }

    const updated = await dataService.updateRelationshipStatus(relationshipId, 'DECLINED');
    return { success: true, relationship: updated };
  }

  /**
   * Patient revokes doctor's access.
   * Status transitions to REVOKED. Doctor immediately loses all access.
   */
  async revokeDoctorAccess(
    relationshipId: string,
    patientId: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    const rel = await dataService.getRelationshipById(relationshipId);
    if (!rel) {
      return { success: false, error: 'Relationship not found.' };
    }

    if (rel.patientId !== patientId) {
      return { success: false, error: 'Unauthorized: Only the patient can revoke access.' };
    }

    const all = (dataService as any).getAllRelationships();
    const now = new Date().toISOString();
    const updated: DoctorPatientRelationship = {
      ...rel,
      status: 'REVOKED',
      revokedAt: now,
      updatedAt: now,
    };
    all[relationshipId] = updated;
    (dataService as any).saveAllRelationships(all);

    return { success: true, relationship: updated };
  }

  /**
   * Doctor revokes or disconnects an authorized patient relationship from the clinical side.
   * Status transitions to REVOKED. The doctor immediately loses all access to patient data.
   */
  async revokePatientAccessByDoctor(
    relationshipId: string,
    doctorId: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    const rel = await dataService.getRelationshipById(relationshipId);
    if (!rel) {
      return { success: false, error: 'Relationship not found.' };
    }

    if (rel.doctorId !== doctorId) {
      return { success: false, error: 'Unauthorized: Only the connected doctor can revoke access.' };
    }

    const all = (dataService as any).getAllRelationships();
    const now = new Date().toISOString();
    const updated: DoctorPatientRelationship = {
      ...rel,
      status: 'REVOKED',
      revokedAt: now,
      updatedAt: now,
    };
    all[relationshipId] = updated;
    (dataService as any).saveAllRelationships(all);

    return { success: true, relationship: updated };
  }

  /**
   * Doctor cancels an outgoing pending connection request before the patient authorizes it.
   */
  async cancelPendingRequestByDoctor(
    relationshipId: string,
    doctorId: string
  ): Promise<{ success: boolean; relationship?: DoctorPatientRelationship; error?: string }> {
    const rel = await dataService.getRelationshipById(relationshipId);
    if (!rel) {
      return { success: false, error: 'Relationship request not found.' };
    }

    if (rel.doctorId !== doctorId) {
      return { success: false, error: 'Unauthorized: Only the requesting doctor can cancel this request.' };
    }

    const all = (dataService as any).getAllRelationships();
    const now = new Date().toISOString();
    const updated: DoctorPatientRelationship = {
      ...rel,
      status: 'REVOKED',
      revokedAt: now,
      updatedAt: now,
    };
    all[relationshipId] = updated;
    (dataService as any).saveAllRelationships(all);

    return { success: true, relationship: updated };
  }
}

export const authorizationService = new AuthorizationService();

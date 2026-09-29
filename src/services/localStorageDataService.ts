/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataService } from './storageInterface';
import { User, PatientProfile, DoctorProfile, DoctorPatientRelationship, RelationshipStatus, Medication, Prescription } from '../models/types';

/**
 * Helper to generate unique, clean patient connection code.
 * Example format: PT-ANGELIN-4821
 */
export function generatePatientConnectionCode(fullName: string): string {
  const cleanName = fullName.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 7) || 'PATIENT';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `PT-${cleanName}-${randomDigits}`;
}

/**
 * Storage Service implementation following Firestore document hierarchy:
 * - users/{userId}
 * - patientProfiles/{userId}
 * - doctorProfiles/{userId}
 * - doctorPatientRelationships/{relationshipId}
 *
 * Enforces strict user data isolation: each user's data is partitioned by their unique userId.
 */
export class LocalStorageDataService implements IDataService {
  private static readonly USERS_PREFIX = 'meditwin_users:';
  private static readonly PATIENT_PROFILES_PREFIX = 'meditwin_patient_profiles:';
  private static readonly DOCTOR_PROFILES_PREFIX = 'meditwin_doctor_profiles:';
  private static readonly RELATIONSHIPS_KEY = 'meditwin_doctor_patient_relationships';
  private static readonly MEDICATIONS_PREFIX = 'meditwin_medications:';
  private static readonly PRESCRIPTIONS_PREFIX = 'meditwin_prescriptions:';

  async getUser(userId: string): Promise<User | null> {
    if (!userId) return null;
    const raw = localStorage.getItem(`${LocalStorageDataService.USERS_PREFIX}${userId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  async saveUser(user: User): Promise<void> {
    if (!user || !user.id) throw new Error('Invalid user: missing user.id');
    localStorage.setItem(
      `${LocalStorageDataService.USERS_PREFIX}${user.id}`,
      JSON.stringify(user)
    );
  }

  async getPatientProfile(userId: string): Promise<PatientProfile | null> {
    if (!userId) return null;
    const raw = localStorage.getItem(`${LocalStorageDataService.PATIENT_PROFILES_PREFIX}${userId}`);
    if (!raw) return null;
    try {
      const profile = JSON.parse(raw) as PatientProfile;
      // Strict data isolation check
      if (profile.userId !== userId) {
        console.warn(`Data isolation violation attempted for patient profile ${userId}`);
        return null;
      }
      // Guarantee connectionCode is present
      if (!profile.connectionCode) {
        profile.connectionCode = generatePatientConnectionCode(profile.fullName);
        await this.savePatientProfile(profile);
      }
      return profile;
    } catch {
      return null;
    }
  }

  async savePatientProfile(profile: PatientProfile): Promise<void> {
    if (!profile || !profile.userId) throw new Error('Invalid profile: missing profile.userId');
    const now = new Date().toISOString();
    const connectionCode = profile.connectionCode?.trim() || generatePatientConnectionCode(profile.fullName);

    const updatedProfile: PatientProfile = {
      ...profile,
      connectionCode,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    };
    localStorage.setItem(
      `${LocalStorageDataService.PATIENT_PROFILES_PREFIX}${profile.userId}`,
      JSON.stringify(updatedProfile)
    );
  }

  async findPatientByConnectionCode(code: string): Promise<PatientProfile | null> {
    if (!code || !code.trim()) return null;
    const searchCode = code.trim().toUpperCase();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LocalStorageDataService.PATIENT_PROFILES_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const profile = JSON.parse(raw) as PatientProfile;
            if (profile.connectionCode && profile.connectionCode.trim().toUpperCase() === searchCode) {
              return profile;
            }
          } catch {
            // ignore malformed entries
          }
        }
      }
    }
    return null;
  }

  async getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
    if (!userId) return null;
    const raw = localStorage.getItem(`${LocalStorageDataService.DOCTOR_PROFILES_PREFIX}${userId}`);
    if (!raw) return null;
    try {
      const profile = JSON.parse(raw) as DoctorProfile;
      // Strict data isolation check
      if (profile.userId !== userId) {
        console.warn(`Data isolation violation attempted for doctor profile ${userId}`);
        return null;
      }
      return profile;
    } catch {
      return null;
    }
  }

  async saveDoctorProfile(profile: DoctorProfile): Promise<void> {
    if (!profile || !profile.userId) throw new Error('Invalid profile: missing profile.userId');
    const now = new Date().toISOString();
    const updatedProfile: DoctorProfile = {
      ...profile,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    };
    localStorage.setItem(
      `${LocalStorageDataService.DOCTOR_PROFILES_PREFIX}${profile.userId}`,
      JSON.stringify(updatedProfile)
    );
  }

  // ==========================================
  // DOCTOR-PATIENT RELATIONSHIP STORAGE
  // ==========================================

  private getAllRelationships(): Record<string, DoctorPatientRelationship> {
    const raw = localStorage.getItem(LocalStorageDataService.RELATIONSHIPS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, DoctorPatientRelationship>;
    } catch {
      return {};
    }
  }

  private saveAllRelationships(records: Record<string, DoctorPatientRelationship>): void {
    localStorage.setItem(LocalStorageDataService.RELATIONSHIPS_KEY, JSON.stringify(records));
  }

  async getRelationshipsForDoctor(doctorId: string): Promise<DoctorPatientRelationship[]> {
    if (!doctorId) return [];
    const all = this.getAllRelationships();
    return Object.values(all).filter((r) => r.doctorId === doctorId);
  }

  async getRelationshipsForPatient(patientId: string): Promise<DoctorPatientRelationship[]> {
    if (!patientId) return [];
    const all = this.getAllRelationships();
    return Object.values(all).filter((r) => r.patientId === patientId);
  }

  async getRelationshipById(id: string): Promise<DoctorPatientRelationship | null> {
    if (!id) return null;
    const all = this.getAllRelationships();
    return all[id] || null;
  }

  async getRelationshipBetween(doctorId: string, patientId: string): Promise<DoctorPatientRelationship | null> {
    if (!doctorId || !patientId) return null;
    const all = this.getAllRelationships();
    const found = Object.values(all).find((r) => r.doctorId === doctorId && r.patientId === patientId);
    return found || null;
  }

  async createRelationship(
    data: Omit<DoctorPatientRelationship, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DoctorPatientRelationship> {
    const all = this.getAllRelationships();
    const now = new Date().toISOString();
    const id = `rel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newRel: DoctorPatientRelationship = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    all[id] = newRel;
    this.saveAllRelationships(all);
    return newRel;
  }

  async updateRelationshipStatus(id: string, status: RelationshipStatus): Promise<DoctorPatientRelationship> {
    const all = this.getAllRelationships();
    const rel = all[id];
    if (!rel) {
      throw new Error(`Relationship ${id} not found.`);
    }

    const now = new Date().toISOString();
    const updated: DoctorPatientRelationship = {
      ...rel,
      status,
      updatedAt: now,
    };

    all[id] = updated;
    this.saveAllRelationships(all);
    return updated;
  }

  // ==========================================
  // PHASE 3: PATIENT MEDICATIONS STORAGE
  // ==========================================

  private getPatientMedicationsRecord(patientId: string): Record<string, Medication> {
    if (!patientId) return {};
    const raw = localStorage.getItem(`${LocalStorageDataService.MEDICATIONS_PREFIX}${patientId}`);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, Medication>;
    } catch {
      return {};
    }
  }

  private savePatientMedicationsRecord(patientId: string, records: Record<string, Medication>): void {
    if (!patientId) throw new Error('Missing patientId for medication storage');
    localStorage.setItem(
      `${LocalStorageDataService.MEDICATIONS_PREFIX}${patientId}`,
      JSON.stringify(records)
    );
  }

  async getMedicationsByPatient(patientId: string): Promise<Medication[]> {
    if (!patientId) return [];
    const record = this.getPatientMedicationsRecord(patientId);
    return Object.values(record).sort((a, b) => {
      // Sort active first, then by createdAt desc
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getActiveMedicationsByPatient(patientId: string): Promise<Medication[]> {
    if (!patientId) return [];
    const all = await this.getMedicationsByPatient(patientId);
    return all.filter((m) => m.active === true);
  }

  async getMedicationHistoryByPatient(patientId: string): Promise<Medication[]> {
    if (!patientId) return [];
    const all = await this.getMedicationsByPatient(patientId);
    return all.filter((m) => m.active === false);
  }

  async getMedicationById(patientId: string, medicationId: string): Promise<Medication | null> {
    if (!patientId || !medicationId) return null;
    const record = this.getPatientMedicationsRecord(patientId);
    const med = record[medicationId];
    if (!med || med.patientId !== patientId) return null;
    return med;
  }

  async createMedication(
    medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Medication> {
    if (!medicationData.patientId) {
      throw new Error('Patient ID is required to create medication');
    }
    const record = this.getPatientMedicationsRecord(medicationData.patientId);
    const now = new Date().toISOString();
    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newMed: Medication = {
      ...medicationData,
      id,
      active: medicationData.active !== undefined ? medicationData.active : true,
      createdAt: now,
      updatedAt: now,
    };

    record[id] = newMed;
    this.savePatientMedicationsRecord(medicationData.patientId, record);
    return newMed;
  }

  async updateMedication(
    patientId: string,
    medicationId: string,
    updates: Partial<Omit<Medication, 'id' | 'patientId' | 'createdAt'>>
  ): Promise<Medication> {
    const record = this.getPatientMedicationsRecord(patientId);
    const existing = record[medicationId];
    if (!existing) {
      throw new Error(`Medication ${medicationId} not found for patient ${patientId}`);
    }

    const now = new Date().toISOString();
    const updated: Medication = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    record[medicationId] = updated;
    this.savePatientMedicationsRecord(patientId, record);
    return updated;
  }

  async discontinueMedication(
    patientId: string,
    medicationId: string,
    endDate?: string
  ): Promise<Medication> {
    const now = new Date().toISOString();
    const dateToSet = endDate || now.split('T')[0];
    return this.updateMedication(patientId, medicationId, {
      active: false,
      endDate: dateToSet,
    });
  }

  // ==========================================
  // PHASE 3: PATIENT PRESCRIPTIONS STORAGE
  // ==========================================

  private getPatientPrescriptionsRecord(patientId: string): Record<string, Prescription> {
    if (!patientId) return {};
    const raw = localStorage.getItem(`${LocalStorageDataService.PRESCRIPTIONS_PREFIX}${patientId}`);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, Prescription>;
    } catch {
      return {};
    }
  }

  private savePatientPrescriptionsRecord(patientId: string, records: Record<string, Prescription>): void {
    if (!patientId) throw new Error('Missing patientId for prescription storage');
    try {
      localStorage.setItem(
        `${LocalStorageDataService.PRESCRIPTIONS_PREFIX}${patientId}`,
        JSON.stringify(records)
      );
    } catch {
      // If quota exceeded, retain records but truncate large base64 image data to keep metadata & medications safe
      const trimmed: Record<string, Prescription> = {};
      for (const [k, v] of Object.entries(records)) {
        trimmed[k] = {
          ...v,
          imageUrl: v.imageUrl && v.imageUrl.length > 500 ? v.imageUrl.substring(0, 100) + '...[truncated]' : v.imageUrl,
        };
      }
      try {
        localStorage.setItem(
          `${LocalStorageDataService.PRESCRIPTIONS_PREFIX}${patientId}`,
          JSON.stringify(trimmed)
        );
      } catch (err2) {
        console.warn('Could not persist prescription record to localStorage quota:', err2);
      }
    }
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    if (!patientId) return [];
    const record = this.getPatientPrescriptionsRecord(patientId);
    return Object.values(record).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getPrescriptionById(patientId: string, prescriptionId: string): Promise<Prescription | null> {
    if (!patientId || !prescriptionId) return null;
    const record = this.getPatientPrescriptionsRecord(patientId);
    const p = record[prescriptionId];
    if (!p || p.patientId !== patientId) return null;
    return p;
  }

  async createPrescription(
    prescriptionData: Omit<Prescription, 'id' | 'uploadedAt'>
  ): Promise<Prescription> {
    if (!prescriptionData.patientId) {
      throw new Error('Patient ID is required to save prescription');
    }
    const record = this.getPatientPrescriptionsRecord(prescriptionData.patientId);
    const now = new Date().toISOString();
    const id = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newPrescription: Prescription = {
      ...prescriptionData,
      id,
      uploadedAt: now,
    };

    record[id] = newPrescription;
    this.savePatientPrescriptionsRecord(prescriptionData.patientId, record);
    return newPrescription;
  }

  async updatePrescription(
    patientId: string,
    prescriptionId: string,
    updates: Partial<Prescription>
  ): Promise<Prescription> {
    const record = this.getPatientPrescriptionsRecord(patientId);
    const existing = record[prescriptionId];
    if (!existing) {
      throw new Error(`Prescription ${prescriptionId} not found for patient ${patientId}`);
    }

    const updated: Prescription = {
      ...existing,
      ...updates,
    };

    record[prescriptionId] = updated;
    this.savePatientPrescriptionsRecord(patientId, record);
    return updated;
  }

  async hasCompletedOnboarding(userId: string, role: 'PATIENT' | 'DOCTOR'): Promise<boolean> {
    if (!userId) return false;
    if (role === 'PATIENT') {
      const profile = await this.getPatientProfile(userId);
      return !!(profile && profile.fullName && profile.age);
    } else if (role === 'DOCTOR') {
      const profile = await this.getDoctorProfile(userId);
      return !!(profile && profile.fullName && profile.organization);
    }
    return false;
  }

  async deleteUserData(userId: string, role: 'PATIENT' | 'DOCTOR'): Promise<void> {
    if (!userId) return;

    // 1. Remove user document
    localStorage.removeItem(`${LocalStorageDataService.USERS_PREFIX}${userId}`);

    if (role === 'PATIENT') {
      // 2. Remove patient profile, medications, prescriptions, safety reports
      localStorage.removeItem(`${LocalStorageDataService.PATIENT_PROFILES_PREFIX}${userId}`);
      localStorage.removeItem(`${LocalStorageDataService.MEDICATIONS_PREFIX}${userId}`);
      localStorage.removeItem(`${LocalStorageDataService.PRESCRIPTIONS_PREFIX}${userId}`);
      localStorage.removeItem(`meditwin_safety_report_${userId}`);
      localStorage.removeItem(`meditwin_twin_${userId}`);
      localStorage.removeItem(`meditwin_passport_share_${userId}`);

      // 3. Invalidate emergency passport on server if active
      try {
        await fetch('/api/passport/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: userId }),
        });
      } catch {
        // offline or best-effort server revocation
      }

      // 4. Update relationships where patientId matches
      const allRels = this.getAllRelationships();
      let changed = false;
      for (const [id, rel] of Object.entries(allRels)) {
        if (rel.patientId === userId) {
          rel.status = 'REVOKED';
          rel.revokedAt = new Date().toISOString();
          changed = true;
        }
      }
      if (changed) {
        this.saveAllRelationships(allRels);
      }
    } else if (role === 'DOCTOR') {
      // Remove doctor profile
      localStorage.removeItem(`${LocalStorageDataService.DOCTOR_PROFILES_PREFIX}${userId}`);

      // Update relationships where doctorId matches
      const allRels = this.getAllRelationships();
      let changed = false;
      for (const [id, rel] of Object.entries(allRels)) {
        if (rel.doctorId === userId) {
          rel.status = 'REVOKED';
          rel.revokedAt = new Date().toISOString();
          changed = true;
        }
      }
      if (changed) {
        this.saveAllRelationships(allRels);
      }
    }
  }
}

export const dataService = new LocalStorageDataService();

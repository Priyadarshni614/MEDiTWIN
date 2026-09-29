/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoredUserCredential, User, PatientProfile, DoctorProfile, DoctorPatientRelationship, RelationshipStatus } from '../models/types';
import { generateSalt, hashPassword } from '../utils/crypto';
import { dataService } from './localStorageDataService';

export const DEMO_PATIENT_ID = 'demo_patient_angelin';
export const DEMO_PATIENT_EMAIL = 'angelin.demo@meditwin.ai';
export const DEMO_PATIENT_NAME = 'Angelin Steve';
export const DEMO_PATIENT_CODE = 'PT-ANGELIN-4821';

export const DEMO_DOCTOR_ID = 'demo_doctor_joel';
export const DEMO_DOCTOR_EMAIL = 'joel.demo@meditwin.ai';
export const DEMO_DOCTOR_NAME = 'Dr. Joel Steve';

export const DEMO_PASSWORD = 'Password123!';

const AUTH_CREDENTIALS_KEY = 'meditwin_auth_credentials';

/**
 * Demo Service for MediTwin AI.
 *
 * Implements controlled DEMO MODE with isolated accounts:
 * - Angelin Steve (Patient)
 * - Joel Steve (Doctor)
 *
 * Operates on the EXACT SAME storage and authorization architecture as real accounts.
 */
export class DemoService {
  /**
   * Check if a given email or ID is a demo account.
   */
  isDemoUser(identifier: string | null | undefined): boolean {
    if (!identifier) return false;
    const lower = identifier.toLowerCase();
    return (
      lower === DEMO_PATIENT_EMAIL ||
      lower === DEMO_DOCTOR_EMAIL ||
      identifier === DEMO_PATIENT_ID ||
      identifier === DEMO_DOCTOR_ID
    );
  }

  /**
   * Initialize or verify demo credentials & baseline profiles.
   */
  async ensureDemoAccounts(): Promise<void> {
    const rawCreds = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    const credentials: Record<string, StoredUserCredential> = rawCreds ? JSON.parse(rawCreds) : {};

    const now = new Date().toISOString();

    // 1. Ensure Demo Patient: Angelin Steve
    if (!credentials[DEMO_PATIENT_ID]) {
      const salt = generateSalt(16);
      const passwordHash = await hashPassword(DEMO_PASSWORD, salt);

      const patientCred: StoredUserCredential = {
        id: DEMO_PATIENT_ID,
        name: DEMO_PATIENT_NAME,
        email: DEMO_PATIENT_EMAIL,
        role: 'PATIENT',
        passwordHash,
        salt,
        createdAt: now,
      };
      credentials[DEMO_PATIENT_ID] = patientCred;

      const patientUser: User = {
        id: DEMO_PATIENT_ID,
        name: DEMO_PATIENT_NAME,
        email: DEMO_PATIENT_EMAIL,
        role: 'PATIENT',
        createdAt: now,
      };
      await dataService.saveUser(patientUser);
    }

    // Ensure Angelin's Profile with explicit connection code
    const existingPatientProfile = await dataService.getPatientProfile(DEMO_PATIENT_ID);
    if (!existingPatientProfile) {
      const angelProfile: PatientProfile = {
        userId: DEMO_PATIENT_ID,
        fullName: DEMO_PATIENT_NAME,
        age: 68,
        gender: 'female',
        weight: '64 kg',
        allergies: ['Penicillin (Hives/Anaphylaxis risk)', 'Sulfa Drugs', 'NSAIDs (Aspirin/Ibuprofen)'],
        chronicConditions: ['Type 2 Diabetes Mellitus', 'Hypertension', 'Osteoarthritis', 'Mild Chronic Kidney Disease (Stage 2)'],
        pregnancyStatus: 'not-applicable',
        emergencyContact: {
          name: 'Marcus Steve',
          relationship: 'Spouse',
          phone: '+1 (555) 382-9912',
        },
        connectionCode: DEMO_PATIENT_CODE,
        createdAt: now,
        updatedAt: now,
      };
      await dataService.savePatientProfile(angelProfile);
    }

    // 2. Ensure Demo Doctor: Dr. Joel Steve
    if (!credentials[DEMO_DOCTOR_ID]) {
      const salt = generateSalt(16);
      const passwordHash = await hashPassword(DEMO_PASSWORD, salt);

      const doctorCred: StoredUserCredential = {
        id: DEMO_DOCTOR_ID,
        name: DEMO_DOCTOR_NAME,
        email: DEMO_DOCTOR_EMAIL,
        role: 'DOCTOR',
        passwordHash,
        salt,
        createdAt: now,
      };
      credentials[DEMO_DOCTOR_ID] = doctorCred;

      const doctorUser: User = {
        id: DEMO_DOCTOR_ID,
        name: DEMO_DOCTOR_NAME,
        email: DEMO_DOCTOR_EMAIL,
        role: 'DOCTOR',
        createdAt: now,
      };
      await dataService.saveUser(doctorUser);
    }

    // Ensure Joel's Doctor Profile
    const existingDoctorProfile = await dataService.getDoctorProfile(DEMO_DOCTOR_ID);
    if (!existingDoctorProfile) {
      const joelProfile: DoctorProfile = {
        userId: DEMO_DOCTOR_ID,
        fullName: 'Dr. Joel Steve, MD, BCPS',
        email: DEMO_DOCTOR_EMAIL,
        professionalRole: 'Clinical Pharmacotherapy Specialist',
        specialization: 'Geriatric Polypharmacy & Deprescribing',
        organization: 'National University Health System & Clinical Research Center',
        createdAt: now,
        updatedAt: now,
      };
      await dataService.saveDoctorProfile(joelProfile);
    }

    // 3. Ensure Demo Medications for Angelin Steve (Phase 3 Polypharmacy baseline)
    const existingMeds = await dataService.getMedicationsByPatient(DEMO_PATIENT_ID);
    if (existingMeds.length === 0) {
      // Active Polypharmacy Regimen
      await dataService.createMedication({
        patientId: DEMO_PATIENT_ID,
        name: 'Metformin Hydrochloride',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        strength: '500 mg',
        dosage: '1 tablet',
        dosageUnit: 'tablet',
        frequency: 'Twice daily with meals',
        route: 'Oral',
        duration: 'Ongoing',
        startDate: '2025-01-15',
        purpose: 'Type 2 Diabetes Mellitus glycemic control',
        prescribedBy: 'Dr. Joel Steve, MD',
        source: 'MANUAL',
        active: true,
      });

      await dataService.createMedication({
        patientId: DEMO_PATIENT_ID,
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        brandName: 'Zestril',
        strength: '10 mg',
        dosage: '1 tablet',
        dosageUnit: 'tablet',
        frequency: 'Once daily in the morning',
        route: 'Oral',
        duration: 'Ongoing',
        startDate: '2025-02-01',
        purpose: 'Essential Hypertension & Renal protection',
        prescribedBy: 'Dr. Joel Steve, MD',
        source: 'MANUAL',
        active: true,
      });

      await dataService.createMedication({
        patientId: DEMO_PATIENT_ID,
        name: 'Atorvastatin Calcium',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        strength: '20 mg',
        dosage: '1 tablet',
        dosageUnit: 'tablet',
        frequency: 'Once daily at bedtime',
        route: 'Oral',
        duration: 'Ongoing',
        startDate: '2025-02-15',
        purpose: 'Hyperlipidemia / Atherosclerotic risk reduction',
        prescribedBy: 'Dr. Joel Steve, MD',
        source: 'MANUAL',
        active: true,
      });

      await dataService.createMedication({
        patientId: DEMO_PATIENT_ID,
        name: 'Acetaminophen Extended-Relief',
        genericName: 'Acetaminophen',
        brandName: 'Tylenol Arthritis Pain',
        strength: '650 mg',
        dosage: '1 tablet',
        dosageUnit: 'tablet',
        frequency: 'Every 8 hours as needed for pain',
        route: 'Oral',
        duration: 'Ongoing (PRN)',
        startDate: '2025-03-01',
        purpose: 'Osteoarthritis joint pain management',
        prescribedBy: 'Dr. Joel Steve, MD',
        source: 'MANUAL',
        active: true,
      });

      // Discontinued / Historical Medication
      const amox = await dataService.createMedication({
        patientId: DEMO_PATIENT_ID,
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        strength: '500 mg',
        dosage: '1 capsule',
        dosageUnit: 'capsule',
        frequency: 'Every 8 hours for 7 days',
        route: 'Oral',
        duration: '7 days',
        startDate: '2024-11-10',
        endDate: '2024-11-17',
        purpose: 'Acute bacterial sinusitis (Course completed)',
        prescribedBy: 'Community Urgent Care Clinic',
        source: 'MANUAL',
        active: false,
      });
      // Ensure it is marked inactive
      await dataService.updateMedication(DEMO_PATIENT_ID, amox.id, { active: false, endDate: '2024-11-17' });
    }

    // 4. Ensure Demo Prescription Slip in History
    const existingPrescriptions = await dataService.getPrescriptionsByPatient(DEMO_PATIENT_ID);
    if (existingPrescriptions.length === 0) {
      await dataService.createPrescription({
        patientId: DEMO_PATIENT_ID,
        fileName: 'Prescription_Dr_Steve_Jan2025.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        prescriptionDate: '2025-01-15',
        doctorName: 'Dr. Joel Steve, MD, BCPS',
        extractionStatus: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        notes: 'Annual polypharmacy therapy review and medication reconciliation.',
        extractedMedications: [
          {
            id: 'item_demo_1',
            name: 'Metformin Hydrochloride',
            genericName: 'Metformin',
            strength: '500 mg',
            dosage: '1 tablet',
            dosageUnit: 'tablet',
            frequency: 'Twice daily with meals',
            route: 'Oral',
            duration: '90 days',
            confidence: 'High',
            selected: true,
          },
          {
            id: 'item_demo_2',
            name: 'Lisinopril',
            genericName: 'Lisinopril',
            strength: '10 mg',
            dosage: '1 tablet',
            dosageUnit: 'tablet',
            frequency: 'Once daily in the morning',
            route: 'Oral',
            duration: '90 days',
            confidence: 'High',
            selected: true,
          },
        ],
      });
    }

    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  /**
   * Set or reset the demo relationship between Angelin Steve and Dr. Joel Steve.
   * Uses the standard DoctorPatientRelationship model and storage.
   */
  async setDemoRelationshipState(state: 'NONE' | 'PENDING' | 'ACTIVE' | 'REVOKED'): Promise<DoctorPatientRelationship | null> {
    await this.ensureDemoAccounts();

    const existing = await dataService.getRelationshipBetween(DEMO_DOCTOR_ID, DEMO_PATIENT_ID);

    if (state === 'NONE') {
      if (existing) {
        // Remove from storage directly
        const raw = localStorage.getItem('meditwin_doctor_patient_relationships');
        if (raw) {
          const all = JSON.parse(raw);
          delete all[existing.id];
          localStorage.setItem('meditwin_doctor_patient_relationships', JSON.stringify(all));
        }
      }
      return null;
    }

    if (existing) {
      return dataService.updateRelationshipStatus(existing.id, state as RelationshipStatus);
    }

    // Create new relationship
    return dataService.createRelationship({
      doctorId: DEMO_DOCTOR_ID,
      patientId: DEMO_PATIENT_ID,
      patientConnectionCode: DEMO_PATIENT_CODE,
      status: state as RelationshipStatus,
      requestedBy: 'DOCTOR',
      doctorName: 'Dr. Joel Steve, MD, BCPS',
      doctorRole: 'Clinical Pharmacotherapy Specialist',
      doctorSpecialization: 'Geriatric Polypharmacy & Deprescribing',
      doctorOrganization: 'National University Health System',
      doctorEmail: DEMO_DOCTOR_EMAIL,
      patientName: DEMO_PATIENT_NAME,
    });
  }
}

export const demoService = new DemoService();

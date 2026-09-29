/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataService } from '../services/localStorageDataService';
import { authorizationService } from '../services/authorizationService';
import { LocalAuthService } from '../services/authService';
import { emergencyPassportStore } from './emergencyPassportStore';
import { PatientProfile, DoctorProfile } from '../models/types';

// Mock localStorage for node.js test environment if needed
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
}

// Mock window for authService
if (typeof window === 'undefined') {
  (global as any).window = {
    addEventListener: () => {},
  };
}

async function runSettingsTests() {
  console.log('🧪 Starting MediTwin AI Patient & Doctor Settings Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  const patientId = 'test_patient_settings_' + Date.now();
  const doctorId = 'test_doctor_settings_' + Date.now();

  // ==========================================
  // PATIENT SETTINGS TESTS
  // ==========================================
  console.log('--- TEST SUITE 1: PATIENT SETTINGS ---');

  // Test 1: Save and persist patient basic profile details
  const initialPatientProfile: PatientProfile = {
    userId: patientId,
    fullName: 'Sophia Martinez',
    age: 48,
    gender: 'female',
    weight: '68 kg',
    pregnancyStatus: 'not-applicable',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    connectionCode: 'PT-SOPHIA-9124',
    emergencyContact: {
      name: 'Carlos Martinez',
      relationship: 'Spouse',
      phone: '555-0182',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataService.savePatientProfile(initialPatientProfile);
  const loadedPatient = await dataService.getPatientProfile(patientId);
  assert(loadedPatient !== null, 'Patient profile saved successfully');
  assert(loadedPatient?.fullName === 'Sophia Martinez', 'Patient full name matches');
  assert(loadedPatient?.age === 48, 'Patient age matches');
  assert(loadedPatient?.weight === '68 kg', 'Patient weight matches');
  assert(loadedPatient?.emergencyContact.name === 'Carlos Martinez', 'Emergency contact saved');

  // Test 2: Edit profile details, allergies, and chronic conditions
  const updatedPatientProfile: PatientProfile = {
    ...initialPatientProfile,
    fullName: 'Sophia Martinez-Ross',
    age: 49,
    weight: '67 kg',
    allergies: ['Penicillin', 'Sulfa Drugs', 'Aspirin / NSAIDs'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes', 'Hypothyroidism'],
    emergencyContact: {
      name: 'Carlos Martinez',
      relationship: 'Spouse',
      phone: '555-9999',
    },
  };

  await dataService.savePatientProfile(updatedPatientProfile);
  const reloadedPatient = await dataService.getPatientProfile(patientId);
  assert(reloadedPatient?.fullName === 'Sophia Martinez-Ross', 'Updated name persists');
  assert(reloadedPatient?.age === 49, 'Updated age persists');
  assert(reloadedPatient?.allergies.includes('Aspirin / NSAIDs') === true, 'Added allergy persists');
  assert(reloadedPatient?.chronicConditions.includes('Hypothyroidism') === true, 'Added chronic condition persists');
  assert(reloadedPatient?.emergencyContact.phone === '555-9999', 'Updated emergency phone persists');

  // Test 3: Patient Revokes Doctor Access
  // First, create doctor profile and connect
  const initialDoctorProfile: DoctorProfile = {
    userId: doctorId,
    fullName: 'Dr. Gregory Vance',
    email: 'gregory.vance@clinic.org',
    professionalRole: 'Clinical Pharmacist',
    specialization: 'Geriatric Polypharmacy',
    organization: 'Highland Regional Hospital',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await dataService.saveDoctorProfile(initialDoctorProfile);

  // Doctor requests connection
  const reqRes = await authorizationService.requestConnectionByCode(doctorId, 'PT-SOPHIA-9124');
  assert(reqRes.success === true && reqRes.relationship !== undefined, 'Doctor request by patient code created');
  const relId = reqRes.relationship!.id;

  // Patient authorizes connection
  const authRes = await authorizationService.authorizeDoctor(relId, patientId);
  assert(authRes.success === true && authRes.relationship?.status === 'ACTIVE', 'Patient authorized doctor connection');

  // Verify doctor can access patient
  const canAccessBefore = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
  assert(canAccessBefore === true, 'Doctor has active clinical access');

  // Patient revokes access
  const revokeRes = await authorizationService.revokeDoctorAccess(relId, patientId);
  assert(revokeRes.success === true && revokeRes.relationship?.status === 'REVOKED', 'Patient revoked doctor access');

  // Verify doctor immediately loses access
  const canAccessAfter = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
  assert(canAccessAfter === false, 'Doctor immediately loses access after patient revocation');

  // Test 4: Manage emergency passport / QR sharing consent & revocation
  const passportToken = 'sec_passport_test_' + Date.now();
  emergencyPassportStore.createShare({
    token: passportToken,
    patientId,
    patientName: 'Sophia Martinez',
    data: {
      patientId,
      fullName: 'Sophia Martinez',
      age: 49,
      gender: 'female',
      weight: '67 kg',
      bloodType: null,
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
      emergencyContact: { name: 'Carlos', relationship: 'Spouse', phone: '555-9999' },
      activeMedications: [],
      lastSafetyAnalysisDate: null,
      safetyScore: 90,
      safetyRating: 'Good',
      importantVerifiedFindings: [],
      disclaimer: 'Informational reference only.',
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    },
    durationHours: 24,
    hasExplicitConsent: true,
  });

  const shareBefore = emergencyPassportStore.getByToken(passportToken);
  assert(shareBefore.success === true && shareBefore.status === 'ACTIVE', 'Emergency share active with patient consent');

  // Revoke emergency share
  emergencyPassportStore.revoke(passportToken);
  const shareAfter = emergencyPassportStore.getByToken(passportToken);
  assert(shareAfter.success === false && shareAfter.status === 'REVOKED', 'Emergency share successfully revoked');

  // ==========================================
  // DOCTOR SETTINGS TESTS
  // ==========================================
  console.log('\n--- TEST SUITE 2: DOCTOR SETTINGS ---');

  // Test 5: Save and edit professional profile details
  const updatedDoctorProfile: DoctorProfile = {
    ...initialDoctorProfile,
    fullName: 'Dr. Gregory Vance, PharmD, BCGP',
    professionalRole: 'Geriatric Specialist',
    specialization: 'Complex Polypharmacy & Deprescribing',
    organization: 'Metro Health Academic Medical Center',
  };
  await dataService.saveDoctorProfile(updatedDoctorProfile);
  const reloadedDoctor = await dataService.getDoctorProfile(doctorId);
  assert(reloadedDoctor?.fullName === 'Dr. Gregory Vance, PharmD, BCGP', 'Doctor full name updated');
  assert(reloadedDoctor?.professionalRole === 'Geriatric Specialist', 'Doctor professional role updated');
  assert(reloadedDoctor?.specialization === 'Complex Polypharmacy & Deprescribing', 'Specialization updated');
  assert(reloadedDoctor?.organization === 'Metro Health Academic Medical Center', 'Organization updated');

  // Test 6: Doctor disconnects / revokes patient access from clinician side
  // Create another patient to test doctor-initiated disconnect
  const patient2Id = 'test_patient_2_' + Date.now();
  const patient2Profile: PatientProfile = {
    userId: patient2Id,
    fullName: 'Arthur Pendelton',
    age: 72,
    gender: 'male',
    pregnancyStatus: 'not-applicable',
    allergies: [],
    chronicConditions: ['Heart Failure'],
    connectionCode: 'PT-ARTHUR-5521',
    emergencyContact: { name: 'Mary', relationship: 'Daughter', phone: '555-1234' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await dataService.savePatientProfile(patient2Profile);

  const req2 = await authorizationService.requestConnectionByCode(doctorId, 'PT-ARTHUR-5521');
  const rel2Id = req2.relationship!.id;
  await authorizationService.authorizeDoctor(rel2Id, patient2Id);

  const doctorAccessBeforeDisconnect = await authorizationService.canDoctorAccessPatient(doctorId, patient2Id);
  assert(doctorAccessBeforeDisconnect === true, 'Doctor initially has authorized access to patient 2');

  // Doctor disconnects patient
  const docDisconnectRes = await authorizationService.revokePatientAccessByDoctor(rel2Id, doctorId);
  assert(docDisconnectRes.success === true && docDisconnectRes.relationship?.status === 'REVOKED', 'Doctor successfully revoked/disconnected patient relationship');

  const doctorAccessAfterDisconnect = await authorizationService.canDoctorAccessPatient(doctorId, patient2Id);
  assert(doctorAccessAfterDisconnect === false, 'Doctor immediately loses access to patient 2 after clinician disconnect');

  // Test 7: Doctor cancels pending outgoing request
  const patient3Id = 'test_patient_3_' + Date.now();
  const patient3Profile: PatientProfile = {
    userId: patient3Id,
    fullName: 'Emma Watson',
    age: 31,
    gender: 'female',
    pregnancyStatus: 'not-applicable',
    allergies: [],
    chronicConditions: [],
    connectionCode: 'PT-EMMA-7712',
    emergencyContact: { name: 'John', relationship: 'Brother', phone: '555-5678' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await dataService.savePatientProfile(patient3Profile);

  const req3 = await authorizationService.requestConnectionByCode(doctorId, 'PT-EMMA-7712');
  const rel3Id = req3.relationship!.id;
  assert(req3.relationship?.status === 'PENDING', 'Request starts as PENDING');

  const cancelRes = await authorizationService.cancelPendingRequestByDoctor(rel3Id, doctorId);
  assert(cancelRes.success === true && cancelRes.relationship?.status === 'REVOKED', 'Doctor successfully canceled pending connection request');

  // ==========================================
  // ACCOUNT DELETION TESTS
  // ==========================================
  console.log('\n--- TEST SUITE 3: SAFE ACCOUNT DELETION ---');

  // Test 8: Patient account deletion wipes profile and updates relationships
  await dataService.deleteUserData(patientId, 'PATIENT');
  const deletedPatientProfile = await dataService.getPatientProfile(patientId);
  assert(deletedPatientProfile === null, 'Patient profile purged after account deletion');

  // Test 9: Doctor account deletion wipes profile and relationships
  await dataService.deleteUserData(doctorId, 'DOCTOR');
  const deletedDoctorProfile = await dataService.getDoctorProfile(doctorId);
  assert(deletedDoctorProfile === null, 'Doctor profile purged after account deletion');

  console.log(`\n================================`);
  console.log(`Settings Test Results: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSettingsTests();

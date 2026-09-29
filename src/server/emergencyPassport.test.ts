/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { emergencyPassportStore } from './emergencyPassportStore';
import { EmergencyPassportSummary } from '../models/passportTypes';

async function runTests() {
  console.log('🧪 Starting Emergency Medication Passport Access Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  const samplePassport: EmergencyPassportSummary = {
    patientId: 'test_patient_123',
    fullName: 'Jane Doe',
    age: 42,
    gender: 'female',
    weight: '65 kg',
    bloodType: null,
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    emergencyContact: {
      name: 'John Doe',
      relationship: 'Spouse',
      phone: '555-0199',
    },
    activeMedications: [
      {
        id: 'med_1',
        name: 'Metformin',
        genericName: 'Metformin HCl',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'twice daily',
        route: 'oral',
      },
      {
        id: 'med_2',
        name: 'Lisinopril',
        strength: '10 mg',
        dosage: '1 tablet',
        frequency: 'once daily',
        route: 'oral',
      },
    ],
    lastSafetyAnalysisDate: '2026-09-27T00:00:00.000Z',
    safetyScore: 88,
    safetyRating: 'Good',
    importantVerifiedFindings: [
      {
        id: 'f_1',
        title: 'Mild Antihypertensive Interaction',
        category: 'DRUG_DRUG',
        severity: 'low',
        involvedMedications: ['Metformin', 'Lisinopril'],
        explanation: 'Routine monitoring advised for blood pressure and glucose balance.',
        clinicalSignificance: 'Minimal clinical impact under standard therapeutic dosing.',
        sourceReference: 'Clinical Pharmacology Drug Interaction Compendium',
        recommendationNote: 'Periodic blood pressure and renal function monitoring.',
      },
    ],
    disclaimer: 'Informational clinical reference only.',
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  // Test 1: A newly generated QR link opens the correct passport.
  console.log('Test 1: Newly generated token stores and opens correct passport');
  const token1 = 'sec_token_valid_' + Date.now();
  emergencyPassportStore.createShare({
    token: token1,
    patientId: 'test_patient_123',
    patientName: 'Jane Doe',
    data: samplePassport,
    durationHours: 24,
    hasExplicitConsent: true,
  });

  const res1 = emergencyPassportStore.getByToken(token1);
  assert(res1.success === true, 'Lookup succeeds for valid token');
  assert(res1.status === 'ACTIVE', 'Token status is ACTIVE');
  assert(res1.data?.fullName === 'Jane Doe', 'Data contains correct patient name');
  assert(res1.data?.age === 42, 'Data contains correct patient age');
  assert(res1.data?.allergies.length === 2, 'Data contains consented allergies');
  assert(res1.data?.activeMedications.length === 2, 'Data contains consented medications');
  assert(res1.data?.importantVerifiedFindings.length === 1, 'Data contains verified safety findings');

  // Test 2: An invalid token is rejected.
  console.log('\nTest 2: Invalid / nonexistent token is rejected');
  const res2 = emergencyPassportStore.getByToken('invalid_random_token_9999');
  assert(res2.success === false, 'Invalid token returns success=false');
  assert(res2.status === 'NOT_FOUND', 'Invalid token returns status NOT_FOUND');
  assert(typeof res2.error === 'string' && res2.error.includes('invalid or could not be found'), 'Error message is clear and secure');

  // Test 3: An expired token is rejected.
  console.log('\nTest 3: Expired token is rejected');
  const expiredToken = 'sec_token_expired_' + Date.now();
  emergencyPassportStore.createShare({
    token: expiredToken,
    patientId: 'test_patient_expired',
    patientName: 'Bob Smith',
    data: samplePassport,
    durationHours: -1, // Expired 1 hour ago
    hasExplicitConsent: true,
  });
  const res3 = emergencyPassportStore.getByToken(expiredToken);
  assert(res3.success === false, 'Expired token returns success=false');
  assert(res3.status === 'EXPIRED', 'Expired token returns status EXPIRED');
  assert(typeof res3.error === 'string' && res3.error.includes('expired'), 'Error message indicates token expiration');

  // Test 4: A revoked token is rejected.
  console.log('\nTest 4: Revoked token is rejected');
  const tokenToRevoke = 'sec_token_revokable_' + Date.now();
  emergencyPassportStore.createShare({
    token: tokenToRevoke,
    patientId: 'test_patient_revoked',
    patientName: 'Alice Green',
    data: samplePassport,
    durationHours: 24,
    hasExplicitConsent: true,
  });
  // Revoke it
  emergencyPassportStore.revoke(tokenToRevoke);
  const res4 = emergencyPassportStore.getByToken(tokenToRevoke);
  assert(res4.success === false, 'Revoked token returns success=false');
  assert(res4.status === 'REVOKED', 'Revoked token returns status REVOKED');
  assert(typeof res4.error === 'string' && res4.error.includes('Access Revoked'), 'Error message states access is revoked');

  // Test 5: A valid token stops working after the patient revokes sharing.
  console.log('\nTest 5: Valid token stops working immediately after patient revocation');
  const tokenDynamic = 'sec_token_dynamic_' + Date.now();
  emergencyPassportStore.createShare({
    token: tokenDynamic,
    patientId: 'test_patient_dynamic',
    patientName: 'Charlie Brown',
    data: samplePassport,
    durationHours: 24,
    hasExplicitConsent: true,
  });
  const beforeRevoke = emergencyPassportStore.getByToken(tokenDynamic);
  assert(beforeRevoke.success === true && beforeRevoke.status === 'ACTIVE', 'Token works before revocation');
  // Patient revokes via patientId
  emergencyPassportStore.revoke(undefined, 'test_patient_dynamic');
  const afterRevoke = emergencyPassportStore.getByToken(tokenDynamic);
  assert(afterRevoke.success === false, 'Token fails immediately after patient revocation');
  assert(afterRevoke.status === 'REVOKED', 'Token status transitioned to REVOKED');

  // Test 6: The page displays only the fields the patient consented to share.
  console.log('\nTest 6: Fields validation - no simulated or unconsented records');
  assert(res1.data?.bloodType === null, 'Missing blood type remains null/unprovided (not inferred)');
  assert(!('simulatorScenario' in (res1.data as any)), 'Phase 5 What-If simulator temporary scenarios excluded');
  assert(Boolean(res1.data?.lastUpdated), 'Last updated date and time present');
  assert(Boolean(res1.data?.disclaimer), 'Prominent medical disclaimer present');

  // Test 7: HTTP API End-to-End Test against live port 3000
  console.log('\nTest 7: HTTP API End-to-End Integration on port 3000');
  try {
    const httpToken = 'http_test_token_' + Date.now();
    const createRes = await fetch('http://localhost:3000/api/passport/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: httpToken,
        patientId: 'http_patient',
        patientName: 'Jane Doe HTTP',
        data: samplePassport,
        durationHours: 12,
        hasExplicitConsent: true,
      }),
    });
    const createJson = await createRes.json();
    assert(createRes.status === 200 && createJson.success === true, 'HTTP POST /api/passport/share succeeds');

    const getRes = await fetch(`http://localhost:3000/api/passport/share/${httpToken}`);
    const getJson = await getRes.json();
    assert(getRes.status === 200 && getJson.success === true && getJson.data?.fullName === 'Jane Doe', 'HTTP GET /api/passport/share/:token succeeds with JSON');

    const revokeRes = await fetch('http://localhost:3000/api/passport/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: httpToken }),
    });
    const revokeJson = await revokeRes.json();
    assert(revokeRes.status === 200 && revokeJson.success === true, 'HTTP POST /api/passport/revoke succeeds');

    const getAfterRevoke = await fetch(`http://localhost:3000/api/passport/share/${httpToken}`);
    const getAfterRevokeJson = await getAfterRevoke.json();
    assert(getAfterRevoke.status === 403 && getAfterRevokeJson.status === 'REVOKED', 'HTTP GET after revoke returns 403 REVOKED');
  } catch (err: any) {
    console.error('HTTP test error:', err);
    assert(false, 'HTTP integration test encountered an error');
  }

  console.log(`\n================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

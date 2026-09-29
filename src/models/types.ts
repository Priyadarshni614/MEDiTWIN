/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// USER & AUTHENTICATION TYPES
// ==========================================

export type UserRole = 'PATIENT' | 'DOCTOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// User credentials record for authentication service
export interface StoredUserCredential {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string; // Cryptographic SHA-256 hash
  salt: string;         // Unique cryptographic salt
  createdAt: string;
}

// ==========================================
// USER PROFILES
// ==========================================

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export type PregnancyStatus =
  | 'not-applicable'
  | 'not-pregnant'
  | 'pregnant-first-trimester'
  | 'pregnant-second-trimester'
  | 'pregnant-third-trimester'
  | 'breastfeeding';

export interface PatientProfile {
  userId: string;
  fullName: string;
  age: number;
  gender: 'female' | 'male' | 'other' | 'prefer-not-to-say';
  weight?: string; // Optional (e.g., "70 kg")
  allergies: string[];
  chronicConditions: string[];
  pregnancyStatus: PregnancyStatus;
  emergencyContact: EmergencyContact;
  connectionCode: string; // Unique, persistent patient connection code (e.g. PT-ANGELIN-4821)
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfile {
  userId: string;
  fullName: string;
  email: string;
  professionalRole: string; // e.g. Clinical Pharmacist, Primary Care Physician
  specialization?: string;  // e.g. Geriatric Polypharmacy, Cardiology
  organization: string;     // e.g. City General Hospital, Community Health Clinic
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// DOCTOR-PATIENT RELATIONSHIP (PHASE 2)
// ==========================================

export type RelationshipStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

export interface DoctorPatientRelationship {
  id: string;
  doctorId: string;
  patientId: string;
  patientConnectionCode: string;
  status: RelationshipStatus;
  requestedBy: 'DOCTOR';
  createdAt: string;
  updatedAt: string;
  authorizedAt?: string;
  revokedAt?: string;
  // Normalized context metadata for fast rendering & historical audit
  doctorName: string;
  doctorRole: string;
  doctorSpecialization?: string;
  doctorOrganization: string;
  doctorEmail: string;
  patientName: string;
}

// ==========================================
// PHASE 3: MEDICATION & PRESCRIPTION MODELS
// ==========================================

export type MedicationSource = 'MANUAL' | 'PRESCRIPTION_OCR';

export interface Medication {
  id: string;
  patientId: string;
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
  source: MedicationSource;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type VerificationStatus = 'NOT_REVIEWED' | 'VERIFIED';
export type OCRConfidence = 'High' | 'Medium' | 'Low';

export interface ExtractedMedicationItem {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosage?: string;
  dosageUnit?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  purpose?: string;
  confidence?: OCRConfidence;
  isUnclear?: boolean;
  unclearReason?: string;
  selected: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  prescriptionDate?: string;
  doctorName?: string;
  clinicName?: string;
  patientName?: string;
  extractedMedications: ExtractedMedicationItem[];
  extractionStatus: ExtractionStatus;
  verificationStatus: VerificationStatus;
  errorMessage?: string;
  notes?: string;
}

export interface MedicationTwin {
  patientId: string;
  generatedAt: string;
  totalActiveMedications: number;
  totalHistoricalMedications: number;
  totalPrescriptions: number;
  activeMedications: Medication[];
  medicationHistory: Medication[];
  prescriptions: Prescription[];
}

export type RiskSeverity = 'low' | 'moderate' | 'high' | 'contraindicated';

export interface RiskAlert {
  id: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  mechanism?: string;
  recommendation: string;
  involvedMedications: string[];
}

export interface MedicationAnalysis {
  id: string;
  userId: string;
  analyzedAt: string;
  alerts: RiskAlert[];
  summary: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  generatedAt: string;
  type: 'clinical_summary' | 'medication_audit' | 'discharge_reconciliation';
  downloadUrl?: string;
}

export interface EmergencyPassport {
  userId: string;
  qrCodeIdentifier: string;
  bloodType?: string;
  criticalAllergies: string[];
  emergencyContacts: EmergencyContact[];
  currentActiveMedications: string[];
  lastUpdated: string;
}

// ==========================================
// ROUTING & APP NAVIGATION
// ==========================================

export type AppRoute =
  | 'landing'
  | 'login'
  | 'signup'
  | 'patient-onboarding'
  | 'doctor-onboarding'
  | 'patient-dashboard'
  | 'patient-profile'
  | 'patient-care-team'
  | 'patient-medications'
  | 'patient-twin'
  | 'patient-scanner'
  | 'patient-analysis'
  | 'patient-simulator'
  | 'patient-reports'
  | 'patient-passport'
  | 'patient-settings'
  | 'doctor-dashboard'
  | 'doctor-connect'
  | 'doctor-patients'
  | 'doctor-patient-detail'
  | 'doctor-requests'
  | 'doctor-analysis'
  | 'doctor-simulator'
  | 'doctor-reports'
  | 'doctor-profile'
  | 'doctor-settings'
  | 'access-denied';

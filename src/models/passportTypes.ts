/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmergencyContact } from './types';
import { VerifiedSeverity } from './safetyTypes';

export interface PassportMedicationItem {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosage: string;
  frequency: string;
  route: string;
  duration?: string;
  prescribedBy?: string;
  purpose?: string;
  source?: string;
}

export interface PassportVerifiedFinding {
  id: string;
  title: string;
  category: string;
  severity?: VerifiedSeverity;
  involvedMedications: string[];
  explanation: string;
  clinicalSignificance: string;
  sourceReference: string;
  recommendationNote: string;
}

export interface EmergencyPassportSummary {
  patientId: string;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  weight: string | null;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: EmergencyContact | null;
  activeMedications: PassportMedicationItem[];
  lastSafetyAnalysisDate: string | null;
  safetyScore: number | null;
  safetyRating: string | null;
  importantVerifiedFindings: PassportVerifiedFinding[];
  disclaimer: string;
  generatedAt: string;
  lastUpdated: string;
}

export interface EmergencyPassportShare {
  token: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  data: EmergencyPassportSummary;
  qrDataUrl?: string;
}

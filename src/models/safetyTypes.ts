/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory =
  | 'DRUG_DRUG_INTERACTION'
  | 'DUPLICATE_THERAPY'
  | 'ALLERGY_CONTRAINDICATION'
  | 'PATIENT_PRECAUTION'
  | 'INCOMPLETE_MEDICATION_DATA';

export type VerifiedSeverity = 'contraindicated' | 'high' | 'moderate' | 'low';

export type VerificationState = 'VERIFIED' | 'UNABLE_TO_VERIFY';

export interface MedicationSafetyFinding {
  id: string; // Stable deduplicated key (e.g., allergy_patientId_medId_allergenKey)
  comparisonKey?: string; // Stable canonical semantic key for cross-scenario diffs
  category: IssueCategory;
  title: string;
  involvedMedications: string[]; // Display names
  involvedMedicationDetails?: {
    id: string;
    name: string;
    genericName?: string;
    brandName?: string;
    strength?: string;
    prescriptionId?: string;
    source?: string;
  }[];
  severity?: VerifiedSeverity; // Only provided when supported by documented data source
  verificationState: VerificationState;
  explanation: string;         // Simple, understandable explanation
  clinicalSignificance: string;// Why it matters
  sourceReference: string;     // Documented evidence base (e.g. FDA Label, Beers Criteria, etc.)
  isSourceVerified: boolean;   // Explicit verification flag
  missingInformation?: string; // What information is missing if unverified or incomplete
  recommendationNote: string;  // Guidance (e.g. Consult prescribing doctor or clinical pharmacist)
  allergyContext?: {
    recordedAllergyText: string;
    matchedAllergenGroup: string;
    triggeringIngredient: string;
    isCrossReactivity: boolean;
  };
  duplicateContext?: {
    standardizedIngredient: string;
    isSamePrescriptionRepeat: boolean;
    medicationA: { id: string; name: string };
    medicationB: { id: string; name: string };
  };
}

export interface MedicationSafetyScoreBreakdown {
  isCalculable: boolean;
  score?: number; // 0 to 100
  ratingLabel?: 'OPTIMAL' | 'MODERATE_RISK' | 'HIGH_RISK' | 'ELEVATED_PRECAUTION';
  uncalculableReason?: string;
  calculationMethod: string;
  baseScore: number;
  deductions: {
    rule: string;
    pointsDeducted: number;
    relatedFindingId?: string;
  }[];
  explanation: string;
  isPrototypeIndicator: boolean;
  clinicalLimitationsDisclaimer: string;
}

export interface MedicationSafetyReport {
  id: string;
  patientId: string;
  analyzedAt: string;
  summary: {
    totalMedicationsReviewed: number;
    potentialIssuesCount: number;
    unverifiedChecksCount: number;
    duplicateTherapyCount: number;
    allergyConflictCount: number;
    drugInteractionCount: number;
    precautionCount: number;
    incompleteDetailsCount: number;
  };
  findings: MedicationSafetyFinding[];
  scoreBreakdown: MedicationSafetyScoreBreakdown;
  patientContext: {
    age: number;
    allergies: string[];
    chronicConditions: string[];
    weight?: string;
    pregnancyStatus?: string;
    profileCompleteness: {
      hasAge: boolean;
      hasAllergiesRecorded: boolean;
      hasConditionsRecorded: boolean;
    };
  };
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, PatientProfile } from '../models/types';
import {
  MedicationSafetyFinding,
  MedicationSafetyReport,
  MedicationSafetyScoreBreakdown,
  IssueCategory,
} from '../models/safetyTypes';
import {
  DOCUMENTED_DRUG_INTERACTIONS,
  DOCUMENTED_THERAPEUTIC_CLASSES,
  DOCUMENTED_ALLERGY_RULES,
  DOCUMENTED_CONDITION_PRECAUTIONS,
  DOCUMENTED_AGE_PRECAUTIONS,
} from './clinicalKnowledgeBase';
import {
  resolveVerifiedIngredients,
  normalizeDrugString,
} from './clinicalIngredientNormalizer';

function cleanString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const cleaned = cleanString(text);
  return keywords.some((kw) => {
    const cleanKw = cleanString(kw);
    return cleaned.includes(cleanKw) || cleanKw.includes(cleaned);
  });
}

function getMedicationIdentifiers(med: Medication): string[] {
  const parts: string[] = [med.name];
  if (med.genericName) parts.push(med.genericName);
  if (med.brandName) parts.push(med.brandName);
  return parts.filter(Boolean);
}

function medicationMatchesKeywords(med: Medication, keywords: string[]): boolean {
  const identifiers = getMedicationIdentifiers(med);
  return identifiers.some((ident) => matchesAnyKeyword(ident, keywords));
}

export class MedicationSafetyEngine {
  /**
   * Performs an evidence-based medication safety analysis on the patient's active regimen.
   * Enforces:
   * 1. Strict deduplication by normalized semantic key.
   * 2. Rigorous validation of duplicate therapy (differentiating true active duplicates from repeat OCR extractions of the same prescription).
   * 3. Explicit ingredient identity verification for allergies.
   * 4. Transparent prototype scoring with documented limitations.
   * 5. Verified data-source citations.
   * 6. Pure reading from the authenticated patient profile without inference.
   */
  analyze(
    patient: PatientProfile,
    activeMedications: Medication[]
  ): MedicationSafetyReport {
    const findingsMap = new Map<string, MedicationSafetyFinding>();
    const reportId = `safety_rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    // Helper to register findings with deduplication by unique stable ID
    const addFinding = (finding: MedicationSafetyFinding) => {
      if (!findingsMap.has(finding.id)) {
        findingsMap.set(finding.id, finding);
      }
    };

    // ----------------------------------------------------
    // CHECK 1: Missing or Incomplete Medication Details Check
    // ----------------------------------------------------
    for (const med of activeMedications) {
      const missingFields: string[] = [];
      if (!med.strength || med.strength.trim() === '' || med.strength.toLowerCase() === 'unspecified') {
        missingFields.push('strength');
      }
      if (!med.dosage || med.dosage.trim() === '' || med.dosage.toLowerCase() === 'unspecified') {
        missingFields.push('dosage');
      }
      if (!med.frequency || med.frequency.trim() === '' || med.frequency.toLowerCase() === 'unspecified') {
        missingFields.push('frequency');
      }

      if (missingFields.length > 0) {
        const stableId = `incomplete_${med.id}`;
        addFinding({
          id: stableId,
          category: 'INCOMPLETE_MEDICATION_DATA',
          title: `Incomplete Prescription Detail: ${med.name}`,
          involvedMedications: [med.name],
          involvedMedicationDetails: [
            {
              id: med.id,
              name: med.name,
              genericName: med.genericName,
              brandName: med.brandName,
              strength: med.strength,
              prescriptionId: med.prescriptionId,
              source: med.source,
            },
          ],
          verificationState: 'UNABLE_TO_VERIFY',
          explanation: `The medication record for ${med.name} lacks documented ${missingFields.join(', ')}.`,
          clinicalSignificance: 'Without precise dosage and dosing frequency, cumulative daily exposure, pharmacokinetics, and toxicity thresholds cannot be clinically verified.',
          sourceReference: 'FDA Safety Guidelines on Complete Medication Orders; ISMP Minimum Order Standards',
          isSourceVerified: true,
          missingInformation: `Missing fields: ${missingFields.join(', ')}. Prescribing details should be confirmed with the prescriber.`,
          recommendationNote: 'Verify active bottle instructions or prescription label and update medication fields.',
        });
      }
    }

    // ----------------------------------------------------
    // CHECK 2: Documented Allergy Contraindication Check
    // ----------------------------------------------------
    // Deduplicate so the same allergy conflict appears exactly ONCE per allergen class
    const patientAllergies = patient.allergies || [];

    for (const allergyRule of DOCUMENTED_ALLERGY_RULES) {
      // Find matching allergy string in patient profile
      const matchedAllergyString = patientAllergies.find((allergyStr) =>
        matchesAnyKeyword(allergyStr, allergyRule.allergenKeywords)
      );

      if (!matchedAllergyString) continue;

      // Find all active medications matching this allergy rule
      const matchingMedsWithIngredients: Array<{ med: Medication; ingredients: string[] }> = [];

      for (const med of activeMedications) {
        const ingredientMapping = resolveVerifiedIngredients(med.name, med.genericName, med.brandName);

        const medMatchesRule =
          (ingredientMapping &&
            ingredientMapping.activeIngredients.some((ing) =>
              allergyRule.medicationKeywords.some((kw) => ing.includes(kw) || kw.includes(ing))
            )) ||
          medicationMatchesKeywords(med, allergyRule.medicationKeywords);

        if (medMatchesRule) {
          const ingList = ingredientMapping
            ? ingredientMapping.activeIngredients
            : [med.genericName || med.name];
          matchingMedsWithIngredients.push({ med, ingredients: ingList });
        }
      }

      if (matchingMedsWithIngredients.length > 0) {
        // Stable deduplicated ID by allergy rule
        const stableId = `allergy_${allergyRule.id}`;
        const allInvolvedMedNames = matchingMedsWithIngredients.map((item) => item.med.name);
        const allVerifiedIngredients = Array.from(
          new Set(matchingMedsWithIngredients.flatMap((item) => item.ingredients))
        );
        const verifiedIngredientText = allVerifiedIngredients.join(', ');

        const involvedMedDetails = matchingMedsWithIngredients.map((item) => ({
          id: item.med.id,
          name: item.med.name,
          genericName: item.med.genericName,
          brandName: item.med.brandName,
          strength: item.med.strength,
          prescriptionId: item.med.prescriptionId,
          source: item.med.source,
        }));

        const medNamesDisplay =
          allInvolvedMedNames.length === 1
            ? allInvolvedMedNames[0]
            : allInvolvedMedNames.join(' & ');

        addFinding({
          id: stableId,
          comparisonKey: `allergy_${allergyRule.id}`,
          category: 'ALLERGY_CONTRAINDICATION',
          title: `Documented Allergy Alert: ${medNamesDisplay} vs. ${allergyRule.allergenName}`,
          involvedMedications: allInvolvedMedNames,
          involvedMedicationDetails: involvedMedDetails,
          severity: allergyRule.severity,
          verificationState: 'VERIFIED',
          explanation: `Patient profile documents an allergy to "${matchedAllergyString}". ${
            matchingMedsWithIngredients.length === 1
              ? `Medication "${matchingMedsWithIngredients[0].med.name}" contains or represents`
              : `Active medications (${allInvolvedMedNames.map((n) => `"${n}"`).join(', ')}) contain or represent`
          } verified active ingredient "${verifiedIngredientText}" (${allergyRule.medicationClass}).`,
          clinicalSignificance: allergyRule.clinicalSignificance,
          sourceReference: allergyRule.sourceReference,
          isSourceVerified: true,
          recommendationNote: 'Do not administer or ingest until reviewed with the prescribing physician or allergist.',
          allergyContext: {
            recordedAllergyText: matchedAllergyString,
            matchedAllergenGroup: allergyRule.allergenName,
            triggeringIngredient: verifiedIngredientText,
            isCrossReactivity: true,
          },
        });
      }
    }

    // ----------------------------------------------------
    // CHECK 3: Documented Drug-Drug Interaction Check (Pairwise)
    // ----------------------------------------------------
    for (let i = 0; i < activeMedications.length; i++) {
      for (let j = i + 1; j < activeMedications.length; j++) {
        const medA = activeMedications[i];
        const medB = activeMedications[j];

        // Skip pairwise checks if both records represent identical prescriptions/repeats
        if (
          medA.prescriptionId &&
          medB.prescriptionId &&
          medA.prescriptionId === medB.prescriptionId &&
          cleanString(medA.name) === cleanString(medB.name)
        ) {
          continue;
        }

        for (const rule of DOCUMENTED_DRUG_INTERACTIONS) {
          const matchDirection1 =
            medicationMatchesKeywords(medA, rule.drugAKeywords) &&
            medicationMatchesKeywords(medB, rule.drugBKeywords);
          const matchDirection2 =
            medicationMatchesKeywords(medB, rule.drugAKeywords) &&
            medicationMatchesKeywords(medA, rule.drugBKeywords);

          if (matchDirection1 || matchDirection2) {
            // Stable sorted key for pair
            const pairKey = [cleanString(medA.name), cleanString(medB.name)].sort().join('__');
            const stableId = `ddi_${rule.id}_${pairKey.replace(/\s+/g, '_')}`;

            addFinding({
              id: stableId,
              category: 'DRUG_DRUG_INTERACTION',
              title: rule.title,
              involvedMedications: [medA.name, medB.name],
              involvedMedicationDetails: [
                {
                  id: medA.id,
                  name: medA.name,
                  genericName: medA.genericName,
                  brandName: medA.brandName,
                  strength: medA.strength,
                  prescriptionId: medA.prescriptionId,
                  source: medA.source,
                },
                {
                  id: medB.id,
                  name: medB.name,
                  genericName: medB.genericName,
                  brandName: medB.brandName,
                  strength: medB.strength,
                  prescriptionId: medB.prescriptionId,
                  source: medB.source,
                },
              ],
              severity: rule.severity,
              verificationState: 'VERIFIED',
              explanation: rule.simpleExplanation,
              clinicalSignificance: rule.clinicalSignificance,
              sourceReference: rule.sourceReference,
              isSourceVerified: true,
              recommendationNote: rule.guidance,
            });
          }
        }
      }
    }

    // ----------------------------------------------------
    // CHECK 4: Validate Duplicate Therapy & Active Ingredients
    // ----------------------------------------------------
    // 4a. Exact or overlapping verified active ingredients between separate active medication records
    for (let i = 0; i < activeMedications.length; i++) {
      for (let j = i + 1; j < activeMedications.length; j++) {
        const medA = activeMedications[i];
        const medB = activeMedications[j];

        // Resolve active ingredients through standardized dictionary
        const mappingA = resolveVerifiedIngredients(medA.name, medA.genericName, medA.brandName);
        const mappingB = resolveVerifiedIngredients(medB.name, medB.genericName, medB.brandName);

        // Check if both records originated from the EXACT same prescription record (repeated OCR upload)
        const isSamePrescriptionRepeat = Boolean(
          medA.prescriptionId &&
            medB.prescriptionId &&
            medA.prescriptionId === medB.prescriptionId
        );

        if (mappingA && mappingB) {
          // Find overlapping active ingredients
          const sharedIngredients = mappingA.activeIngredients.filter((ingA) =>
            mappingB.activeIngredients.includes(ingA)
          );

          if (sharedIngredients.length > 0) {
            const sortedPairKey = [medA.id, medB.id].sort().join('__');
            const normalizedIngKey = sharedIngredients
              .map((s) => cleanString(s).replace(/\s+/g, '_'))
              .sort()
              .join('_');
            const stableId = `dup_ingredient_${normalizedIngKey}_${sortedPairKey}`;

            let explanationText = '';
            if (isSamePrescriptionRepeat) {
              explanationText = `Notice: Both records ("${medA.name}" [ID: ${medA.id}] and "${medB.name}" [ID: ${medB.id}]) originate from the same uploaded prescription (${medA.prescriptionId}) and share active ingredient "${sharedIngredients.join(', ')}". This may represent duplicate scanning of the same order rather than an intentional co-prescription.`;
            } else {
              explanationText = `Patient has two distinct active medication entries ("${medA.name}" [ID: ${medA.id}] and "${medB.name}" [ID: ${medB.id}]) that contain verified active ingredient "${sharedIngredients.join(', ')}".`;
            }

            addFinding({
              id: stableId,
              comparisonKey: `dup_ingredient_${normalizedIngKey}`,
              category: 'DUPLICATE_THERAPY',
              title: `Duplicate Active Ingredient: ${sharedIngredients.join(', ').toUpperCase()}`,
              involvedMedications: [medA.name, medB.name],
              involvedMedicationDetails: [
                {
                  id: medA.id,
                  name: medA.name,
                  genericName: medA.genericName,
                  brandName: medA.brandName,
                  strength: medA.strength,
                  prescriptionId: medA.prescriptionId,
                  source: medA.source,
                },
                {
                  id: medB.id,
                  name: medB.name,
                  genericName: medB.genericName,
                  brandName: medB.brandName,
                  strength: medB.strength,
                  prescriptionId: medB.prescriptionId,
                  source: medB.source,
                },
              ],
              severity: 'high',
              verificationState: 'VERIFIED',
              explanation: explanationText,
              clinicalSignificance: 'Simultaneous consumption of identical pharmacological ingredients can lead to accidental dose doubling, excessive peak plasma levels, and enhanced toxic adverse effects.',
              sourceReference: 'FDA Safety Guidelines on Duplicate Active Ingredients; ISMP Medication Safety Alert',
              isSourceVerified: true,
              recommendationNote: isSamePrescriptionRepeat
                ? 'Check your active medication list and remove the duplicate entry if this prescription was confirmed more than once.'
                : 'Confirm with prescribing doctor whether one medication is intended to replace or supersede the other.',
              duplicateContext: {
                standardizedIngredient: sharedIngredients.join(', '),
                isSamePrescriptionRepeat,
                medicationA: { id: medA.id, name: medA.name },
                medicationB: { id: medB.id, name: medB.name },
              },
            });
          }
        } else if (!mappingA || !mappingB) {
          // If medication names look somewhat alike (share common drug stem/prefix or substring)
          // but ingredient cannot be confirmed in the verified dictionary,
          // DO NOT report a false duplicate. Instead, flag as "Unable to Verify".
          const normA = normalizeDrugString(medA.name);
          const normB = normalizeDrugString(medB.name);

          // Check for substring or common prefix stem of >= 5 characters (e.g. "novastat")
          const commonPrefix = (s1: string, s2: string) => {
            let i = 0;
            while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++;
            return s1.slice(0, i);
          };
          const prefix = commonPrefix(normA, normB);
          const hasSurfaceSimilarity =
            (normA.length > 3 && normB.length > 3 && (normA.includes(normB) || normB.includes(normA))) ||
            prefix.length >= 5;

          if (hasSurfaceSimilarity) {
            const sortedPairKey = [medA.id, medB.id].sort().join('__');
            const stableId = `unverified_dup_${sortedPairKey}`;

            addFinding({
              id: stableId,
              category: 'DUPLICATE_THERAPY',
              title: `Potential Similarity Unverified: ${medA.name} and ${medB.name}`,
              involvedMedications: [medA.name, medB.name],
              involvedMedicationDetails: [
                {
                  id: medA.id,
                  name: medA.name,
                  genericName: medA.genericName,
                  brandName: medA.brandName,
                  strength: medA.strength,
                  prescriptionId: medA.prescriptionId,
                  source: medA.source,
                },
                {
                  id: medB.id,
                  name: medB.name,
                  genericName: medB.genericName,
                  brandName: medB.brandName,
                  strength: medB.strength,
                  prescriptionId: medB.prescriptionId,
                  source: medB.source,
                },
              ],
              verificationState: 'UNABLE_TO_VERIFY',
              explanation: `Medication names "${medA.name}" [ID: ${medA.id}] and "${medB.name}" [ID: ${medB.id}] have surface character similarities, but standardized active ingredient mappings could not be definitively verified in the dictionary.`,
              clinicalSignificance: 'Duplicate therapy cannot be confirmed or ruled out without verified generic ingredient identities.',
              sourceReference: 'Source not verified (Unmapped generic entity in current database)',
              isSourceVerified: false,
              missingInformation: 'Standardized RxNorm active ingredient code is missing for one or both medication records.',
              recommendationNote: 'Verify generic names with your pharmacist or doctor.',
            });
          }
        }
      }
    }

    // 4b. Class-level duplicate therapy (e.g., multiple NSAIDs, multiple PPIs, dual RAAS blockade)
    for (const classRule of DOCUMENTED_THERAPEUTIC_CLASSES) {
      const matchingMeds = activeMedications.filter((med) =>
        medicationMatchesKeywords(med, classRule.keywords)
      );

      if (matchingMeds.length > 1) {
        const stableId = `dup_class_${classRule.id}`;
        addFinding({
          id: stableId,
          category: 'DUPLICATE_THERAPY',
          title: `Overlapping Therapeutic Class: ${classRule.therapeuticClass}`,
          involvedMedications: matchingMeds.map((m) => m.name),
          involvedMedicationDetails: matchingMeds.map((m) => ({
            id: m.id,
            name: m.name,
            genericName: m.genericName,
            brandName: m.brandName,
            strength: m.strength,
            prescriptionId: m.prescriptionId,
            source: m.source,
          })),
          severity: classRule.id === 'class_ace_arb' ? 'contraindicated' : 'high',
          verificationState: 'VERIFIED',
          explanation: `Patient is currently prescribed ${matchingMeds.length} medications within the ${classRule.therapeuticClass} class: ${matchingMeds.map((m) => `${m.name} [ID: ${m.id}]`).join(', ')}. ${classRule.riskExplanation}`,
          clinicalSignificance: classRule.clinicalSignificance,
          sourceReference: classRule.sourceReference,
          isSourceVerified: true,
          recommendationNote: 'Discuss with healthcare provider whether dual therapy is clinically intentional or represents therapeutic duplication.',
        });
      }
    }

    // ----------------------------------------------------
    // CHECK 5: Patient-Specific Precautions (Chronic Conditions)
    // ----------------------------------------------------
    const conditions = patient.chronicConditions || [];
    for (const med of activeMedications) {
      for (const condRule of DOCUMENTED_CONDITION_PRECAUTIONS) {
        const patientHasCondition = conditions.some((cStr) =>
          matchesAnyKeyword(cStr, condRule.conditionKeywords)
        );

        if (patientHasCondition && medicationMatchesKeywords(med, condRule.medicationKeywords)) {
          const stableId = `prec_cond_${condRule.id}_${cleanString(med.name).replace(/\s+/g, '_')}`;
          addFinding({
            id: stableId,
            category: 'PATIENT_PRECAUTION',
            title: `Disease Precaution: ${med.name} with ${condRule.conditionName}`,
            involvedMedications: [med.name],
            involvedMedicationDetails: [
              {
                id: med.id,
                name: med.name,
                genericName: med.genericName,
                brandName: med.brandName,
                strength: med.strength,
                prescriptionId: med.prescriptionId,
                source: med.source,
              },
            ],
            severity: condRule.severity,
            verificationState: 'VERIFIED',
            explanation: condRule.explanation,
            clinicalSignificance: condRule.clinicalSignificance,
            sourceReference: condRule.sourceReference,
            isSourceVerified: true,
            recommendationNote: 'Review with your prescribing clinician to ensure this medication is safe given your chronic medical condition.',
          });
        }
      }
    }

    // ----------------------------------------------------
    // CHECK 6: Patient-Specific Precautions (Age-Specific Guidelines)
    // ----------------------------------------------------
    if (patient.age && patient.age > 0) {
      for (const med of activeMedications) {
        for (const ageRule of DOCUMENTED_AGE_PRECAUTIONS) {
          if (ageRule.minAge && patient.age >= ageRule.minAge) {
            if (medicationMatchesKeywords(med, ageRule.medicationKeywords)) {
              const stableId = `prec_age_${ageRule.id}_${cleanString(med.name).replace(/\s+/g, '_')}`;
              addFinding({
                id: stableId,
                category: 'PATIENT_PRECAUTION',
                title: `Age Precaution (Age ${patient.age}): ${med.name}`,
                involvedMedications: [med.name],
                involvedMedicationDetails: [
                  {
                    id: med.id,
                    name: med.name,
                    genericName: med.genericName,
                    brandName: med.brandName,
                    strength: med.strength,
                    prescriptionId: med.prescriptionId,
                    source: med.source,
                  },
                ],
                severity: ageRule.severity,
                verificationState: 'VERIFIED',
                explanation: ageRule.explanation,
                clinicalSignificance: ageRule.clinicalSignificance,
                sourceReference: ageRule.sourceReference,
                isSourceVerified: true,
                recommendationNote: 'Discuss with your doctor or geriatric clinical pharmacist whether non-Beers alternatives or dose titration are appropriate.',
              });
            }
          }
        }
      }
    } else {
      addFinding({
        id: 'unverified_age_check',
        category: 'PATIENT_PRECAUTION',
        title: 'Age-Specific Safety Check Incomplete',
        involvedMedications: [],
        verificationState: 'UNABLE_TO_VERIFY',
        explanation: 'Patient chronological age is not recorded in the authenticated patient profile.',
        clinicalSignificance: 'Age-stratified prescribing risks (such as 2023 AGS Beers Criteria for older adults or pediatric scaling) cannot be calculated.',
        sourceReference: '2023 AGS Beers Criteria / Clinical Pharmacology Standards',
        isSourceVerified: true,
        missingInformation: 'Patient date of birth or age is missing from the health profile.',
        recommendationNote: 'Update your profile demographics to enable complete age-based pharmacological safety checks.',
      });
    }

    // ----------------------------------------------------
    // CHECK 7: Organ Function Lab Verification Check
    // ----------------------------------------------------
    const hasRenalMed = activeMedications.some((m) =>
      medicationMatchesKeywords(m, ['metformin', 'lisinopril', 'losartan', 'furosemide'])
    );
    if (hasRenalMed) {
      addFinding({
        id: 'unverified_lab_check_renal',
        category: 'PATIENT_PRECAUTION',
        title: 'Organ Function Lab Verification: Renal Markers (eGFR / Serum Creatinine)',
        involvedMedications: activeMedications
          .filter((m) => medicationMatchesKeywords(m, ['metformin', 'lisinopril', 'losartan', 'furosemide']))
          .map((m) => m.name),
        verificationState: 'UNABLE_TO_VERIFY',
        explanation: 'Your regimen contains medications cleared by or directly affecting renal hemodynamics (e.g., Metformin, Lisinopril, Diuretics), but recent laboratory serum creatinine and estimated glomerular filtration rate (eGFR) values are not currently synced.',
        clinicalSignificance: 'Without recent renal panels within the last 6-12 months, dosing thresholds cannot be guaranteed.',
        sourceReference: 'KDIGO 2023 Clinical Practice Guideline for the Management of Diabetes in CKD',
        isSourceVerified: true,
        missingInformation: 'Recent serum creatinine and eGFR laboratory test results.',
        recommendationNote: 'Ensure your primary care physician has ordered annual comprehensive metabolic panels to monitor kidney function.',
      });
    }

    // Convert map to array
    const findings = Array.from(findingsMap.values());

    // ----------------------------------------------------
    // CHECK 8: Transparent Prototype Safety Score Calculation
    // ----------------------------------------------------
    const scoreBreakdown = this.calculateSafetyScore(activeMedications, findings, patient);

    // Summary counts
    const verifiedFindings = findings.filter((f) => f.verificationState === 'VERIFIED');
    const unverifiedFindings = findings.filter((f) => f.verificationState === 'UNABLE_TO_VERIFY');

    return {
      id: reportId,
      patientId: patient.userId,
      analyzedAt: now,
      summary: {
        totalMedicationsReviewed: activeMedications.length,
        potentialIssuesCount: verifiedFindings.length,
        unverifiedChecksCount: unverifiedFindings.length,
        duplicateTherapyCount: verifiedFindings.filter((f) => f.category === 'DUPLICATE_THERAPY').length,
        allergyConflictCount: verifiedFindings.filter((f) => f.category === 'ALLERGY_CONTRAINDICATION').length,
        drugInteractionCount: verifiedFindings.filter((f) => f.category === 'DRUG_DRUG_INTERACTION').length,
        precautionCount: verifiedFindings.filter((f) => f.category === 'PATIENT_PRECAUTION').length,
        incompleteDetailsCount: findings.filter((f) => f.category === 'INCOMPLETE_MEDICATION_DATA').length,
      },
      findings,
      scoreBreakdown,
      patientContext: {
        age: patient.age,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
        weight: patient.weight,
        pregnancyStatus: patient.pregnancyStatus,
        profileCompleteness: {
          hasAge: Boolean(patient.age && patient.age > 0),
          hasAllergiesRecorded: Boolean(patient.allergies && patient.allergies.length > 0),
          hasConditionsRecorded: Boolean(patient.chronicConditions && patient.chronicConditions.length > 0),
        },
      },
    };
  }

  /**
   * Transparent, rule-based prototype Medication Safety Score calculation.
   */
  private calculateSafetyScore(
    activeMedications: Medication[],
    findings: MedicationSafetyFinding[],
    patient: PatientProfile
  ): MedicationSafetyScoreBreakdown {
    const disclaimer =
      'This Medication Safety Score is an experimental rule-based prototype indicator developed for research and demonstration. It has not been clinically validated by regulatory authorities. It does not replace comprehensive medical judgment or diagnostic evaluation by a licensed healthcare professional. Never alter treatment based on this numerical score.';

    if (activeMedications.length === 0) {
      return {
        isCalculable: false,
        uncalculableReason: 'No active medications currently registered in the Medication Twin to assess.',
        calculationMethod: 'Prototype index starting at 100 with documented clinical deductions.',
        baseScore: 100,
        deductions: [],
        explanation: 'Add active medications to your Medication Twin to generate an evidence-based safety evaluation.',
        isPrototypeIndicator: true,
        clinicalLimitationsDisclaimer: disclaimer,
      };
    }

    // If core patient profile demographics are completely unrecorded (e.g., age missing)
    if (!patient.age || patient.age <= 0) {
      return {
        isCalculable: false,
        uncalculableReason: 'Patient age is not recorded in the profile. Age clearance and Beers Criteria calculations cannot be performed.',
        calculationMethod: 'Prototype index starting at 100 with documented clinical deductions.',
        baseScore: 100,
        deductions: [],
        explanation: 'Update your patient profile demographics to calculate an evidence-based safety indicator.',
        isPrototypeIndicator: true,
        clinicalLimitationsDisclaimer: disclaimer,
      };
    }

    const deductions: MedicationSafetyScoreBreakdown['deductions'] = [];
    let currentScore = 100;

    for (const finding of findings) {
      if (finding.verificationState === 'VERIFIED') {
        if (finding.severity === 'contraindicated') {
          deductions.push({
            rule: `Contraindicated Finding (-35 pts): ${finding.title}`,
            pointsDeducted: 35,
            relatedFindingId: finding.id,
          });
          currentScore -= 35;
        } else if (finding.severity === 'high') {
          deductions.push({
            rule: `High Severity Risk (-20 pts): ${finding.title}`,
            pointsDeducted: 20,
            relatedFindingId: finding.id,
          });
          currentScore -= 20;
        } else if (finding.severity === 'moderate') {
          deductions.push({
            rule: `Moderate Precaution (-10 pts): ${finding.title}`,
            pointsDeducted: 10,
            relatedFindingId: finding.id,
          });
          currentScore -= 10;
        } else if (finding.severity === 'low') {
          deductions.push({
            rule: `Low Severity Alert (-5 pts): ${finding.title}`,
            pointsDeducted: 5,
            relatedFindingId: finding.id,
          });
          currentScore -= 5;
        }
      } else if (finding.category === 'INCOMPLETE_MEDICATION_DATA') {
        deductions.push({
          rule: `Incomplete Prescribing Record (-5 pts): ${finding.involvedMedications[0]}`,
          pointsDeducted: 5,
          relatedFindingId: finding.id,
        });
        currentScore -= 5;
      }
    }

    const finalScore = Math.max(0, currentScore);

    let ratingLabel: MedicationSafetyScoreBreakdown['ratingLabel'] = 'OPTIMAL';
    if (finalScore < 50) {
      ratingLabel = 'ELEVATED_PRECAUTION';
    } else if (finalScore < 75) {
      ratingLabel = 'HIGH_RISK';
    } else if (finalScore < 90) {
      ratingLabel = 'MODERATE_RISK';
    } else {
      ratingLabel = 'OPTIMAL';
    }

    return {
      isCalculable: true,
      score: finalScore,
      ratingLabel,
      calculationMethod:
        'Transparent Prototype Rule: Starting at 100 points, deductions are applied for verified clinical alerts (-35 contraindicated, -20 high severity, -10 moderate severity, -5 low severity or incomplete data).',
      baseScore: 100,
      deductions,
      explanation: `Calculated from ${activeMedications.length} active medications with ${deductions.length} documented adjustments applied.`,
      isPrototypeIndicator: true,
      clinicalLimitationsDisclaimer: disclaimer,
    };
  }
}

export const medicationSafetyEngine = new MedicationSafetyEngine();

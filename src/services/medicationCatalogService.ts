/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CatalogMedication {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  commonStrengths: string[];
  defaultStrength: string;
  defaultDosage: string;
  defaultDosageUnit: string;
  commonFrequencies: string[];
  defaultFrequency: string;
  commonRoutes: string[];
  defaultRoute: string;
  commonPurposes: string[];
  defaultPurpose: string;
  category: string;
}

/**
 * Prototype Medication Knowledge Dataset for MEDiTWIN AI.
 *
 * Structured as a dedicated service layer ready to connect to
 * external RxNorm / OpenFDA REST APIs in production.
 *
 * Provides real clinical medication catalog terms without hallucinating
 * or inventing medication identities.
 */
export const PROTOTYPE_MEDICATION_CATALOG: CatalogMedication[] = [
  {
    id: 'med_metformin',
    name: 'Metformin Hydrochloride',
    genericName: 'Metformin',
    brandName: 'Glucophage',
    commonStrengths: ['500 mg', '850 mg', '1000 mg', '500 mg ER', '750 mg ER'],
    defaultStrength: '500 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Twice daily with meals', 'Once daily with evening meal', 'Three times daily with meals'],
    defaultFrequency: 'Twice daily with meals',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Type 2 Diabetes Mellitus glycemic control', 'Insulin resistance management'],
    defaultPurpose: 'Type 2 Diabetes Mellitus glycemic control',
    category: 'Antidiabetic (Biguanide)',
  },
  {
    id: 'med_lisinopril',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandName: 'Zestril / Prinivil',
    commonStrengths: ['5 mg', '10 mg', '20 mg', '40 mg'],
    defaultStrength: '10 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily in the morning', 'Once daily at bedtime'],
    defaultFrequency: 'Once daily in the morning',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Essential Hypertension', 'Renal protection in diabetic nephropathy', 'Heart failure management'],
    defaultPurpose: 'Essential Hypertension',
    category: 'Antihypertensive (ACE Inhibitor)',
  },
  {
    id: 'med_atorvastatin',
    name: 'Atorvastatin Calcium',
    genericName: 'Atorvastatin',
    brandName: 'Lipitor',
    commonStrengths: ['10 mg', '20 mg', '40 mg', '80 mg'],
    defaultStrength: '20 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily at bedtime', 'Once daily in the evening'],
    defaultFrequency: 'Once daily at bedtime',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Hyperlipidemia / Primary Hypercholesterolemia', 'Atherosclerotic cardiovascular disease prevention'],
    defaultPurpose: 'Hyperlipidemia / Primary Hypercholesterolemia',
    category: 'Lipid-lowering (HMG-CoA Reductase Inhibitor)',
  },
  {
    id: 'med_amlodipine',
    name: 'Amlodipine Besylate',
    genericName: 'Amlodipine',
    brandName: 'Norvasc',
    commonStrengths: ['2.5 mg', '5 mg', '10 mg'],
    defaultStrength: '5 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily', 'Once daily in the morning'],
    defaultFrequency: 'Once daily',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Hypertension', 'Chronic Stable Angina', 'Vasospastic Angina'],
    defaultPurpose: 'Hypertension',
    category: 'Antihypertensive (Calcium Channel Blocker)',
  },
  {
    id: 'med_levothyroxine',
    name: 'Levothyroxine Sodium',
    genericName: 'Levothyroxine',
    brandName: 'Synthroid / Levoxyl',
    commonStrengths: ['25 mcg', '50 mcg', '75 mcg', '88 mcg', '100 mcg', '112 mcg', '125 mcg', '137 mcg', '150 mcg'],
    defaultStrength: '50 mcg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily in morning 30-60 min before breakfast', 'Once daily on empty stomach'],
    defaultFrequency: 'Once daily in morning 30-60 min before breakfast',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Primary Hypothyroidism', 'Thyroid hormone replacement'],
    defaultPurpose: 'Primary Hypothyroidism',
    category: 'Endocrine (Thyroid Hormone)',
  },
  {
    id: 'med_omeprazole',
    name: 'Omeprazole Delayed-Release',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    commonStrengths: ['20 mg', '40 mg'],
    defaultStrength: '20 mg',
    defaultDosage: '1 capsule',
    defaultDosageUnit: 'capsule',
    commonFrequencies: ['Once daily before breakfast', 'Twice daily before meals'],
    defaultFrequency: 'Once daily before breakfast',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Gastroesophageal Reflux Disease (GERD)', 'Erosive Esophagitis', 'Gastric ulcer prophylaxis'],
    defaultPurpose: 'Gastroesophageal Reflux Disease (GERD)',
    category: 'Gastrointestinal (Proton Pump Inhibitor)',
  },
  {
    id: 'med_losartan',
    name: 'Losartan Potassium',
    genericName: 'Losartan',
    brandName: 'Cozaar',
    commonStrengths: ['25 mg', '50 mg', '100 mg'],
    defaultStrength: '50 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily', 'Twice daily'],
    defaultFrequency: 'Once daily',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Hypertension', 'Diabetic Nephropathy', 'Stroke risk reduction in LVH'],
    defaultPurpose: 'Hypertension',
    category: 'Antihypertensive (Angiotensin II Receptor Blocker)',
  },
  {
    id: 'med_gabapentin',
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    brandName: 'Neurontin',
    commonStrengths: ['100 mg', '300 mg', '400 mg', '600 mg', '800 mg'],
    defaultStrength: '300 mg',
    defaultDosage: '1 capsule',
    defaultDosageUnit: 'capsule',
    commonFrequencies: ['Three times daily', 'Twice daily', 'Once daily at bedtime'],
    defaultFrequency: 'Three times daily',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Diabetic Peripheral Neuropathy', 'Postherpetic Neuralgia', 'Neuropathic pain'],
    defaultPurpose: 'Diabetic Peripheral Neuropathy',
    category: 'Neurological / Anticonvulsant (Gabapentinoid)',
  },
  {
    id: 'med_hydrochlorothiazide',
    name: 'Hydrochlorothiazide (HCTZ)',
    genericName: 'Hydrochlorothiazide',
    brandName: 'Microzide',
    commonStrengths: ['12.5 mg', '25 mg', '50 mg'],
    defaultStrength: '25 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily in the morning'],
    defaultFrequency: 'Once daily in the morning',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Hypertension adjunct', 'Peripheral edema management'],
    defaultPurpose: 'Hypertension adjunct',
    category: 'Diuretic (Thiazide)',
  },
  {
    id: 'med_sertraline',
    name: 'Sertraline Hydrochloride',
    genericName: 'Sertraline',
    brandName: 'Zoloft',
    commonStrengths: ['25 mg', '50 mg', '100 mg'],
    defaultStrength: '50 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily in morning or evening'],
    defaultFrequency: 'Once daily in morning or evening',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Major Depressive Disorder', 'Generalized Anxiety Disorder', 'Panic Disorder'],
    defaultPurpose: 'Generalized Anxiety Disorder',
    category: 'Psychotropic (SSRI)',
  },
  {
    id: 'med_acetaminophen',
    name: 'Acetaminophen (Paracetamol)',
    genericName: 'Acetaminophen',
    brandName: 'Tylenol / Panadol',
    commonStrengths: ['325 mg', '500 mg (Extra Strength)', '650 mg (Extended Relief)'],
    defaultStrength: '500 mg',
    defaultDosage: '1-2 tablets',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Every 6 to 8 hours as needed for pain', 'Twice daily as needed'],
    defaultFrequency: 'Every 6 to 8 hours as needed for pain',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Osteoarthritis joint pain', 'Mild to moderate analgesic/antipyretic'],
    defaultPurpose: 'Osteoarthritis joint pain',
    category: 'Analgesic / Antipyretic',
  },
  {
    id: 'med_ibuprofen',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandName: 'Advil / Motrin',
    commonStrengths: ['200 mg', '400 mg', '600 mg', '800 mg'],
    defaultStrength: '400 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Every 8 hours with food as needed', 'Three times daily with food'],
    defaultFrequency: 'Every 8 hours with food as needed',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Inflammatory pain', 'Musculoskeletal stiffness', 'Mild-moderate pain'],
    defaultPurpose: 'Inflammatory pain',
    category: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
  },
  {
    id: 'med_amoxicillin',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    commonStrengths: ['250 mg', '500 mg', '875 mg'],
    defaultStrength: '500 mg',
    defaultDosage: '1 capsule',
    defaultDosageUnit: 'capsule',
    commonFrequencies: ['Every 8 hours for 7 days', 'Twice daily for 10 days'],
    defaultFrequency: 'Every 8 hours for 7 days',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Bacterial respiratory infection', 'Acute bacterial sinusitis', 'Streptococcal pharyngitis'],
    defaultPurpose: 'Acute bacterial sinusitis',
    category: 'Antibiotic (Aminopenicillin)',
  },
  {
    id: 'med_albuterol',
    name: 'Albuterol Sulfate HFA Inhaler',
    genericName: 'Albuterol',
    brandName: 'ProAir / Ventolin',
    commonStrengths: ['90 mcg/actuation'],
    defaultStrength: '90 mcg/actuation',
    defaultDosage: '1-2 puffs',
    defaultDosageUnit: 'puffs',
    commonFrequencies: ['Every 4 to 6 hours as needed for shortness of breath', '15 min before exercise'],
    defaultFrequency: 'Every 4 to 6 hours as needed for shortness of breath',
    commonRoutes: ['Inhalation'],
    defaultRoute: 'Inhalation',
    commonPurposes: ['Bronchospasm relief in Asthma / COPD', 'Exercise-induced bronchospasm'],
    defaultPurpose: 'Bronchospasm relief in Asthma / COPD',
    category: 'Respiratory (Short-Acting Beta-2 Agonist)',
  },
  {
    id: 'med_furosemide',
    name: 'Furosemide',
    genericName: 'Furosemide',
    brandName: 'Lasix',
    commonStrengths: ['20 mg', '40 mg', '80 mg'],
    defaultStrength: '20 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily in the morning', 'Twice daily (morning and 2 PM)'],
    defaultFrequency: 'Once daily in the morning',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Congestive Heart Failure fluid overload', 'Peripheral edema', 'Renal edema'],
    defaultPurpose: 'Congestive Heart Failure fluid overload',
    category: 'Diuretic (Loop Diuretic)',
  },
  {
    id: 'med_pantoprazole',
    name: 'Pantoprazole Sodium',
    genericName: 'Pantoprazole',
    brandName: 'Protonix',
    commonStrengths: ['20 mg', '40 mg'],
    defaultStrength: '40 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily 30 minutes before breakfast'],
    defaultFrequency: 'Once daily 30 minutes before breakfast',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Gastroesophageal Reflux Disease (GERD)', 'Zollinger-Ellison Syndrome', 'Stress ulcer prophylaxis'],
    defaultPurpose: 'Gastroesophageal Reflux Disease (GERD)',
    category: 'Gastrointestinal (Proton Pump Inhibitor)',
  },
  {
    id: 'med_clopidogrel',
    name: 'Clopidogrel Bisulfate',
    genericName: 'Clopidogrel',
    brandName: 'Plavix',
    commonStrengths: ['75 mg'],
    defaultStrength: '75 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily'],
    defaultFrequency: 'Once daily',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Thromboprophylaxis post-MI/stent', 'Peripheral artery disease', 'Ischemic stroke prevention'],
    defaultPurpose: 'Thromboprophylaxis post-MI/stent',
    category: 'Antiplatelet (P2Y12 Inhibitor)',
  },
  {
    id: 'med_metoprolol_succinate',
    name: 'Metoprolol Succinate ER',
    genericName: 'Metoprolol Succinate',
    brandName: 'Toprol XL',
    commonStrengths: ['25 mg', '50 mg', '100 mg', '200 mg'],
    defaultStrength: '25 mg',
    defaultDosage: '1 tablet',
    defaultDosageUnit: 'tablet',
    commonFrequencies: ['Once daily with or immediately after a meal'],
    defaultFrequency: 'Once daily with or immediately after a meal',
    commonRoutes: ['Oral'],
    defaultRoute: 'Oral',
    commonPurposes: ['Chronic Heart Failure with reduced ejection fraction', 'Hypertension', 'Angina Pectoris'],
    defaultPurpose: 'Chronic Heart Failure with reduced ejection fraction',
    category: 'Cardiovascular (Beta-1 Selective Blocker)',
  },
];

export class MedicationCatalogService {
  /**
   * Search medication catalog by term (searches name, genericName, brandName, or category).
   */
  search(query: string, limit = 8): CatalogMedication[] {
    if (!query || query.trim().length === 0) return [];
    const cleanQuery = query.toLowerCase().trim();

    return PROTOTYPE_MEDICATION_CATALOG.filter((item) => {
      return (
        item.name.toLowerCase().includes(cleanQuery) ||
        item.genericName.toLowerCase().includes(cleanQuery) ||
        item.brandName.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery)
      );
    }).slice(0, limit);
  }

  /**
   * Get catalog medication by ID or name match.
   */
  findByName(name: string): CatalogMedication | undefined {
    if (!name) return undefined;
    const clean = name.toLowerCase().trim();
    return PROTOTYPE_MEDICATION_CATALOG.find(
      (m) =>
        m.name.toLowerCase() === clean ||
        m.genericName.toLowerCase() === clean ||
        m.brandName.toLowerCase().includes(clean)
    );
  }
}

export const medicationCatalogService = new MedicationCatalogService();

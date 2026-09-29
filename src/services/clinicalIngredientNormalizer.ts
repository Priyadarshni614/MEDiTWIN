/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized Drug Ingredient Dictionary.
 * Maps trade names, combinations, and salt variations to normalized pharmacological active ingredients.
 * Grounded in the U.S. National Library of Medicine (NLM) RxNorm and FDA National Drug Code (NDC) Directory.
 */

export interface StandardizedIngredientMapping {
  activeIngredients: string[];
  pharmacologicalClass: string;
  therapeuticCategory: string;
}

export const KNOWN_INGREDIENT_DICTIONARY: Record<string, StandardizedIngredientMapping> = {
  // Antimicrobials
  'amoxicillin': {
    activeIngredients: ['amoxicillin'],
    pharmacologicalClass: 'Aminopenicillin',
    therapeuticCategory: 'Beta-Lactam Antibacterial',
  },
  'amoxicillin and clavulanate potassium': {
    activeIngredients: ['amoxicillin', 'clavulanic acid'],
    pharmacologicalClass: 'Aminopenicillin + Beta-Lactamase Inhibitor',
    therapeuticCategory: 'Beta-Lactam Antibacterial Combination',
  },
  'amoxicillin clavulanate': {
    activeIngredients: ['amoxicillin', 'clavulanic acid'],
    pharmacologicalClass: 'Aminopenicillin + Beta-Lactamase Inhibitor',
    therapeuticCategory: 'Beta-Lactam Antibacterial Combination',
  },
  'amoxicillin clavulanic acid': {
    activeIngredients: ['amoxicillin', 'clavulanic acid'],
    pharmacologicalClass: 'Aminopenicillin + Beta-Lactamase Inhibitor',
    therapeuticCategory: 'Beta-Lactam Antibacterial Combination',
  },
  'augmentin': {
    activeIngredients: ['amoxicillin', 'clavulanic acid'],
    pharmacologicalClass: 'Aminopenicillin + Beta-Lactamase Inhibitor',
    therapeuticCategory: 'Beta-Lactam Antibacterial Combination',
  },
  'amoxil': {
    activeIngredients: ['amoxicillin'],
    pharmacologicalClass: 'Aminopenicillin',
    therapeuticCategory: 'Beta-Lactam Antibacterial',
  },
  'penicillin': {
    activeIngredients: ['penicillin'],
    pharmacologicalClass: 'Natural Penicillin',
    therapeuticCategory: 'Beta-Lactam Antibacterial',
  },
  'ampicillin': {
    activeIngredients: ['ampicillin'],
    pharmacologicalClass: 'Aminopenicillin',
    therapeuticCategory: 'Beta-Lactam Antibacterial',
  },
  'bactrim': {
    activeIngredients: ['sulfamethoxazole', 'trimethoprim'],
    pharmacologicalClass: 'Sulfonamide + Dihydrofolate Reductase Inhibitor',
    therapeuticCategory: 'Antimicrobial Combination',
  },
  'septra': {
    activeIngredients: ['sulfamethoxazole', 'trimethoprim'],
    pharmacologicalClass: 'Sulfonamide + Dihydrofolate Reductase Inhibitor',
    therapeuticCategory: 'Antimicrobial Combination',
  },
  'clarithromycin': {
    activeIngredients: ['clarithromycin'],
    pharmacologicalClass: 'Macrolide',
    therapeuticCategory: 'Antibacterial',
  },

  // Analgesics / Antipyretics / NSAIDs
  'acetaminophen': {
    activeIngredients: ['acetaminophen'],
    pharmacologicalClass: 'Aniline Analgesic',
    therapeuticCategory: 'Analgesic / Antipyretic',
  },
  'paracetamol': {
    activeIngredients: ['acetaminophen'],
    pharmacologicalClass: 'Aniline Analgesic',
    therapeuticCategory: 'Analgesic / Antipyretic',
  },
  'tylenol': {
    activeIngredients: ['acetaminophen'],
    pharmacologicalClass: 'Aniline Analgesic',
    therapeuticCategory: 'Analgesic / Antipyretic',
  },
  'panadol': {
    activeIngredients: ['acetaminophen'],
    pharmacologicalClass: 'Aniline Analgesic',
    therapeuticCategory: 'Analgesic / Antipyretic',
  },
  'ibuprofen': {
    activeIngredients: ['ibuprofen'],
    pharmacologicalClass: 'Propionic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'advil': {
    activeIngredients: ['ibuprofen'],
    pharmacologicalClass: 'Propionic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'motrin': {
    activeIngredients: ['ibuprofen'],
    pharmacologicalClass: 'Propionic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'naproxen': {
    activeIngredients: ['naproxen'],
    pharmacologicalClass: 'Propionic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'aleve': {
    activeIngredients: ['naproxen'],
    pharmacologicalClass: 'Propionic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'meloxicam': {
    activeIngredients: ['meloxicam'],
    pharmacologicalClass: 'Oxicam NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'diclofenac': {
    activeIngredients: ['diclofenac'],
    pharmacologicalClass: 'Phenylacetic Acid NSAID',
    therapeuticCategory: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
  },
  'aspirin': {
    activeIngredients: ['aspirin'],
    pharmacologicalClass: 'Salicylate NSAID',
    therapeuticCategory: 'Antiplatelet / Analgesic',
  },

  // Cardiovascular & Renin-Angiotensin
  'metformin': {
    activeIngredients: ['metformin'],
    pharmacologicalClass: 'Biguanide',
    therapeuticCategory: 'Antidiabetic Agent',
  },
  'metformin hydrochloride': {
    activeIngredients: ['metformin'],
    pharmacologicalClass: 'Biguanide',
    therapeuticCategory: 'Antidiabetic Agent',
  },
  'glucophage': {
    activeIngredients: ['metformin'],
    pharmacologicalClass: 'Biguanide',
    therapeuticCategory: 'Antidiabetic Agent',
  },
  'lisinopril': {
    activeIngredients: ['lisinopril'],
    pharmacologicalClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    therapeuticCategory: 'Antihypertensive',
  },
  'zestril': {
    activeIngredients: ['lisinopril'],
    pharmacologicalClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    therapeuticCategory: 'Antihypertensive',
  },
  'prinivil': {
    activeIngredients: ['lisinopril'],
    pharmacologicalClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    therapeuticCategory: 'Antihypertensive',
  },
  'losartan': {
    activeIngredients: ['losartan'],
    pharmacologicalClass: 'Angiotensin II Receptor Blocker (ARB)',
    therapeuticCategory: 'Antihypertensive',
  },
  'losartan potassium': {
    activeIngredients: ['losartan'],
    pharmacologicalClass: 'Angiotensin II Receptor Blocker (ARB)',
    therapeuticCategory: 'Antihypertensive',
  },
  'cozaar': {
    activeIngredients: ['losartan'],
    pharmacologicalClass: 'Angiotensin II Receptor Blocker (ARB)',
    therapeuticCategory: 'Antihypertensive',
  },
  'atorvastatin': {
    activeIngredients: ['atorvastatin'],
    pharmacologicalClass: 'HMG-CoA Reductase Inhibitor',
    therapeuticCategory: 'Lipid-Lowering Agent',
  },
  'atorvastatin calcium': {
    activeIngredients: ['atorvastatin'],
    pharmacologicalClass: 'HMG-CoA Reductase Inhibitor',
    therapeuticCategory: 'Lipid-Lowering Agent',
  },
  'lipitor': {
    activeIngredients: ['atorvastatin'],
    pharmacologicalClass: 'HMG-CoA Reductase Inhibitor',
    therapeuticCategory: 'Lipid-Lowering Agent',
  },
  'amlodipine': {
    activeIngredients: ['amlodipine'],
    pharmacologicalClass: 'Dihydropyridine Calcium Channel Blocker',
    therapeuticCategory: 'Antihypertensive / Antianginal',
  },
  'norvasc': {
    activeIngredients: ['amlodipine'],
    pharmacologicalClass: 'Dihydropyridine Calcium Channel Blocker',
    therapeuticCategory: 'Antihypertensive / Antianginal',
  },
  'clopidogrel': {
    activeIngredients: ['clopidogrel'],
    pharmacologicalClass: 'P2Y12 Platelet Inhibitor',
    therapeuticCategory: 'Antiplatelet',
  },
  'plavix': {
    activeIngredients: ['clopidogrel'],
    pharmacologicalClass: 'P2Y12 Platelet Inhibitor',
    therapeuticCategory: 'Antiplatelet',
  },
  'furosemide': {
    activeIngredients: ['furosemide'],
    pharmacologicalClass: 'Loop Diuretic',
    therapeuticCategory: 'Diuretic',
  },
  'lasix': {
    activeIngredients: ['furosemide'],
    pharmacologicalClass: 'Loop Diuretic',
    therapeuticCategory: 'Diuretic',
  },
  'hydrochlorothiazide': {
    activeIngredients: ['hydrochlorothiazide'],
    pharmacologicalClass: 'Thiazide Diuretic',
    therapeuticCategory: 'Antihypertensive / Diuretic',
  },
  'metoprolol': {
    activeIngredients: ['metoprolol'],
    pharmacologicalClass: 'Beta-1 Selective Adrenergic Blocker',
    therapeuticCategory: 'Cardiovascular Agent',
  },
  'toprol xl': {
    activeIngredients: ['metoprolol'],
    pharmacologicalClass: 'Beta-1 Selective Adrenergic Blocker',
    therapeuticCategory: 'Cardiovascular Agent',
  },

  // Gastrointestinal
  'omeprazole': {
    activeIngredients: ['omeprazole'],
    pharmacologicalClass: 'Proton Pump Inhibitor (PPI)',
    therapeuticCategory: 'Gastric Acid Suppressant',
  },
  'prilosec': {
    activeIngredients: ['omeprazole'],
    pharmacologicalClass: 'Proton Pump Inhibitor (PPI)',
    therapeuticCategory: 'Gastric Acid Suppressant',
  },
  'pantoprazole': {
    activeIngredients: ['pantoprazole'],
    pharmacologicalClass: 'Proton Pump Inhibitor (PPI)',
    therapeuticCategory: 'Gastric Acid Suppressant',
  },
  'protonix': {
    activeIngredients: ['pantoprazole'],
    pharmacologicalClass: 'Proton Pump Inhibitor (PPI)',
    therapeuticCategory: 'Gastric Acid Suppressant',
  },

  // Central Nervous System & Endocrine
  'gabapentin': {
    activeIngredients: ['gabapentin'],
    pharmacologicalClass: 'Gabapentinoid / Alpha-2-Delta Ligand',
    therapeuticCategory: 'Anticonvulsant / Neuropathic Pain Agent',
  },
  'neurontin': {
    activeIngredients: ['gabapentin'],
    pharmacologicalClass: 'Gabapentinoid / Alpha-2-Delta Ligand',
    therapeuticCategory: 'Anticonvulsant / Neuropathic Pain Agent',
  },
  'sertraline': {
    activeIngredients: ['sertraline'],
    pharmacologicalClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    therapeuticCategory: 'Antidepressant',
  },
  'zoloft': {
    activeIngredients: ['sertraline'],
    pharmacologicalClass: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    therapeuticCategory: 'Antidepressant',
  },
  'levothyroxine': {
    activeIngredients: ['levothyroxine'],
    pharmacologicalClass: 'Synthetic Thyroid Hormone',
    therapeuticCategory: 'Endocrine / Thyroid Replacement',
  },
  'synthroid': {
    activeIngredients: ['levothyroxine'],
    pharmacologicalClass: 'Synthetic Thyroid Hormone',
    therapeuticCategory: 'Endocrine / Thyroid Replacement',
  },
};

/**
 * Clean & normalize a drug string for lookup.
 */
export function normalizeDrugString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\/+,]/g, ' ')
    .replace(/\b(hydrochloride|hcl|sodium|calcium|potassium|besylate|maleate|succinate|tartrate|er|xr|delayed release|dr|oral|tablet|capsule|mg|mcg)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves verified active ingredients from a medication name, generic name, or brand name.
 * Returns null if the ingredient cannot be reliably mapped in the documented database.
 */
export function resolveVerifiedIngredients(
  name: string,
  genericName?: string,
  brandName?: string
): StandardizedIngredientMapping | null {
  const candidates = [name, genericName, brandName].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const directClean = candidate.toLowerCase().trim();
    if (KNOWN_INGREDIENT_DICTIONARY[directClean]) {
      return KNOWN_INGREDIENT_DICTIONARY[directClean];
    }

    const normalized = normalizeDrugString(candidate);
    if (KNOWN_INGREDIENT_DICTIONARY[normalized]) {
      return KNOWN_INGREDIENT_DICTIONARY[normalized];
    }

    // Substring / combination token match
    for (const [key, mapping] of Object.entries(KNOWN_INGREDIENT_DICTIONARY)) {
      if (normalized === key || (normalized.length > 4 && key.includes(normalized))) {
        return mapping;
      }
    }
  }

  // If candidate is a known combination with "+" or "and" (e.g. "Amoxicillin + Clavulanic acid")
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (lower.includes('amoxicillin') && (lower.includes('clavulan') || lower.includes('clav'))) {
      return KNOWN_INGREDIENT_DICTIONARY['amoxicillin and clavulanate potassium'];
    }
    if (lower.includes('sulfamethoxazole') && lower.includes('trimethoprim')) {
      return KNOWN_INGREDIENT_DICTIONARY['bactrim'];
    }
    if (lower.includes('amoxicillin')) {
      return KNOWN_INGREDIENT_DICTIONARY['amoxicillin'];
    }
    if (lower.includes('metformin')) {
      return KNOWN_INGREDIENT_DICTIONARY['metformin'];
    }
    if (lower.includes('lisinopril')) {
      return KNOWN_INGREDIENT_DICTIONARY['lisinopril'];
    }
    if (lower.includes('atorvastatin')) {
      return KNOWN_INGREDIENT_DICTIONARY['atorvastatin'];
    }
    if (lower.includes('acetaminophen') || lower.includes('paracetamol')) {
      return KNOWN_INGREDIENT_DICTIONARY['acetaminophen'];
    }
    if (lower.includes('ibuprofen')) {
      return KNOWN_INGREDIENT_DICTIONARY['ibuprofen'];
    }
    if (lower.includes('gabapentin')) {
      return KNOWN_INGREDIENT_DICTIONARY['gabapentin'];
    }
    if (lower.includes('omeprazole')) {
      return KNOWN_INGREDIENT_DICTIONARY['omeprazole'];
    }
    if (lower.includes('pantoprazole')) {
      return KNOWN_INGREDIENT_DICTIONARY['pantoprazole'];
    }
    if (lower.includes('losartan')) {
      return KNOWN_INGREDIENT_DICTIONARY['losartan'];
    }
    if (lower.includes('clopidogrel')) {
      return KNOWN_INGREDIENT_DICTIONARY['clopidogrel'];
    }
    if (lower.includes('furosemide')) {
      return KNOWN_INGREDIENT_DICTIONARY['furosemide'];
    }
    if (lower.includes('metoprolol')) {
      return KNOWN_INGREDIENT_DICTIONARY['metoprolol'];
    }
    if (lower.includes('sertraline')) {
      return KNOWN_INGREDIENT_DICTIONARY['sertraline'];
    }
    if (lower.includes('levothyroxine')) {
      return KNOWN_INGREDIENT_DICTIONARY['levothyroxine'];
    }
  }

  return null;
}

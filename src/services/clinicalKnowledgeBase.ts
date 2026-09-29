/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standardized Drug Rule Interface grounded in published clinical pharmacology databases
 * (FDA Package Inserts, Lexicomp/Micromedex Drug Interaction Monographs,
 * AGS Beers Criteria 2023 for PIMs, and Kidney Disease: Improving Global Outcomes [KDIGO]).
 */

export interface DrugInteractionRule {
  id: string;
  drugAKeywords: string[];
  drugBKeywords: string[];
  drugAName: string;
  drugBName: string;
  severity: 'contraindicated' | 'high' | 'moderate' | 'low';
  title: string;
  simpleExplanation: string;
  clinicalSignificance: string;
  sourceReference: string;
  guidance: string;
}

export interface TherapeuticClassRule {
  id: string;
  therapeuticClass: string;
  keywords: string[];
  riskExplanation: string;
  clinicalSignificance: string;
  sourceReference: string;
}

export interface AllergyCrossReactivityRule {
  id: string;
  allergenKeywords: string[];
  allergenName: string;
  medicationKeywords: string[];
  medicationClass: string;
  severity: 'contraindicated' | 'high' | 'moderate';
  explanation: string;
  clinicalSignificance: string;
  sourceReference: string;
}

export interface ConditionPrecautionRule {
  id: string;
  conditionKeywords: string[];
  conditionName: string;
  medicationKeywords: string[];
  medicationName: string;
  severity: 'contraindicated' | 'high' | 'moderate';
  explanation: string;
  clinicalSignificance: string;
  sourceReference: string;
}

export interface AgePrecautionRule {
  id: string;
  minAge?: number;
  maxAge?: number;
  medicationKeywords: string[];
  medicationName: string;
  severity: 'high' | 'moderate';
  explanation: string;
  clinicalSignificance: string;
  sourceReference: string;
}

/**
 * Documented Evidence-Based Interaction Rules
 */
export const DOCUMENTED_DRUG_INTERACTIONS: DrugInteractionRule[] = [
  {
    id: 'ddi_metformin_contrast',
    drugAKeywords: ['metformin', 'glucophage', 'fortamet', 'glumetza'],
    drugBKeywords: ['iodinated contrast', 'radiopaque contrast', 'iohexol', 'iodixanol'],
    drugAName: 'Metformin',
    drugBName: 'Iodinated Radiologic Contrast Agents',
    severity: 'high',
    title: 'Metformin with Iodinated Contrast Agents',
    simpleExplanation: 'Using metformin concurrently with intravascular iodinated contrast agents can acutely impair renal function, leading to metformin accumulation and lactic acidosis.',
    clinicalSignificance: 'Risk of potentially fatal lactic acidosis due to acute kidney injury and subsequent reduced renal clearance of metformin.',
    sourceReference: 'FDA Drug Safety Communication & American College of Radiology (ACR) Contrast Media Manual v2023',
    guidance: 'Withhold metformin at the time of or prior to iodinated contrast procedures and evaluate eGFR 48 hours later before resuming.',
  },
  {
    id: 'ddi_lisinopril_spironolactone_potassium',
    drugAKeywords: ['lisinopril', 'zestril', 'prinivil', 'enalapril', 'ramipril', 'benazepril', 'losartan', 'valsartan'],
    drugBKeywords: ['spironolactone', 'aldactone', 'eplerenone', 'triamterene', 'potassium chloride', 'k-dur', 'klor-con'],
    drugAName: 'ACE Inhibitor / ARB (e.g., Lisinopril, Losartan)',
    drugBName: 'Potassium-Sparing Diuretics / Potassium Supplements',
    severity: 'high',
    title: 'ACE Inhibitor / ARB + Potassium Sparing Agent or Supplement',
    simpleExplanation: 'Combining an ACE inhibitor or ARB with potassium-sparing diuretics or potassium supplements significantly reduces potassium excretion, causing hyperkalemia.',
    clinicalSignificance: 'Severe hyperkalemia (serum potassium > 5.5 mEq/L) can trigger cardiac conduction blocks, life-threatening arrhythmias, and cardiac arrest.',
    sourceReference: 'FDA Package Insert: Zestril (Lisinopril) Warnings & Precautions, Section 5.4; ACC/AHA Guideline for Heart Failure',
    guidance: 'Monitor serum potassium and renal function periodically. Avoid potassium supplements unless directed and supervised by a physician.',
  },
  {
    id: 'ddi_lisinopril_nsaid',
    drugAKeywords: ['lisinopril', 'zestril', 'prinivil', 'losartan', 'cozaar', 'valsartan', 'enalapril', 'ramipril'],
    drugBKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'diclofenac', 'indomethacin', 'celecoxib'],
    drugAName: 'ACE Inhibitor / ARB (e.g., Lisinopril, Losartan)',
    drugBName: 'NSAIDs (e.g., Ibuprofen, Naproxen, Meloxicam)',
    severity: 'moderate',
    title: 'ACE Inhibitor / ARB + Nonsteroidal Anti-Inflammatory Drug (NSAID)',
    simpleExplanation: 'NSAIDs block prostaglandin production which diminishes the blood-pressure-lowering effect of ACE inhibitors/ARBs and can acutely reduce kidney blood flow.',
    clinicalSignificance: 'Blunted antihypertensive efficacy and elevated risk of acute kidney injury (triple whammy vulnerability when combined with diuretics).',
    sourceReference: 'FDA Guidance: Concomitant Use of NSAIDs and Renin-Angiotensin System Antagonists; KDIGO AKI Guidelines',
    guidance: 'Consider acetaminophen for pain control instead of regular NSAID therapy. If combined, monitor blood pressure and serum creatinine.',
  },
  {
    id: 'ddi_clopidogrel_omeprazole',
    drugAKeywords: ['clopidogrel', 'plavix'],
    drugBKeywords: ['omeprazole', 'prilosec', 'esomeprazole', 'nexium'],
    drugAName: 'Clopidogrel (Plavix)',
    drugBName: 'Omeprazole / Esomeprazole',
    severity: 'high',
    title: 'Clopidogrel Activation Inhibition by Omeprazole',
    simpleExplanation: 'Omeprazole competitively inhibits CYP2C19, the primary hepatic enzyme required to convert clopidogrel into its active antiplatelet form.',
    clinicalSignificance: 'Significantly reduced antiplatelet activity, leading to increased risk of recurrent myocardial infarction, stent thrombosis, and ischemic stroke.',
    sourceReference: 'FDA Drug Safety Communication: Updated information on Clopidogrel and Omeprazole interaction (CYP2C19 mediated)',
    guidance: 'Avoid omeprazole/esomeprazole in patients taking clopidogrel. Use pantoprazole or H2-receptor blockers if gastroprotection is required.',
  },
  {
    id: 'ddi_atorvastatin_clarithromycin',
    drugAKeywords: ['atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'lovastatin'],
    drugBKeywords: ['clarithromycin', 'biaxin', 'erythromycin', 'ketoconazole', 'itraconazole'],
    drugAName: 'CYP3A4-Metabolized Statins (Atorvastatin, Simvastatin)',
    drugBName: 'Strong CYP3A4 Inhibitors (e.g., Clarithromycin, Ketoconazole)',
    severity: 'high',
    title: 'Statin Plasma Elevation via CYP3A4 Inhibition',
    simpleExplanation: 'Clarithromycin and azole antifungals potently inhibit CYP3A4 enzymes responsible for clearing atorvastatin/simvastatin, drastically multiplying systemic statin exposure.',
    clinicalSignificance: 'Substantial elevation in blood statin levels increasing the risk of severe myopathy and life-threatening rhabdomyolysis.',
    sourceReference: 'FDA Statin Safety Guidance & Package Insert: Lipitor Section 7.1; ACC/AHA Cholesterol Guidelines',
    guidance: 'Temporarily suspend atorvastatin during macrolide antibiotic courses or consider azithromycin (not a potent CYP3A4 inhibitor).',
  },
  {
    id: 'ddi_clopidogrel_nsaid',
    drugAKeywords: ['clopidogrel', 'plavix', 'aspirin', 'warfarin', 'coumadin', 'apixaban', 'eliquis', 'rivaroxaban', 'xarelto'],
    drugBKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'diclofenac'],
    drugAName: 'Anticoagulant / Antiplatelet (e.g., Clopidogrel, Aspirin, Eliquis)',
    drugBName: 'NSAIDs (e.g., Ibuprofen, Naproxen, Meloxicam)',
    severity: 'high',
    title: 'Synergistic Gastrointestinal & Systemic Bleeding Risk',
    simpleExplanation: 'Combining blood thinners or antiplatelet agents with NSAIDs impairs platelet aggregation while causing gastric mucosal irritation and erosions.',
    clinicalSignificance: 'Marked increase (3- to 5-fold) in major gastrointestinal bleeding, peptic ulcer hemorrhage, and systemic bleeding events.',
    sourceReference: 'American College of Gastroenterology (ACG) Clinical Guideline: Bleeding Risks with Antithrombotic Agents & NSAIDs',
    guidance: 'Avoid routine NSAID therapy when taking antiplatelet or anticoagulant medications unless specifically co-prescribed with gastroprotective agents.',
  },
  {
    id: 'ddi_furosemide_lisinopril_nsaid',
    drugAKeywords: ['furosemide', 'lasix', 'hydrochlorothiazide', 'hctz'],
    drugBKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam'],
    drugAName: 'Diuretics (Furosemide, HCTZ)',
    drugBName: 'NSAIDs (Ibuprofen, Naproxen)',
    severity: 'moderate',
    title: 'Diuretic Blunting & Renal Perfusion Impairment',
    simpleExplanation: 'NSAIDs inhibit renal prostaglandins, attenuating the natriuretic and diuretic efficacy of furosemide/thiazides while promoting fluid retention.',
    clinicalSignificance: 'Worsening congestive heart failure, fluid overload, exacerbated hypertension, and heightened risk of acute renal failure.',
    sourceReference: 'FDA Package Insert: Lasix (Furosemide) Section 7; KDIGO Guidelines for Heart Failure and Renal Disease',
    guidance: 'Evaluate whether alternative analgesia such as topical therapies or acetaminophen can be used.',
  },
  {
    id: 'ddi_sertraline_nsaid',
    drugAKeywords: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'citalopram', 'celexa', 'escitalopram', 'lexapro', 'paroxetine'],
    drugBKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'aspirin'],
    drugAName: 'SSRI Antidepressants (e.g., Sertraline, Escitalopram)',
    drugBName: 'NSAIDs (e.g., Ibuprofen, Naproxen)',
    severity: 'moderate',
    title: 'SSRI + NSAID Upper Gastrointestinal Bleeding Risk',
    simpleExplanation: 'SSRIs deplete intraplatelet serotonin reserves required for aggregation. When combined with ulcerogenic NSAIDs, bleeding risk is compounded.',
    clinicalSignificance: 'Synergistic increase in upper gastrointestinal tract hemorrhage.',
    sourceReference: 'BMJ Systematic Review on SSRIs and NSAID Co-prescribing; FDA Drug Safety Communication',
    guidance: 'Counsel patient regarding signs of GI bleeding (dark stools, abdominal pain, coffee-ground emesis). Use gastroprotection if combination is required.',
  },
  {
    id: 'ddi_gabapentin_opioid_sedatives',
    drugAKeywords: ['gabapentin', 'neurontin', 'pregabalin', 'lyrica'],
    drugBKeywords: ['tramadol', 'oxycodone', 'hydrocodone', 'morphine', 'codeine', 'fentanyl', 'zolpidem', 'ambien', 'alprazolam', 'xanax', 'lorazepam', 'ativan'],
    drugAName: 'Gabapentinoids (Gabapentin, Pregabalin)',
    drugBName: 'Opioids / Sedative Hypnotics / Benzodiazepines',
    severity: 'high',
    title: 'Potentiated Central Nervous System & Respiratory Depression',
    simpleExplanation: 'Gabapentin combined with central nervous system depressants produces synergistic sedation, profound respiratory depression, and fall risk.',
    clinicalSignificance: 'FDA Black Box Warning: Risk of serious breathing difficulties, severe sedation, and accidental overdose fatalities.',
    sourceReference: 'FDA Drug Safety Communication (December 2019): FDA warns about serious breathing problems with seizure and nerve pain medicines gabapentin and pregabalin',
    guidance: 'Avoid combination where possible. If co-prescribed, start at lowest effective doses and monitor closely for excessive sedation or respiratory distress.',
  },
  {
    id: 'ddi_amoxicillin_methotrexate',
    drugAKeywords: ['amoxicillin', 'amoxil', 'augmentin', 'penicillin', 'piperacillin'],
    drugBKeywords: ['methotrexate', 'trexall', 'rasuvo'],
    drugAName: 'Penicillin-Class Antibiotics (Amoxicillin, Augmentin)',
    drugBName: 'Methotrexate',
    severity: 'high',
    title: 'Inhibition of Renal Methotrexate Elimination',
    simpleExplanation: 'Penicillins compete with methotrexate for renal tubular secretion, significantly slowing methotrexate excretion and elevating blood levels.',
    clinicalSignificance: 'Severe methotrexate toxicity, including bone marrow suppression, pancytopenia, and gastrointestinal ulceration.',
    sourceReference: 'FDA Package Insert: Methotrexate Section 7; Lexicomp Drug Interactions',
    guidance: 'Avoid co-administration. Monitor complete blood counts and serum methotrexate concentrations if concurrent therapy is unavoidable.',
  },
];

/**
 * Documented Therapeutic Class Duplication Rules
 */
export const DOCUMENTED_THERAPEUTIC_CLASSES: TherapeuticClassRule[] = [
  {
    id: 'class_nsaid',
    therapeuticClass: 'Nonsteroidal Anti-Inflammatory Drugs (NSAIDs)',
    keywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'mobic', 'diclofenac', 'voltaren', 'celecoxib', 'celebrex', 'indomethacin'],
    riskExplanation: 'Simultaneous use of multiple NSAIDs does not provide additive analgesic efficacy but markedly amplifies gastrointestinal ulceration, nephrotoxicity, and bleeding.',
    clinicalSignificance: 'Severe gastrointestinal toxicity, perforation, acute tubular necrosis, and worsened hypertension.',
    sourceReference: 'American College of Rheumatology & FDA NSAID Class Monograph',
  },
  {
    id: 'class_ace_arb',
    therapeuticClass: 'Renin-Angiotensin-Aldosterone System (RAAS) Dual Blockade',
    keywords: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'losartan', 'valsartan', 'irbesartan', 'olmesartan', 'candesartan', 'aliskiren'],
    riskExplanation: 'Co-administration of an ACE inhibitor with an ARB (dual RAAS blockade) is strongly contraindicated in clinical guidelines.',
    clinicalSignificance: 'Significantly higher rates of hyperkalemia, syncope, and acute renal failure without incremental cardiovascular benefit.',
    sourceReference: 'ACC/AHA/HFSA Heart Failure Guidelines; ONTARGET & VA NEPHRON-D Landmark Clinical Trials',
  },
  {
    id: 'class_ppi',
    therapeuticClass: 'Proton Pump Inhibitors (PPIs)',
    keywords: ['omeprazole', 'prilosec', 'pantoprazole', 'protonix', 'esomeprazole', 'nexium', 'lansoprazole', 'prevacid', 'rabeprazole'],
    riskExplanation: 'Concurrent use of two different proton pump inhibitors represents duplicate therapy without clinical justification.',
    clinicalSignificance: 'Unnecessary pill burden, increased risk of hypomagnesemia, Clostridioides difficile colitis, and bone fracture risk with long-term exposure.',
    sourceReference: 'American Gastroenterological Association (AGA) Clinical Practice Updates on PPI Deprescribing',
  },
  {
    id: 'class_statin',
    therapeuticClass: 'HMG-CoA Reductase Inhibitors (Statins)',
    keywords: ['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor', 'pravastatin', 'pravachol', 'lovastatin'],
    riskExplanation: 'Concomitant administration of multiple statin medications provides redundant therapeutic action with heightened myotoxicity.',
    clinicalSignificance: 'Substantial escalation of myopathy, serum transaminase elevation, and risk of rhabdomyolysis.',
    sourceReference: 'AHA/ACC Guideline on the Management of Blood Cholesterol',
  },
  {
    id: 'class_beta_blocker',
    therapeuticClass: 'Beta-Adrenergic Receptor Blockers',
    keywords: ['metoprolol', 'toprol', 'atenolol', 'tenormin', 'carvedilol', 'coreg', 'bisoprolol', 'propranolol', 'inderal', 'labetalol'],
    riskExplanation: 'Prescribing multiple beta-blockers simultaneously leads to duplicate autonomic receptor antagonism.',
    clinicalSignificance: 'Profound bradycardia, complete heart block, systemic hypotension, and cardiogenic shock.',
    sourceReference: 'ACC/AHA Guidelines for the Management of Heart Failure and Stable Ischemic Heart Disease',
  },
  {
    id: 'class_ssri',
    therapeuticClass: 'Selective Serotonin Reuptake Inhibitors (SSRIs)',
    keywords: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'citalopram', 'celexa', 'escitalopram', 'lexapro', 'paroxetine', 'paxil'],
    riskExplanation: 'Concurrent use of two full-dose SSRIs creates excessive synaptic serotonin accumulation.',
    clinicalSignificance: 'Heightened vulnerability to Serotonin Syndrome (autonomic instability, hyperreflexia, tremors, hyperthermia).',
    sourceReference: 'FDA Safety Guidelines on Serotonergic Psychiatric Medications; APA Practice Guidelines for Major Depressive Disorder',
  },
  {
    id: 'class_loop_diuretic',
    therapeuticClass: 'Loop Diuretics',
    keywords: ['furosemide', 'lasix', 'torsemide', 'demadex', 'bumetanide', 'bumex'],
    riskExplanation: 'Simultaneous prescription of multiple loop diuretics is generally inadvertent and creates dangerous fluid-electrolyte shifts.',
    clinicalSignificance: 'Severe hypokalemia, hypomagnesemia, volume depletion, and prerenal azotemia.',
    sourceReference: 'KDIGO Guidelines for Heart Failure and Fluid Overload Management',
  },
];

/**
 * Documented Allergy Cross-Reactivity Rules
 */
export const DOCUMENTED_ALLERGY_RULES: AllergyCrossReactivityRule[] = [
  {
    id: 'allergy_penicillin',
    allergenKeywords: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'penicillins'],
    allergenName: 'Penicillin-Class Antibiotics',
    medicationKeywords: ['amoxicillin', 'amoxil', 'ampicillin', 'augmentin', 'piperacillin', 'zosyn', 'penicillin', 'nafcillin', 'oxacillin'],
    medicationClass: 'Beta-Lactam / Penicillin Antibiotics',
    severity: 'contraindicated',
    explanation: 'The patient has a documented allergy to Penicillin. The prescribed medication belongs to the aminopenicillin antibiotic class.',
    clinicalSignificance: 'Direct immunological cross-reactivity triggering IgE-mediated anaphylaxis, angioedema, urticaria, or severe cutaneous adverse reactions.',
    sourceReference: 'American Academy of Allergy, Asthma & Immunology (AAAAI) Drug Allergy Practice Parameter; FDA Amoxicillin Contraindications',
  },
  {
    id: 'allergy_nsaid_aspirin',
    allergenKeywords: ['nsaid', 'nsaids', 'aspirin', 'ibuprofen', 'naproxen'],
    allergenName: 'NSAIDs / Aspirin',
    medicationKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'mobic', 'diclofenac', 'voltaren', 'indomethacin', 'celecoxib'],
    medicationClass: 'Nonsteroidal Anti-Inflammatory Drugs',
    severity: 'contraindicated',
    explanation: 'The patient has a documented NSAID or Aspirin allergy. The prescribed medication is a COX-inhibiting nonsteroidal anti-inflammatory drug.',
    clinicalSignificance: 'Risk of NSAID-exacerbated respiratory disease (NERD), bronchospasm, facial angioedema, or severe anaphylactoid hypersensitivity reactions.',
    sourceReference: 'AAAAI Position Statement on Cross-Reactive NSAID Hypersensitivity; FDA Ibuprofen Boxed Warning',
  },
  {
    id: 'allergy_sulfa',
    allergenKeywords: ['sulfa', 'sulfonamide', 'sulfamethoxazole', 'bactrim'],
    allergenName: 'Sulfonamides / Sulfa Drugs',
    medicationKeywords: ['bactrim', 'septra', 'sulfamethoxazole', 'sulfasalazine'],
    medicationClass: 'Sulfonamide Antimicrobials',
    severity: 'contraindicated',
    explanation: 'Patient has a documented allergy to Sulfa compounds. Prescribed medication contains an arylamine sulfonamide antimicrobial moiety.',
    clinicalSignificance: 'Severe hypersensitivity, including Stevens-Johnson syndrome (SJS), toxic epidermal necrolysis (TEN), and widespread erythema multiforme.',
    sourceReference: 'FDA Bactrim Labeling & AAAAI Practice Parameters for Drug Hypersensitivity',
  },
  {
    id: 'allergy_statin',
    allergenKeywords: ['statin', 'atorvastatin', 'lipitor', 'statin-induced myopathy', 'statin intolerance'],
    allergenName: 'Statins / HMG-CoA Reductase Inhibitors',
    medicationKeywords: ['atorvastatin', 'lipitor', 'simvastatin', 'rosuvastatin', 'pravastatin'],
    medicationClass: 'HMG-CoA Reductase Inhibitors',
    severity: 'high',
    explanation: 'Patient has a documented history of statin allergy or severe statin intolerance.',
    clinicalSignificance: 'Recurrent severe myalgia, creatine kinase elevation, drug-induced hepatotoxicity, or rhabdomyolysis.',
    sourceReference: 'National Lipid Association (NLA) Statin Intolerance Consensus Statement',
  },
];

/**
 * Documented Patient Condition Precautions
 */
export const DOCUMENTED_CONDITION_PRECAUTIONS: ConditionPrecautionRule[] = [
  {
    id: 'cond_ckd_metformin',
    conditionKeywords: ['chronic kidney disease', 'ckd', 'renal impairment', 'renal failure', 'nephropathy'],
    conditionName: 'Chronic Kidney Disease (CKD)',
    medicationKeywords: ['metformin', 'glucophage'],
    medicationName: 'Metformin Hydrochloride',
    severity: 'high',
    explanation: 'Metformin is substantially cleared by renal filtration. In patients with CKD, diminished clearance promotes toxic metformin accumulation.',
    clinicalSignificance: 'Increased risk of Metformin-Associated Lactic Acidosis (MALA), with mortality rates up to 50%. Contraindicated if eGFR < 30 mL/min/1.73m²; dose reduction required if eGFR 30–44 mL/min/1.73m².',
    sourceReference: 'FDA Drug Safety Communication on Metformin Use in Patients with Reduced Kidney Function; KDIGO Diabetes Guidelines',
  },
  {
    id: 'cond_ckd_nsaid',
    conditionKeywords: ['chronic kidney disease', 'ckd', 'renal impairment', 'renal insufficiency', 'renal failure'],
    conditionName: 'Chronic Kidney Disease (CKD)',
    medicationKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'diclofenac'],
    medicationName: 'Systemic NSAIDs',
    severity: 'high',
    explanation: 'NSAIDs inhibit renal vasodilatory prostaglandins (PGE2, PGI2) critical for maintaining glomerular capillary perfusion in pre-existing kidney disease.',
    clinicalSignificance: 'Accelerated loss of functional nephrons, acute-on-chronic kidney injury, fluid retention, hyperkalemia, and worsening azotemia.',
    sourceReference: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury; National Kidney Foundation KDOQI Guidelines',
  },
  {
    id: 'cond_hypertension_nsaid',
    conditionKeywords: ['hypertension', 'high blood pressure', 'essential hypertension'],
    conditionName: 'Hypertension',
    medicationKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'diclofenac'],
    medicationName: 'Systemic NSAIDs',
    severity: 'moderate',
    explanation: 'NSAIDs cause sodium and water retention and attenuate the efficacy of antihypertensive agents (ACE inhibitors, beta-blockers, diuretics).',
    clinicalSignificance: 'Dose-dependent blood pressure elevation (average 3 to 5 mmHg increase) and compromised cardiovascular control.',
    sourceReference: 'AHA Scientific Statement: Nonsteroidal Anti-Inflammatory Drugs and Cardiovascular Risk',
  },
  {
    id: 'cond_heart_failure_nsaid',
    conditionKeywords: ['heart failure', 'congestive heart failure', 'chf', 'reduced ejection fraction'],
    conditionName: 'Congestive Heart Failure (CHF)',
    medicationKeywords: ['ibuprofen', 'naproxen', 'meloxicam', 'diclofenac', 'indomethacin'],
    medicationName: 'Systemic NSAIDs',
    severity: 'high',
    explanation: 'NSAID-induced renal vasoconstriction and fluid retention exacerbate myocardial wall stress and volume overload in heart failure patients.',
    clinicalSignificance: 'Doubled risk of acute heart failure hospitalization and worsening functional NYHA class.',
    sourceReference: 'ACC/AHA/HFSA Heart Failure Guidelines: Drugs to Avoid or Use With Caution in Heart Failure',
  },
  {
    id: 'cond_asthma_aspirin',
    conditionKeywords: ['asthma', 'bronchospasm', 'reactive airway disease'],
    conditionName: 'Asthma',
    medicationKeywords: ['aspirin', 'ibuprofen', 'naproxen', 'ketorolac'],
    medicationName: 'Aspirin / NSAIDs',
    severity: 'moderate',
    explanation: 'In up to 10-20% of adult asthmatics, cyclooxygenase-1 inhibition shunts arachidonic acid into the 5-lipoxygenase pathway, generating bronchoconstrictive cysteinyl leukotrienes.',
    clinicalSignificance: 'Aspirin-Exacerbated Respiratory Disease (AERD) precipitating severe bronchospasm, laryngospasm, and respiratory emergency.',
    sourceReference: 'Global Initiative for Asthma (GINA) Report; AAAAI Guidelines on AERD',
  },
  {
    id: 'cond_diabetes_steroids',
    conditionKeywords: ['diabetes', 'type 2 diabetes', 'type 1 diabetes', 'hyperglycemia'],
    conditionName: 'Diabetes Mellitus',
    medicationKeywords: ['prednisone', 'methylprednisolone', 'dexamethasone', 'hydrocortisone'],
    medicationName: 'Systemic Corticosteroids',
    severity: 'moderate',
    explanation: 'Systemic glucocorticoids increase hepatic gluconeogenesis and induce peripheral insulin resistance.',
    clinicalSignificance: 'Marked postprandial and fasting hyperglycemia, which may precipitate hyperosmolar hyperglycemic state (HHS) or diabetic ketoacidosis (DKA).',
    sourceReference: 'American Diabetes Association (ADA) Standards of Care in Diabetes',
  },
];

/**
 * Documented Age-Specific Precautions (AGS Beers Criteria 2023 for Potentially Inappropriate Medications in Older Adults)
 */
export const DOCUMENTED_AGE_PRECAUTIONS: AgePrecautionRule[] = [
  {
    id: 'beers_nsaid_geriatric',
    minAge: 65,
    medicationKeywords: ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aleve', 'meloxicam', 'diclofenac', 'indomethacin'],
    medicationName: 'Chronic Systemic NSAIDs',
    severity: 'high',
    explanation: 'In adults age 65 and older, chronic NSAID therapy carries substantially higher rates of gastrointestinal bleeding, ulcer perforation, and acute renal decline compared to younger cohorts.',
    clinicalSignificance: 'AGS Beers Criteria 2023 Recommendation: Avoid chronic use of oral non-COX-2 selective NSAIDs unless alternative options are not effective and gastroprotective agent is co-prescribed.',
    sourceReference: '2023 American Geriatrics Society (AGS) Beers Criteria for Potentially Inappropriate Medication Use in Older Adults',
  },
  {
    id: 'beers_benzodiazepine_geriatric',
    minAge: 65,
    medicationKeywords: ['diazepam', 'valium', 'lorazepam', 'ativan', 'alprazolam', 'xanax', 'clonazepam', 'klonopin', 'zolpidem', 'ambien'],
    medicationName: 'Benzodiazepines & Z-Drugs',
    severity: 'high',
    explanation: 'Older adults experience prolonged half-lives and enhanced receptor sensitivity to sedative-hypnotic medications.',
    clinicalSignificance: 'Substantial increase in cognitive decline, delirium, motor vehicle collisions, falls, and hip fractures.',
    sourceReference: '2023 AGS Beers Criteria (Table 2: Medications Inappropriate for Most Older Adults)',
  },
  {
    id: 'beers_anticholinergic_geriatric',
    minAge: 65,
    medicationKeywords: ['diphenhydramine', 'benadryl', 'hydroxyzine', 'vistaril', 'amitriptyline', 'elavil', 'oxybutynin', 'ditropan'],
    medicationName: 'Strong Anticholinergic Agents',
    severity: 'high',
    explanation: 'Strong anticholinergic drugs impair central cholinergic transmission and peripheral muscarinic signaling in aging individuals.',
    clinicalSignificance: 'Risk of acute delirium, confusion, urinary retention, severe constipation, and dry mouth; cumulative exposure correlates with long-term dementia risk.',
    sourceReference: '2023 AGS Beers Criteria: Anticholinergic Cognitive Burden Scale & High-Risk Medications',
  },
];

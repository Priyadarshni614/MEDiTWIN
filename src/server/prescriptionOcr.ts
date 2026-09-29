/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface ExtractedMedItemResult {
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  route: string;
  duration?: string;
  purpose?: string;
  confidence: 'High' | 'Medium' | 'Low';
  isUnclear?: boolean;
  unclearReason?: string;
}

export interface OcrExtractionResult {
  success: boolean;
  patientName?: string;
  doctorName?: string;
  clinicName?: string;
  prescriptionDate?: string;
  medications: ExtractedMedItemResult[];
  error?: string;
  technicalDetails?: string;
}

/**
 * Server-side prescription image parser utilizing Google Gemini multimodal OCR.
 *
 * Enforces structured schema extraction with multi-model fallback and strict no-hallucination rules.
 */
export async function extractMedicationsFromImage(
  base64Data: string,
  mimeType = 'image/jpeg'
): Promise<OcrExtractionResult> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      medications: [],
      error: 'GEMINI_API_KEY is not configured on the server.',
      technicalDetails: 'Missing process.env.GEMINI_API_KEY on host',
    };
  }

  // Handle data URL prefix or raw base64
  let cleanBase64 = base64Data;
  let resolvedMimeType = mimeType;

  if (base64Data.startsWith('data:')) {
    const commaIndex = base64Data.indexOf(',');
    if (commaIndex !== -1) {
      const meta = base64Data.substring(0, commaIndex);
      const mimeMatch = meta.match(/data:([^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        resolvedMimeType = mimeMatch[1];
      }
      cleanBase64 = base64Data.substring(commaIndex + 1);
    }
  }

  // Validate cleanBase64
  cleanBase64 = cleanBase64.trim();
  if (!cleanBase64 || cleanBase64.length < 50) {
    return {
      success: false,
      medications: [],
      error: 'Invalid or empty image data received.',
      technicalDetails: 'Base64 image string is empty or invalid format',
    };
  }

  // Standardize supported MIME types
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(resolvedMimeType)) {
    resolvedMimeType = 'image/jpeg';
  }

  const prompt = `You are a clinical pharmacy and OCR parsing assistant for MEDiTWIN AI.
Analyze the provided prescription slip, doctor's note, hospital discharge order, handwritten prescription, or medication package image.
Extract visibly present medications, clinical directions, physician name, clinic/hospital name, patient name, and prescription date.

CRITICAL CLINICAL RULES:
1. Extract ONLY information visibly present or clearly legible in the image. Do NOT guess, fabricate, or invent medications, strengths, or dosages.
2. For handwritten prescriptions:
   - Carefully interpret cursive physician handwriting and common medical sig notations (e.g., 'PO' = Oral, 'q8h' = every 8 hours, 'bid' = twice daily, 'tid' = three times daily, 'qid' = four times daily, 'prn' = as needed, 'hs' = at bedtime).
   - If any medication name, strength, dosage, or frequency is ambiguous, faint, or cut off:
     * Provide your best clinical reading
     * Set confidence to 'Medium' or 'Low'
     * Set isUnclear to true and provide unclearReason (e.g. 'Handwritten dosage is ambiguous between 500mg and 250mg; requires patient verification')
3. For clearly printed or legible items:
   * Set confidence to 'High'
   * Set isUnclear to false
4. If no medication can be reliably identified in the image (or if the image is blank, an unreadable photo, or not a prescription order), return an empty medications array [].
5. Never invent doctor names, dates, or clinic names if they are not visible.`;

  // Candidate models with fallback in case of high demand (503/429)
  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                patientName: { type: Type.STRING },
                doctorName: { type: Type.STRING },
                clinicName: { type: Type.STRING },
                prescriptionDate: { type: Type.STRING },
                medications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      genericName: { type: Type.STRING },
                      brandName: { type: Type.STRING },
                      strength: { type: Type.STRING },
                      dosage: { type: Type.STRING },
                      dosageUnit: { type: Type.STRING },
                      frequency: { type: Type.STRING },
                      route: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      confidence: {
                        type: Type.STRING,
                        enum: ['High', 'Medium', 'Low'],
                      },
                      isUnclear: { type: Type.BOOLEAN },
                      unclearReason: { type: Type.STRING },
                    },
                    required: ['name', 'dosage', 'frequency', 'confidence'],
                  },
                },
              },
              required: ['medications'],
            },
          },
        });

        let text = response.text || '';
        if (!text) {
          lastError = new Error(`Empty response from ${modelName}`);
          continue;
        }

        // Clean markdown fences if any
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }

        const parsed = JSON.parse(cleanText);

        if (!parsed.medications || !Array.isArray(parsed.medications) || parsed.medications.length === 0) {
          return {
            success: false,
            patientName: parsed.patientName || undefined,
            doctorName: parsed.doctorName || undefined,
            clinicName: parsed.clinicName || undefined,
            prescriptionDate: parsed.prescriptionDate || undefined,
            medications: [],
            error: 'No legible medications could be detected in this prescription image.',
          };
        }

        // Map and sanitize extracted medications
        const medications: ExtractedMedItemResult[] = parsed.medications
          .filter((m: any) => m && typeof m.name === 'string' && m.name.trim().length > 0)
          .map((m: any) => ({
            name: m.name.trim(),
            genericName: m.genericName ? m.genericName.trim() : undefined,
            brandName: m.brandName ? m.brandName.trim() : undefined,
            strength: m.strength ? m.strength.trim() : '',
            dosage: m.dosage ? m.dosage.trim() : '1 tablet',
            dosageUnit: m.dosageUnit ? m.dosageUnit.trim() : undefined,
            frequency: m.frequency ? m.frequency.trim() : 'Once daily',
            route: m.route ? m.route.trim() : 'Oral',
            duration: m.duration ? m.duration.trim() : 'Ongoing',
            purpose: m.purpose ? m.purpose.trim() : undefined,
            confidence: (['High', 'Medium', 'Low'].includes(m.confidence) ? m.confidence : 'High') as 'High' | 'Medium' | 'Low',
            isUnclear: Boolean(m.isUnclear || m.confidence === 'Low'),
            unclearReason: m.unclearReason || (m.confidence === 'Low' ? 'Handwriting is ambiguous; please verify medication details.' : undefined),
          }));

        if (medications.length === 0) {
          return {
            success: false,
            patientName: parsed.patientName || undefined,
            doctorName: parsed.doctorName || undefined,
            clinicName: parsed.clinicName || undefined,
            prescriptionDate: parsed.prescriptionDate || undefined,
            medications: [],
            error: 'No valid medication names could be identified in the image.',
          };
        }

        return {
          success: true,
          patientName: parsed.patientName || undefined,
          doctorName: parsed.doctorName || undefined,
          clinicName: parsed.clinicName || undefined,
          prescriptionDate: parsed.prescriptionDate || undefined,
          medications,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Extraction attempt with ${modelName} (attempt ${attempt}) failed:`, err?.message || err);
        // Short delay before retry or fallback
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  console.error('All Gemini multimodal prescription extraction attempts failed:', lastError);
  return {
    success: false,
    medications: [],
    error: 'Prescription extraction failed due to a temporary service interruption. Please retry.',
    technicalDetails: lastError?.message || String(lastError),
  };
}

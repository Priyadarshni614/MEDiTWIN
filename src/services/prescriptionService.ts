/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Prescription, ExtractedMedicationItem, Medication } from '../models/types';
import { dataService } from './localStorageDataService';
import { authorizationService } from './authorizationService';
import { medicationService } from './medicationService';

export interface ProcessPrescriptionResponse {
  prescription: Prescription;
  success: boolean;
  message?: string;
}

export class PrescriptionService {
  /**
   * Upload prescription image and trigger OCR extraction.
   * Creates initial record with extractionStatus = 'PROCESSING',
   * attempts server-side multimodal Gemini OCR,
   * then updates record with extracted results or failure state.
   */
  async uploadAndProcess(
    patientId: string,
    fileData: { fileName: string; imageUrl: string; mimeType?: string }
  ): Promise<Prescription> {
    if (!patientId) throw new Error('Patient ID is required');

    // 1. Create initial prescription record
    const initialRecord = await dataService.createPrescription({
      patientId,
      fileName: fileData.fileName,
      imageUrl: fileData.imageUrl,
      extractedMedications: [],
      extractionStatus: 'PROCESSING',
      verificationStatus: 'NOT_REVIEWED',
    });

    // 2. Perform OCR extraction
    let extractedMeds: ExtractedMedicationItem[] = [];
    let detectedDoctor: string | undefined;
    let detectedClinic: string | undefined;
    let detectedPatient: string | undefined;
    let detectedDate: string | undefined;
    let extractionSuccess = false;
    let errorMessage: string | undefined;

    try {
      // Call server-side multimodal OCR endpoint
      const response = await fetch('/api/prescriptions/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          imageUrl: fileData.imageUrl,
          fileName: fileData.fileName,
          mimeType: fileData.mimeType || 'image/jpeg',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.medications) && data.medications.length > 0) {
          extractedMeds = data.medications.map((item: any, idx: number) => ({
            id: `item_${Date.now()}_${idx}`,
            name: item.name || 'Unknown Medication',
            genericName: item.genericName || undefined,
            brandName: item.brandName || undefined,
            strength: item.strength || '',
            dosage: item.dosage || '1 tablet',
            dosageUnit: item.dosageUnit || 'tablet',
            frequency: item.frequency || 'Once daily',
            route: item.route || 'Oral',
            duration: item.duration || 'Ongoing',
            purpose: item.purpose || undefined,
            confidence: item.confidence || 'High',
            isUnclear: Boolean(item.isUnclear),
            unclearReason: item.unclearReason || undefined,
            selected: true,
          }));
          detectedDoctor = data.doctorName;
          detectedClinic = data.clinicName;
          detectedPatient = data.patientName;
          detectedDate = data.prescriptionDate;
          extractionSuccess = true;
        } else {
          errorMessage = data.error || 'No legible medication orders found in the image.';
          console.error('Prescription extraction failed:', {
            status: response.status,
            error: data.error,
            technicalDetails: data.technicalDetails,
            fileName: fileData.fileName,
            mimeType: fileData.mimeType,
          });
        }
      } else {
        const errText = await response.text();
        errorMessage = `Extraction service error (${response.status})`;
        console.error('Prescription extraction failed:', {
          status: response.status,
          error: errText,
          fileName: fileData.fileName,
          mimeType: fileData.mimeType,
        });
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Network error communicating with prescription OCR service.';
      console.error('Prescription extraction failed:', {
        error: err?.message || String(err),
        fileName: fileData.fileName,
        mimeType: fileData.mimeType,
      });
    }

    // 3. Update prescription record in storage
    const updated = await dataService.updatePrescription(patientId, initialRecord.id, {
      extractedMedications: extractedMeds,
      doctorName: detectedDoctor,
      clinicName: detectedClinic,
      patientName: detectedPatient,
      prescriptionDate: detectedDate,
      extractionStatus: extractionSuccess ? 'COMPLETED' : 'FAILED',
      errorMessage: extractionSuccess ? undefined : (errorMessage || 'Medication information could not be reliably extracted from this prescription.'),
    });

    return updated;
  }

  /**
   * Patient Verification & Confirmation Flow:
   * Patient verifies extracted medications, edits any errors, and clicks "Confirm & Add".
   * This creates real active medications with source = 'PRESCRIPTION_OCR'.
   */
  async confirmAndAddToTwin(
    patientId: string,
    prescriptionId: string,
    verifiedItems: ExtractedMedicationItem[],
    doctorName?: string,
    prescriptionDate?: string
  ): Promise<Medication[]> {
    if (!patientId || !prescriptionId) throw new Error('Missing patientId or prescriptionId');

    const prescription = await dataService.getPrescriptionById(patientId, prescriptionId);
    if (!prescription) throw new Error('Prescription not found');

    const createdMeds: Medication[] = [];

    // Filter to selected items only
    const itemsToAdd = verifiedItems.filter((i) => i.selected);

    for (const item of itemsToAdd) {
      const newMed = await medicationService.addMedication(patientId, {
        name: item.name,
        genericName: item.genericName,
        brandName: item.brandName,
        strength: item.strength || '',
        dosage: item.dosage || '1 tablet',
        dosageUnit: item.dosageUnit,
        frequency: item.frequency || 'Once daily',
        route: item.route || 'Oral',
        duration: item.duration || 'Ongoing',
        purpose: item.purpose,
        startDate: prescriptionDate || new Date().toISOString().split('T')[0],
        prescribedBy: doctorName || prescription.doctorName || 'Prescribing Physician',
        prescriptionId,
        source: 'PRESCRIPTION_OCR',
      });
      createdMeds.push(newMed);
    }

    // Update prescription verification status
    await dataService.updatePrescription(patientId, prescriptionId, {
      extractedMedications: verifiedItems,
      doctorName: doctorName || prescription.doctorName,
      prescriptionDate: prescriptionDate || prescription.prescriptionDate,
      verificationStatus: 'VERIFIED',
    });

    return createdMeds;
  }

  /**
   * Get all prescriptions for a patient.
   */
  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    if (!patientId) return [];
    return dataService.getPrescriptionsByPatient(patientId);
  }

  /**
   * Get prescription by ID.
   */
  async getPrescription(patientId: string, prescriptionId: string): Promise<Prescription | null> {
    if (!patientId || !prescriptionId) return null;
    return dataService.getPrescriptionById(patientId, prescriptionId);
  }

  /**
   * Authorized Doctor Access: Read-only prescriptions view.
   */
  async getAuthorizedPrescriptionsForDoctor(
    doctorId: string,
    patientId: string
  ): Promise<Prescription[] | null> {
    const isAuthorized = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
    if (!isAuthorized) {
      console.warn(`Unauthorized attempt by doctor ${doctorId} to view patient ${patientId} prescriptions`);
      return null;
    }
    return this.getPrescriptions(patientId);
  }
}

export const prescriptionService = new PrescriptionService();

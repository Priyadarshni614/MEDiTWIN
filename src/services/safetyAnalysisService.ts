/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication, PatientProfile } from '../models/types';
import { MedicationSafetyReport } from '../models/safetyTypes';
import { medicationSafetyEngine } from './medicationSafetyEngine';
import { dataService } from './localStorageDataService';
import { authorizationService } from './authorizationService';

export class SafetyAnalysisService {
  private static readonly SAFETY_REPORTS_PREFIX = 'meditwin_safety_reports:';

  /**
   * Run safety analysis for a patient and cache the latest report in storage.
   */
  async runAnalysisForPatient(patientId: string): Promise<MedicationSafetyReport> {
    if (!patientId) throw new Error('Missing patientId for safety analysis');

    const patient = await dataService.getPatientProfile(patientId);
    if (!patient) throw new Error(`Patient profile not found for ID: ${patientId}`);

    const activeMeds = await dataService.getActiveMedicationsByPatient(patientId);

    const report = medicationSafetyEngine.analyze(patient, activeMeds);

    // Save report to localStorage partitioned by patientId
    this.saveReport(patientId, report);

    return report;
  }

  /**
   * Retrieve the latest analysis report for a patient if one exists.
   */
  async getLatestReportForPatient(patientId: string): Promise<MedicationSafetyReport | null> {
    if (!patientId) return null;
    const raw = localStorage.getItem(`${SafetyAnalysisService.SAFETY_REPORTS_PREFIX}${patientId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MedicationSafetyReport;
    } catch {
      return null;
    }
  }

  /**
   * Save a report to patient storage.
   */
  private saveReport(patientId: string, report: MedicationSafetyReport): void {
    try {
      localStorage.setItem(
        `${SafetyAnalysisService.SAFETY_REPORTS_PREFIX}${patientId}`,
        JSON.stringify(report)
      );
    } catch (err) {
      console.warn('Could not save safety report to localStorage:', err);
    }
  }

  /**
   * Doctor access: Run or get safety analysis for a patient ONLY IF doctor is authorized.
   */
  async getAuthorizedPatientSafetyAnalysis(
    doctorId: string,
    patientId: string
  ): Promise<MedicationSafetyReport | null> {
    const isAuthorized = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
    if (!isAuthorized) {
      console.warn(`Unauthorized safety analysis request by doctor ${doctorId} for patient ${patientId}`);
      return null;
    }

    // Always run fresh analysis on the patient's current live twin
    return this.runAnalysisForPatient(patientId);
  }
}

export const safetyAnalysisService = new SafetyAnalysisService();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import { dataService } from './localStorageDataService';
import { medicationService } from './medicationService';
import { safetyAnalysisService } from './safetyAnalysisService';
import { authorizationService } from './authorizationService';
import { 
  EmergencyPassportSummary, 
  EmergencyPassportShare, 
  PassportMedicationItem, 
  PassportVerifiedFinding 
} from '../models/passportTypes';

export class PassportService {
  private static readonly SHARE_STORAGE_PREFIX = 'meditwin_emergency_share:';

  /**
   * Generates a concise, readable Emergency Medication Passport containing only
   * information available in the authenticated patient's profile, Medication Twin,
   * and Phase 4 safety analysis.
   */
  async getEmergencyPassportSummary(patientId: string): Promise<EmergencyPassportSummary> {
    if (!patientId) {
      throw new Error('Patient ID is required to generate Emergency Medication Passport');
    }

    const patient = await dataService.getPatientProfile(patientId);
    const activeMeds = await medicationService.getActiveMedications(patientId);
    
    // Retrieve latest Phase 4 safety report; if none exists, run fresh analysis on active meds
    let safetyReport = await safetyAnalysisService.getLatestReportForPatient(patientId);
    if (!safetyReport && patient) {
      try {
        safetyReport = await safetyAnalysisService.runAnalysisForPatient(patientId);
      } catch (err) {
        console.warn('Could not auto-generate safety report for passport:', err);
      }
    }

    // Map active medications into clean passport format
    const passportMeds: PassportMedicationItem[] = activeMeds.map((m) => ({
      id: m.id,
      name: m.name,
      genericName: m.genericName || undefined,
      brandName: m.brandName || undefined,
      strength: m.strength?.trim() ? m.strength : 'Not provided',
      dosage: m.dosage?.trim() ? m.dosage : 'Not provided',
      frequency: m.frequency?.trim() ? m.frequency : 'Not provided',
      route: m.route?.trim() ? m.route : 'Not provided',
      duration: m.duration || undefined,
      prescribedBy: m.prescribedBy || undefined,
      purpose: m.purpose || undefined,
      source: m.source,
    }));

    // Filter verified findings from latest Phase 4 analysis
    const verifiedFindings: PassportVerifiedFinding[] = (safetyReport?.findings || [])
      .filter((f) => f.verificationState === 'VERIFIED')
      .map((f) => ({
        id: f.id,
        title: f.title,
        category: f.category,
        severity: f.severity,
        involvedMedications: f.involvedMedications || [],
        explanation: f.explanation,
        clinicalSignificance: f.clinicalSignificance,
        sourceReference: f.sourceReference || 'Clinical Reference Database',
        recommendationNote: f.recommendationNote,
      }));

    const nowIso = new Date().toISOString();
    const summary: EmergencyPassportSummary = {
      patientId,
      fullName: patient?.fullName?.trim() ? patient.fullName : null,
      age: typeof patient?.age === 'number' && !isNaN(patient.age) ? patient.age : null,
      gender: patient?.gender ? patient.gender : null,
      weight: patient?.weight?.trim() ? patient.weight : null,
      bloodType: null, // Not recorded in standard profile; UI displays "Not provided"
      allergies: Array.isArray(patient?.allergies) ? patient.allergies : [],
      chronicConditions: Array.isArray(patient?.chronicConditions) ? patient.chronicConditions : [],
      emergencyContact: patient?.emergencyContact?.name ? patient.emergencyContact : null,
      activeMedications: passportMeds,
      lastSafetyAnalysisDate: safetyReport?.analyzedAt || null,
      safetyScore: safetyReport?.scoreBreakdown?.isCalculable ? (safetyReport.scoreBreakdown.score ?? null) : null,
      safetyRating: safetyReport?.scoreBreakdown?.ratingLabel || null,
      importantVerifiedFindings: verifiedFindings,
      disclaimer: 'This Emergency Medication Passport is generated solely for informational reference and emergency clinical awareness. It does not constitute a prescription, medical order, or clinical recommendation. Healthcare providers must independently evaluate all medications, dosages, and clinical history prior to administering treatment.',
      generatedAt: nowIso,
      lastUpdated: patient?.updatedAt || safetyReport?.analyzedAt || nowIso,
    };

    return summary;
  }

  /**
   * Doctor access: Retrieve emergency passport summary ONLY IF doctor has an active,
   * patient-authorized clinical relationship.
   */
  async getAuthorizedEmergencyPassport(
    doctorId: string,
    patientId: string
  ): Promise<EmergencyPassportSummary | null> {
    const isAuthorized = await authorizationService.canDoctorAccessPatient(doctorId, patientId);
    if (!isAuthorized) {
      console.warn(`Doctor ${doctorId} unauthorized to access passport for patient ${patientId}`);
      return null;
    }

    return this.getEmergencyPassportSummary(patientId);
  }

  /**
   * Retrieve active QR sharing record for a patient.
   */
  async getActiveShare(patientId: string): Promise<EmergencyPassportShare | null> {
    if (!patientId) return null;

    // Check server status first for authoritative state
    try {
      const res = await fetch(`/api/passport/status/${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const statusData = await res.json();
        if (statusData.hasActiveShare && statusData.token) {
          // If server reports active, retrieve latest from server or local
          const localRaw = localStorage.getItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`);
          if (localRaw) {
            const localShare: EmergencyPassportShare = JSON.parse(localRaw);
            if (localShare.token === statusData.token && localShare.status === 'ACTIVE') {
              return localShare;
            }
          }
        } else if (statusData.hasActiveShare === false) {
          // Server explicitly says no active share (or revoked)
          const localRaw = localStorage.getItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`);
          if (localRaw) {
            try {
              const localShare: EmergencyPassportShare = JSON.parse(localRaw);
              localShare.status = 'REVOKED';
              localStorage.setItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`, JSON.stringify(localShare));
            } catch {}
          }
          return null;
        }
      }
    } catch {
      // offline fallback to localStorage
    }

    // Check localStorage fallback
    const localRaw = localStorage.getItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`);
    if (localRaw) {
      try {
        const share: EmergencyPassportShare = JSON.parse(localRaw);
        if (share.status === 'ACTIVE') {
          if (new Date(share.expiresAt) < new Date()) {
            share.status = 'EXPIRED';
            localStorage.setItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`, JSON.stringify(share));
            return null;
          }
          return share;
        }
      } catch (e) {
        console.warn('Error parsing local share record:', e);
      }
    }

    return null;
  }

  /**
   * Generates a secure, non-guessable emergency share link and QR code.
   *
   * SECURITY ARCHITECTURE:
   * 1. Sensitive medical data, allergy details, and medications are NEVER placed inside the QR matrix.
   * 2. The QR code contains ONLY a secure URL with a cryptographically random unguessable token.
   * 3. Requires explicit patient confirmation before generation.
   * 4. Time-limited with automatic expiration (default 24 hours).
   * 5. Can be immediately revoked at any time by the patient.
   */
  async createEmergencyShare(
    patientId: string,
    durationHours: number = 24
  ): Promise<EmergencyPassportShare> {
    if (!patientId) throw new Error('Patient ID required to create share token');

    const summary = await this.getEmergencyPassportSummary(patientId);

    // Cryptographic non-guessable random token (UUID or 128-bit crypto random)
    let token: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      const array = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
      }
      token = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();

    // Construct the secure access link (hash-based routing)
    const origin = window.location.origin;
    const base = window.location.pathname.replace(/\/+$/, '');
    const shareUrl = `${origin}${base}/#/passport/view?token=${encodeURIComponent(token)}`;

    // Generate QR Code containing ONLY the secure link URL
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    const shareRecord: EmergencyPassportShare = {
      token,
      patientId,
      patientName: summary.fullName || 'Patient',
      createdAt: now.toISOString(),
      expiresAt,
      status: 'ACTIVE',
      data: summary,
      qrDataUrl,
    };

    // CRITICAL: Persist to authoritative server endpoint FIRST
    try {
      const serverRes = await fetch('/api/passport/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          patientId,
          patientName: summary.fullName || 'Patient',
          data: summary,
          durationHours,
          hasExplicitConsent: true,
        }),
      });

      if (!serverRes.ok) {
        const errorData = await serverRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${serverRes.status}`);
      }
    } catch (err: any) {
      console.error('Failed to persist share token to server:', err);
      throw new Error(`Failed to initialize secure emergency sharing on server: ${err.message}`);
    }

    // Save to local storage for quick access
    localStorage.setItem(
      `${PassportService.SHARE_STORAGE_PREFIX}${patientId}`,
      JSON.stringify(shareRecord)
    );

    return shareRecord;
  }

  /**
   * Immediately revokes the active QR emergency access link.
   */
  async revokeEmergencyShare(patientId: string, token?: string): Promise<boolean> {
    if (!patientId) return false;

    // Update local storage
    const localRaw = localStorage.getItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`);
    if (localRaw) {
      try {
        const share: EmergencyPassportShare = JSON.parse(localRaw);
        share.status = 'REVOKED';
        localStorage.setItem(`${PassportService.SHARE_STORAGE_PREFIX}${patientId}`, JSON.stringify(share));
      } catch (e) {
        console.warn('Error updating local share record:', e);
      }
    }

    // Call server to revoke
    try {
      await fetch('/api/passport/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, patientId }),
      });
    } catch (err) {
      console.warn('Could not revoke token on server:', err);
    }

    return true;
  }

  /**
   * Resolves a shared emergency passport by token (e.g. when first responder scans QR code).
   * Enforces expiration and revocation checks.
   */
  async fetchSharedPassportByToken(token: string): Promise<{
    success: boolean;
    data?: EmergencyPassportSummary;
    status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
    expiresAt?: string;
    error?: string;
  }> {
    if (!token || !token.trim()) {
      return { success: false, status: 'NOT_FOUND', error: 'Missing emergency access token.' };
    }

    const cleanToken = token.trim();

    // Query server endpoint
    try {
      const res = await fetch(`/api/passport/share/${encodeURIComponent(cleanToken)}`);
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        const status = payload.status || (res.status === 403 ? 'REVOKED' : res.status === 410 ? 'EXPIRED' : 'NOT_FOUND');
        return {
          success: false,
          status,
          error: payload.error || 'Emergency passport access link is invalid or could not be found.',
        };
      }

      return {
        success: true,
        data: payload.data,
        status: payload.status || 'ACTIVE',
        expiresAt: payload.expiresAt,
      };
    } catch (networkErr) {
      // In case of total network disconnect, check local fallback
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PassportService.SHARE_STORAGE_PREFIX)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const record: EmergencyPassportShare = JSON.parse(raw);
              if (record.token === cleanToken) {
                if (record.status === 'REVOKED') {
                  return {
                    success: false,
                    status: 'REVOKED',
                    error: 'Access Revoked: The patient has revoked this emergency access token.',
                  };
                }
                if (new Date(record.expiresAt) < new Date()) {
                  return {
                    success: false,
                    status: 'EXPIRED',
                    error: 'Access Expired: This emergency access link has expired.',
                  };
                }
                return {
                  success: true,
                  data: record.data,
                  status: record.status,
                  expiresAt: record.expiresAt,
                };
              }
            }
          } catch {
            // ignore
          }
        }
      }

      return {
        success: false,
        status: 'NOT_FOUND',
        error: 'Emergency passport access link is invalid or could not be found.',
      };
    }
  }
}

export const passportService = new PassportService();

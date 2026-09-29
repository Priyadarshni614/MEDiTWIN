/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { EmergencyPassportSummary } from '../models/passportTypes.ts';

export interface EmergencyShareRecord {
  token: string;
  patientId: string;
  patientName: string;
  hasExplicitConsent: boolean;
  consentedAt: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED';
  revokedAt?: string;
  data: EmergencyPassportSummary;
}

export interface ShareLookupResult {
  success: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  data?: EmergencyPassportSummary;
  createdAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  error?: string;
}

class EmergencyPassportStore {
  private filePath: string;
  private memoryStore: Map<string, EmergencyShareRecord> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Determine a persistent location for storage
    const dataDir = path.resolve(process.cwd(), '.data');
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.filePath = path.join(dataDir, 'emergency_passports.json');
    } catch {
      this.filePath = path.join('/tmp', 'emergency_passports.json');
    }

    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.token) {
              this.memoryStore.set(item.token, item);
            }
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('Failed to load emergency passport records from disk:', err);
      this.initialized = true;
    }
  }

  private persistToDisk() {
    try {
      const records = Array.from(this.memoryStore.values());
      fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to persist emergency passport records to disk:', err);
    }
  }

  public createShare(params: {
    token: string;
    patientId: string;
    patientName: string;
    data: EmergencyPassportSummary;
    durationHours?: number;
    hasExplicitConsent?: boolean;
  }): EmergencyShareRecord {
    if (!params.token || !params.patientId || !params.data) {
      throw new Error('Missing required fields for emergency passport share');
    }

    if (params.hasExplicitConsent === false) {
      throw new Error('Cannot generate emergency passport without explicit patient consent');
    }

    const now = new Date();
    const durationHours = params.durationHours || 24;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();

    // Revoke any prior active shares for this patient so only the newest token is active
    for (const [_, existing] of this.memoryStore.entries()) {
      if (existing.patientId === params.patientId && existing.status === 'ACTIVE') {
        existing.status = 'REVOKED';
        existing.revokedAt = now.toISOString();
      }
    }

    const record: EmergencyShareRecord = {
      token: params.token,
      patientId: params.patientId,
      patientName: params.patientName || 'Patient',
      hasExplicitConsent: true,
      consentedAt: now.toISOString(),
      createdAt: now.toISOString(),
      expiresAt,
      status: 'ACTIVE',
      data: params.data,
    };

    this.memoryStore.set(params.token, record);
    this.persistToDisk();
    return record;
  }

  public getByToken(token: string): ShareLookupResult {
    if (!token) {
      return {
        success: false,
        status: 'NOT_FOUND',
        error: 'Emergency access token is required.',
      };
    }

    const record = this.memoryStore.get(token);
    if (!record) {
      return {
        success: false,
        status: 'NOT_FOUND',
        error: 'Emergency passport access link is invalid or could not be found.',
      };
    }

    if (record.status === 'REVOKED') {
      return {
        success: false,
        status: 'REVOKED',
        revokedAt: record.revokedAt,
        error: 'Access Revoked: The patient has revoked this emergency access token. Access is strictly denied.',
      };
    }

    if (new Date(record.expiresAt) < new Date()) {
      return {
        success: false,
        status: 'EXPIRED',
        expiresAt: record.expiresAt,
        error: 'Access Expired: This emergency access link has expired. The patient must generate a new QR code.',
      };
    }

    if (!record.hasExplicitConsent) {
      return {
        success: false,
        status: 'REVOKED',
        error: 'Access Denied: Patient has not consented to sharing this passport.',
      };
    }

    return {
      success: true,
      status: 'ACTIVE',
      data: record.data,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
  }

  public revoke(token?: string, patientId?: string): { success: boolean; revokedCount: number } {
    let count = 0;
    const now = new Date().toISOString();

    if (token && this.memoryStore.has(token)) {
      const rec = this.memoryStore.get(token)!;
      if (rec.status === 'ACTIVE') {
        rec.status = 'REVOKED';
        rec.revokedAt = now;
        count++;
      }
    } else if (patientId) {
      for (const [_, rec] of this.memoryStore.entries()) {
        if (rec.patientId === patientId && rec.status === 'ACTIVE') {
          rec.status = 'REVOKED';
          rec.revokedAt = now;
          count++;
        }
      }
    }

    if (count > 0) {
      this.persistToDisk();
    }

    return { success: true, revokedCount: count };
  }

  public getActiveShareForPatient(patientId: string): EmergencyShareRecord | null {
    if (!patientId) return null;
    const now = new Date();

    for (const [_, rec] of this.memoryStore.entries()) {
      if (rec.patientId === patientId && rec.status === 'ACTIVE') {
        if (new Date(rec.expiresAt) > now) {
          return rec;
        }
      }
    }
    return null;
  }
}

export const emergencyPassportStore = new EmergencyPassportStore();

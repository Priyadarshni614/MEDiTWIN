/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { emergencyPassportStore } from './emergencyPassportStore.ts';

export async function handlePassportApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/passport/')) {
    return false;
  }

  // Parse path and query
  const [pathname, queryString] = url.split('?');
  const method = req.method?.toUpperCase();

  // Helper to send JSON
  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end(JSON.stringify(data));
  };

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }

  // 1. POST /api/passport/share - Create new share token
  if (pathname === '/api/passport/share' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { token, patientId, patientName, data, durationHours = 24, hasExplicitConsent = true } = payload;

        if (!token || !patientId || !data) {
          sendJson(400, { success: false, error: 'Missing token, patientId, or passport summary data' });
          return;
        }

        if (hasExplicitConsent === false) {
          sendJson(400, { success: false, error: 'Explicit patient consent is required to generate share token' });
          return;
        }

        const record = emergencyPassportStore.createShare({
          token,
          patientId,
          patientName,
          data,
          durationHours,
          hasExplicitConsent,
        });

        sendJson(200, {
          success: true,
          token: record.token,
          expiresAt: record.expiresAt,
          status: record.status,
        });
      } catch (err: any) {
        console.error('Error in /api/passport/share:', err);
        sendJson(500, { success: false, error: err?.message || 'Server error creating passport share' });
      }
    });
    return true;
  }

  // 2. GET /api/passport/share/:token - Retrieve passport by token
  if (pathname.startsWith('/api/passport/share/') && method === 'GET') {
    const rawToken = pathname.replace('/api/passport/share/', '');
    const token = decodeURIComponent(rawToken);

    const result = emergencyPassportStore.getByToken(token);
    if (!result.success) {
      if (result.status === 'REVOKED') {
        sendJson(403, result);
      } else if (result.status === 'EXPIRED') {
        sendJson(410, result);
      } else {
        sendJson(404, result);
      }
      return true;
    }

    sendJson(200, result);
    return true;
  }

  // 3. POST /api/passport/revoke - Revoke active share
  if (pathname === '/api/passport/revoke' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { token, patientId } = JSON.parse(body || '{}');
        const result = emergencyPassportStore.revoke(token, patientId);
        sendJson(200, { message: 'Emergency QR access successfully revoked.', ...result });
      } catch (err: any) {
        sendJson(500, { success: false, error: err?.message || 'Failed to revoke emergency access' });
      }
    });
    return true;
  }

  // 4. GET /api/passport/status/:patientId - Check if patient has active share
  if (pathname.startsWith('/api/passport/status/') && method === 'GET') {
    const patientId = decodeURIComponent(pathname.replace('/api/passport/status/', ''));
    const active = emergencyPassportStore.getActiveShareForPatient(patientId);

    if (active) {
      sendJson(200, {
        hasActiveShare: true,
        token: active.token,
        expiresAt: active.expiresAt,
        createdAt: active.createdAt,
      });
    } else {
      sendJson(200, { hasActiveShare: false });
    }
    return true;
  }

  // Not handled
  return false;
}

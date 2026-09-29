/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'child_process';

// Ensure TypeScript ESM and extensionless resolution when launched via plain `node server.ts`
if (!process.env.__TSX_BOOTSTRAPPED && !process.execArgv.some(arg => arg.includes('tsx'))) {
  const child = spawn(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_BOOTSTRAPPED: '1' },
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }
    process.exit(code ?? 0);
  });
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
} else {
  startApp();
}

async function startApp() {
  const express = (await import('express')).default;
  const path = (await import('path')).default;
  const { fileURLToPath } = await import('url');
  const dotenv = (await import('dotenv')).default;
  const { extractMedicationsFromImage } = await import('./src/server/prescriptionOcr.ts');
  const { emergencyPassportStore } = await import('./src/server/emergencyPassportStore.ts');

  dotenv.config();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'MEDiTWIN AI' });
  });

  // Emergency Passport Sharing Routes
  app.post('/api/passport/share', (req, res) => {
    try {
      const { token, patientId, patientName, data, durationHours = 24, hasExplicitConsent = true } = req.body;
      if (!token || !patientId || !data) {
        return res.status(400).json({ success: false, error: 'Missing required passport share payload' });
      }

      const record = emergencyPassportStore.createShare({
        token,
        patientId,
        patientName,
        data,
        durationHours,
        hasExplicitConsent,
      });

      return res.json({ success: true, token: record.token, expiresAt: record.expiresAt, status: record.status });
    } catch (err: any) {
      console.error('Error saving emergency share token:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Internal server error creating emergency share' });
    }
  });

  app.get('/api/passport/share/:token', (req, res) => {
    try {
      const { token } = req.params;
      const result = emergencyPassportStore.getByToken(token);

      if (!result.success) {
        if (result.status === 'REVOKED') return res.status(403).json(result);
        if (result.status === 'EXPIRED') return res.status(410).json(result);
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (err: any) {
      console.error('Error fetching shared passport:', err);
      return res.status(500).json({ success: false, error: 'Internal server error resolving token' });
    }
  });

  app.post('/api/passport/revoke', (req, res) => {
    try {
      const { token, patientId } = req.body;
      const result = emergencyPassportStore.revoke(token, patientId);
      return res.json({ message: 'Emergency QR access successfully revoked.', ...result });
    } catch (err: any) {
      console.error('Error revoking emergency share:', err);
      return res.status(500).json({ success: false, error: 'Failed to revoke emergency access' });
    }
  });

  app.get('/api/passport/status/:patientId', (req, res) => {
    try {
      const { patientId } = req.params;
      const active = emergencyPassportStore.getActiveShareForPatient(patientId);
      if (active) {
        return res.json({
          hasActiveShare: true,
          token: active.token,
          expiresAt: active.expiresAt,
          createdAt: active.createdAt,
        });
      }
      return res.json({ hasActiveShare: false });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to check status' });
    }
  });

  app.post('/api/prescriptions/extract', async (req, res) => {
    try {
      const { imageUrl, mimeType } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: 'No image provided' });
      }

      const result = await extractMedicationsFromImage(imageUrl, mimeType || 'image/jpeg');
      return res.json(result);
    } catch (err: any) {
      console.error('Server extraction route error:', err);
      return res.status(500).json({ 
        success: false, 
        medications: [],
        error: err?.message || 'Server extraction failed',
        technicalDetails: err?.stack || String(err)
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MEDiTWIN AI server running on http://0.0.0.0:${PORT}`);
  });
}

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {extractMedicationsFromImage} from './src/server/prescriptionOcr.ts';
import {handlePassportApiRequest} from './src/server/passportApiHandler.ts';

function apiServerPlugin(): Plugin {
  return {
    name: 'meditwin-api-server',
    configureServer(server) {
      // Health check endpoint
      server.middlewares.use('/api/health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', service: 'MEDiTWIN AI' }));
      });

      // Emergency Medication Passport API routes
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/passport/')) {
          const handled = await handlePassportApiRequest(req, res);
          if (handled) return;
        }
        next();
      });

      server.middlewares.use('/api/prescriptions/extract', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(bodyData || '{}');
            const imageUrl = parsed.imageUrl || '';
            const mimeType = parsed.mimeType || 'image/jpeg';

            if (!imageUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'No image provided' }));
              return;
            }

            const result = await extractMedicationsFromImage(imageUrl, mimeType);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: false, 
              medications: [],
              error: err?.message || 'Server extraction error',
              technicalDetails: err?.stack || String(err),
            }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

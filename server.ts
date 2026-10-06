import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { envConfig } from './apps/api/src/config/index.ts';
import { logger } from './apps/api/src/logger/index.ts';
import { requestCorrelationMiddleware } from './apps/api/src/middleware/request-id.ts';
import { structuredLoggingMiddleware } from './apps/api/src/middleware/logger.ts';
import { errorHandlerMiddleware } from './apps/api/src/middleware/error-handler.ts';
import { healthRouter } from './apps/api/src/routes/health.route.ts';
import { apiV1Router } from './apps/api/src/routes/index.ts';
import { leadService } from './packages/database/src/crm/services/lead.service.ts';
import { opportunityService } from './packages/database/src/crm/services/opportunity.service.ts';
import { seedCrmDevelopmentData } from './packages/database/src/seeds/crm.seed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();

  // Basic Middleware
  const allowedOrigins = envConfig.CORS_ORIGINS.includes(',')
    ? envConfig.CORS_ORIGINS.split(',').map((o) => o.trim())
    : envConfig.CORS_ORIGINS;

  app.use(express.json());
  app.use(cors({ origin: allowedOrigins }));
  app.use(requestCorrelationMiddleware);
  app.use(structuredLoggingMiddleware);

  // Health check endpoint (GET /health)
  app.use(healthRouter);

  // Versioned API endpoints (GET /api/v1/status, etc.)
  app.use('/api', apiV1Router);

  // Frontend Serving Strategy: Production Static Assets vs Vite Dev Middleware
  // In Cloud Run runtime or production environments, we serve pre-compiled assets from dist/.
  // Vite dev server is only used when explicitly requested or when dist/ has not been compiled.
  const distIndexPath = path.resolve(__dirname, 'dist', 'index.html');
  const hasDist = fs.existsSync(distIndexPath);
  const isExplicitDev = process.env.VITE_DEV_MODE === 'true';
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (!isExplicitDev && hasDist);

  if (isProd) {
    logger.info('[BCIP] Serving compiled production frontend assets from dist/', {
      event: 'production_frontend_serving',
      data: { distPath: path.resolve(__dirname, 'dist') },
    });
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    logger.info('[BCIP] Mounting Vite development middleware', {
      event: 'vite_dev_middleware_mounted',
      data: { hmr: false },
    });
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Global Error Handler Middleware
  app.use(errorHandlerMiddleware);

  // Initialize initial development CRM seed data for demo tenant if empty
  try {
    const oppCount = opportunityService.count('ten-001');
    const leadCount = leadService.count('ten-001');
    if (oppCount === 0 || leadCount === 0) {
      await seedCrmDevelopmentData('ten-001', 'usr-9901');
      logger.info('[BCIP CRM Seed] Initialized demo CRM data for ten-001', {
        event: 'crm_demo_seeded',
        data: { tenantId: 'ten-001' },
      });
    }
  } catch (seedErr) {
    logger.warn('[BCIP CRM Seed] Seed initialization skipped or encountered error', {
      data: { error: (seedErr as Error).message },
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    logger.info(`[BCIP] Body Corporate Intelligence Platform listening on port ${port}`, {
      event: 'platform_server_ready',
      data: {
        port,
        env: envConfig.APP_ENV,
        version: envConfig.APP_VERSION,
        endpoints: ['/health', '/api/v1/status'],
      },
    });
  });
}

bootstrap().catch((err) => {
  console.error('[BCIP] Fatal error during platform bootstrap:', err);
  process.exit(1);
});

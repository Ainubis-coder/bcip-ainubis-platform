import express from 'express';
import cors from 'cors';
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

  // Frontend Dev Middleware or Static Serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
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

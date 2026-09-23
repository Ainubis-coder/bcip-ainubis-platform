import express from 'express';
import cors from 'cors';
import { envConfig } from './config';
import { logger } from './logger';
import { requestCorrelationMiddleware } from './middleware/request-id';
import { structuredLoggingMiddleware } from './middleware/logger';
import { errorHandlerMiddleware, AppError } from './middleware/error-handler';
import { healthRouter } from './routes/health.route';
import { apiV1Router } from './routes';

export function createApiApp() {
  const app = express();

  const allowedOrigins = envConfig.CORS_ORIGINS.includes(',')
    ? envConfig.CORS_ORIGINS.split(',').map((o) => o.trim())
    : envConfig.CORS_ORIGINS;

  app.use(express.json());
  app.use(cors({ origin: allowedOrigins }));
  app.use(requestCorrelationMiddleware);
  app.use(structuredLoggingMiddleware);

  // Health route at root
  app.use(healthRouter);

  // Versioned API routes under /api
  app.use('/api', apiV1Router);

  // 404 Route Not Found Handler
  app.use((req, res, next) => {
    const err: AppError = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    next(err);
  });

  // Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

if (process.env.STANDALONE_API === 'true') {
  const app = createApiApp();
  const port = envConfig.PORT || 3001;
  app.listen(port, '0.0.0.0', () => {
    logger.info(`[BCIP API] Standalone server started on port ${port}`, {
      event: 'api_server_started',
      data: { port, version: envConfig.APP_VERSION },
    });
  });
}

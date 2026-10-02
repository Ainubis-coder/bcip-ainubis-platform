import express, { type Request, type Response } from 'express';
import { envConfig } from '../config/index.ts';

export const statusRouter = express.Router();

statusRouter.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      applicationName: envConfig.APP_NAME,
      environment: envConfig.APP_ENV,
      nodeEnv: envConfig.NODE_ENV,
      applicationVersion: envConfig.APP_VERSION,
      apiVersion: envConfig.API_VERSION,
      serviceStatus: 'operational',
      demoMode: envConfig.DEMO_MODE,
      logLevel: envConfig.LOG_LEVEL,
      networking: {
        webUrl: envConfig.WEB_URL,
        apiUrl: envConfig.API_URL,
        requestIdHeader: envConfig.REQUEST_ID_HEADER,
      },
      storage: {
        provider: envConfig.STORAGE_PROVIDER,
        bucket: envConfig.STORAGE_BUCKET,
        region: envConfig.STORAGE_REGION,
        endpoint: envConfig.STORAGE_ENDPOINT,
        ssl: envConfig.STORAGE_USE_SSL,
      },
      ai: {
        enabled: envConfig.ENABLE_AI,
        ainubisEnabled: envConfig.ENABLE_AINUBIS,
        defaultProvider: envConfig.AI_PROVIDER_DEFAULT,
        temperature: envConfig.AI_TEMPERATURE,
        maxTokens: envConfig.AI_MAX_TOKENS,
        auditEnabled: envConfig.AI_AUDIT_ENABLED,
        guardrailsEnabled: envConfig.AI_GUARDRAILS_ENABLED,
      },
      worker: {
        concurrency: envConfig.WORKER_CONCURRENCY,
        jobTimeoutMs: envConfig.WORKER_JOB_TIMEOUT_MS,
        retryLimit: envConfig.WORKER_RETRY_LIMIT,
      },
      capabilities: {
        multiTenantPartitioning: 'ready',
        ainubisGatewayLayer: 'ready',
        databaseEngine: 'postgresql_configured',
        queueEngine: 'redis_configured',
        workerRuntime: 'ready',
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
});

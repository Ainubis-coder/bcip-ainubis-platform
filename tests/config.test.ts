import assert from 'assert';
import { envConfig } from '../apps/api/src/config';

export async function runConfigTests(): Promise<void> {
  console.log('[TEST] Running Configuration Validation Tests...');

  // Application
  assert.strictEqual(envConfig.APP_NAME, 'BCIP — Body Corporate Intelligence Platform');
  assert.strictEqual(envConfig.APP_ENV, 'development');
  assert.strictEqual(envConfig.APP_VERSION, '0.1.0');
  assert.strictEqual(envConfig.NODE_ENV, process.env.NODE_ENV || 'development');
  assert.strictEqual(envConfig.PORT, Number(process.env.PORT) || 3000);
  assert.strictEqual(envConfig.LOG_LEVEL, 'debug');

  // Networking
  assert.strictEqual(envConfig.WEB_URL, 'http://localhost:3000');
  assert.strictEqual(envConfig.API_URL, 'http://localhost:3001');
  assert.strictEqual(envConfig.REQUEST_ID_HEADER, 'x-request-id');
  assert.ok(envConfig.CORS_ORIGINS.includes('http://localhost:3000'));

  // Database
  assert.ok(envConfig.DATABASE_URL.includes('postgresql://bcip_user'));
  assert.strictEqual(envConfig.DB_HOST, 'localhost');
  assert.strictEqual(envConfig.DB_PORT, 5432);
  assert.strictEqual(envConfig.DB_NAME, 'bcip_platform');
  assert.strictEqual(envConfig.DB_POOL_MIN, 2);
  assert.strictEqual(envConfig.DB_POOL_MAX, 10);
  assert.strictEqual(envConfig.DB_TIMEOUT_MS, 5000);

  // Redis
  assert.ok(envConfig.REDIS_URL.includes('6379'));
  assert.strictEqual(envConfig.REDIS_HOST, 'localhost');
  assert.strictEqual(envConfig.REDIS_PORT, 6379);

  // Storage
  assert.strictEqual(envConfig.STORAGE_PROVIDER, 'minio');
  assert.strictEqual(envConfig.STORAGE_BUCKET, 'bcip-documents');
  assert.strictEqual(envConfig.STORAGE_REGION, 'eu-west-1');

  // Auth
  assert.strictEqual(envConfig.AUTH_ISSUER, 'bcip.ainubis.platform');
  assert.strictEqual(envConfig.AUTH_AUDIENCE, 'bcip-api');
  assert.ok(envConfig.AUTH_JWT_SECRET.length >= 32);

  // AI & Ainubis Foundation
  assert.strictEqual(envConfig.ENABLE_AI, false);
  assert.strictEqual(envConfig.ENABLE_AINUBIS, false);
  assert.strictEqual(envConfig.AI_PROVIDER_DEFAULT, 'gemini');
  assert.strictEqual(envConfig.AI_TEMPERATURE, 0.2);
  assert.strictEqual(envConfig.AI_MAX_TOKENS, 4096);
  assert.strictEqual(envConfig.AI_AUDIT_ENABLED, true);
  assert.strictEqual(envConfig.AI_GUARDRAILS_ENABLED, true);

  // Worker
  assert.strictEqual(envConfig.WORKER_CONCURRENCY, 5);
  assert.strictEqual(envConfig.WORKER_JOB_TIMEOUT_MS, 30000);
  assert.strictEqual(envConfig.WORKER_RETRY_LIMIT, 3);

  // Development
  assert.strictEqual(envConfig.DEMO_MODE, true);

  console.log('  ✓ Environment config parsed and validated schema successfully');
}

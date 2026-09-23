import { z } from 'zod';

const envSchema = z.object({
  // Application
  APP_NAME: z.string().default('BCIP — Body Corporate Intelligence Platform'),
  APP_ENV: z.string().default('development'),
  APP_VERSION: z.string().default('0.1.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),

  // Networking
  WEB_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),
  REQUEST_ID_HEADER: z.string().default('x-request-id'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://bcip_user:bcip_secure_password@localhost:5432/bcip_platform?sslmode=disable'
    ),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('bcip_platform'),
  DB_USER: z.string().default('bcip_user'),
  DB_PASSWORD: z.string().default('bcip_secure_password'),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_TIMEOUT_MS: z.coerce.number().default(5000),

  // Redis
  REDIS_URL: z.string().default('redis://:redis_secure_password@localhost:6379/0'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('redis_secure_password'),
  REDIS_DB: z.coerce.number().default(0),

  // Object Storage
  STORAGE_PROVIDER: z.string().default('minio'),
  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_BUCKET: z.string().default('bcip-documents'),
  STORAGE_REGION: z.string().default('eu-west-1'),
  STORAGE_ACCESS_KEY: z.string().default('minio_access_key'),
  STORAGE_SECRET_KEY: z.string().default('minio_secret_key'),
  STORAGE_USE_SSL: z
    .preprocess((val) => val === true || val === 'true', z.boolean())
    .default(false),

  // Authentication Foundation
  AUTH_JWT_SECRET: z
    .string()
    .default('development_jwt_secret_replace_before_production_32_chars_minimum'),
  AUTH_JWT_EXPIRES_IN: z.string().default('1h'),
  AUTH_REFRESH_TOKEN_SECRET: z
    .string()
    .default('development_refresh_secret_replace_before_production_32_chars_minimum'),
  AUTH_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  AUTH_ISSUER: z.string().default('bcip.ainubis.platform'),
  AUTH_AUDIENCE: z.string().default('bcip-api'),

  // Ainubis / AI Foundation
  ENABLE_AI: z
    .preprocess((val) => val === true || val === 'true', z.boolean())
    .default(false),
  ENABLE_AINUBIS: z
    .preprocess((val) => val === true || val === 'true', z.boolean())
    .default(false),
  AI_PROVIDER_DEFAULT: z.string().default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  AI_TEMPERATURE: z.coerce.number().default(0.2),
  AI_MAX_TOKENS: z.coerce.number().default(4096),
  AI_AUDIT_ENABLED: z
    .preprocess(
      (val) => val === undefined || val === true || val === 'true',
      z.boolean()
    )
    .default(true),
  AI_GUARDRAILS_ENABLED: z
    .preprocess(
      (val) => val === undefined || val === true || val === 'true',
      z.boolean()
    )
    .default(true),

  // Worker
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKER_JOB_TIMEOUT_MS: z.coerce.number().default(30000),
  WORKER_RETRY_LIMIT: z.coerce.number().default(3),

  // Development
  DEMO_MODE: z
    .preprocess(
      (val) => val === undefined || val === true || val === 'true',
      z.boolean()
    )
    .default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}

export const envConfig = parseConfig();

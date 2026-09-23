export interface WorkerConfig {
  serviceName: string;
  environment: string;
  redisUrl: string;
  concurrency: number;
  jobTimeoutMs: number;
  retryLimit: number;
  pollIntervalMs: number;
}

export function getWorkerConfig(): WorkerConfig {
  return {
    serviceName: 'bcip-worker-service',
    environment: process.env.APP_ENV || 'development',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    jobTimeoutMs: Number(process.env.WORKER_JOB_TIMEOUT_MS) || 30000,
    retryLimit: Number(process.env.WORKER_RETRY_LIMIT) || 3,
    pollIntervalMs: 5000,
  };
}

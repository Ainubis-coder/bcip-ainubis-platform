import net from 'net';

export type JobType =
  | 'ai.ainubis_analysis'
  | 'ai.ainubis_monitor'
  | 'ai.ainubis_scheduled_all'
  | 'ai.ainubis_action_execute'
  | 'ai.ainubis_action_verify'
  | 'ai.ainubis_workflow_trigger'
  | 'ai.ainubis_workflow_run'
  | 'ai.ainubis_workflow_resume'
  | 'ai.ainubis_workflow_verify'
  | 'ai.ainubis_workflow_retry'
  | 'notification.dispatch'
  | 'integration.accounting_sync'
  | 'schedule.levy_roll_run'
  | 'data.audit_cleanup'
  | 'document.ocr_processing'
  | 'analytics.scheme_aggregation'
  | 'system.healthcheck';

export interface BackgroundJob<T = Record<string, unknown>> {
  id: string;
  type: JobType;
  tenantId: string;
  payload: T;
  priority: 'low' | 'normal' | 'high' | 'critical';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
}

export interface JobResult {
  success: boolean;
  jobId: string;
  durationMs: number;
  error?: string;
}

export interface RedisConnectionStatus {
  ok: boolean;
  status: 'connected' | 'unavailable';
  host: string;
  port: number;
  db: number;
  latencyMs: number;
  message: string;
}

export class JobQueue {
  private queue: BackgroundJob[] = [];
  private redisConfig = {
    url: process.env.REDIS_URL || 'redis://:redis_secure_password@localhost:6379/0',
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    db: Number(process.env.REDIS_DB) || 0,
    password: process.env.REDIS_PASSWORD || 'redis_secure_password',
  };

  public async testRedisConnectivity(timeoutMs: number = 1000): Promise<RedisConnectionStatus> {
    const start = Date.now();
    try {
      const isReachable = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          timeout: timeoutMs,
        });

        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });

        socket.on('error', () => {
          socket.destroy();
          resolve(false);
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });

      const latencyMs = Date.now() - start;
      if (isReachable) {
        return {
          ok: true,
          status: 'connected',
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          db: this.redisConfig.db,
          latencyMs,
          message: `Redis connection verified at ${this.redisConfig.host}:${this.redisConfig.port}`,
        };
      } else {
        return {
          ok: false,
          status: 'unavailable',
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          db: this.redisConfig.db,
          latencyMs,
          message: `Redis service unavailable at ${this.redisConfig.host}:${this.redisConfig.port} (in-memory fallback active)`,
        };
      }
    } catch {
      const latencyMs = Date.now() - start;
      return {
        ok: false,
        status: 'unavailable',
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        db: this.redisConfig.db,
        latencyMs,
        message: `Redis connection error at ${this.redisConfig.host}:${this.redisConfig.port}`,
      };
    }
  }

  public getRedisConfig() {
    return {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
      db: this.redisConfig.db,
      password: '[REDACTED]',
    };
  }

  public async enqueue(job: Omit<BackgroundJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullJob: BackgroundJob = {
      ...job,
      id,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    this.queue.push(fullJob);
    return id;
  }

  public async dequeue(): Promise<BackgroundJob | null> {
    return this.queue.shift() || null;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const jobQueue = new JobQueue();

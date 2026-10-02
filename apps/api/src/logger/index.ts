import { envConfig } from '../config/index.ts';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  environment: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  event?: string;
  message: string;
  data?: Record<string, unknown>;
}

export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName: string = 'bcip-api') {
    this.serviceName = serviceName;
  }

  private sanitize(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;
    const clean: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'creditCard'];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  private write(level: LogEntry['level'], message: string, meta?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: envConfig.APP_ENV,
      requestId: meta?.requestId,
      tenantId: meta?.tenantId,
      userId: meta?.userId,
      event: meta?.event,
      message,
      data: this.sanitize(meta?.data),
    };

    // Output formatted JSON for log aggregation
    const json = JSON.stringify(entry);
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  public debug(message: string, meta?: Partial<LogEntry>) {
    if (envConfig.LOG_LEVEL === 'debug') {
      this.write('debug', message, meta);
    }
  }

  public info(message: string, meta?: Partial<LogEntry>) {
    this.write('info', message, meta);
  }

  public warn(message: string, meta?: Partial<LogEntry>) {
    this.write('warn', message, meta);
  }

  public error(message: string, meta?: Partial<LogEntry>) {
    this.write('error', message, meta);
  }
}

export const logger = new StructuredLogger('bcip-api');

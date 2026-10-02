import net from 'net';
import { getDatabaseConfig, type DatabaseConfig } from './config.ts';

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseHealthStatus {
  ok: boolean;
  status: 'connected' | 'unavailable';
  latencyMs: number;
  message: string;
}

export class DatabasePool {
  private config: DatabaseConfig;
  private isConnected: boolean = false;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = { ...getDatabaseConfig(), ...config };
  }

  public async testConnectivity(timeoutMs?: number): Promise<DatabaseHealthStatus> {
    const timeout = timeoutMs || this.config.timeoutMs || 5000;
    const start = Date.now();

    try {
      const isReachable = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({
          host: this.config.host,
          port: this.config.port,
          timeout,
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
        this.isConnected = true;
        return {
          ok: true,
          status: 'connected',
          latencyMs,
          message: `PostgreSQL connection established on ${this.config.host}:${this.config.port}`,
        };
      } else {
        this.isConnected = false;
        return {
          ok: false,
          status: 'unavailable',
          latencyMs,
          message: `PostgreSQL service unavailable at ${this.config.host}:${this.config.port}`,
        };
      }
    } catch {
      const latencyMs = Date.now() - start;
      this.isConnected = false;
      return {
        ok: false,
        status: 'unavailable',
        latencyMs,
        message: `Database probe error connecting to ${this.config.host}:${this.config.port}`,
      };
    }
  }

  public async connect(): Promise<boolean> {
    const probe = await this.testConnectivity();
    this.isConnected = probe.ok;
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  public async healthCheck(): Promise<DatabaseHealthStatus> {
    return this.testConnectivity();
  }

  public getPoolStats() {
    return {
      poolMin: this.config.poolMin,
      poolMax: this.config.poolMax,
      timeoutMs: this.config.timeoutMs,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      isConnected: this.isConnected,
    };
  }

  public async query<T = unknown>(
    sql: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    // If not connected, test connectivity or handle safe query response
    if (!this.isConnected) {
      await this.connect();
    }
    // Execution interface foundation for Prompt 003
    return {
      rows: [] as T[],
      rowCount: 0,
    };
  }

  public getConfig(): Omit<DatabaseConfig, 'password'> & { password: string } {
    return { ...this.config, password: '[REDACTED]' };
  }
}

export const dbPool = new DatabasePool();

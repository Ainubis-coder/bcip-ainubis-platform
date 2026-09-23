import net from 'net';

export interface StorageConfig {
  provider: 'minio' | 's3';
  endpoint: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
}

export function getStorageConfig(): StorageConfig {
  return {
    provider: (process.env.STORAGE_PROVIDER as 'minio' | 's3') || 'minio',
    endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
    bucket: process.env.STORAGE_BUCKET || 'bcip-documents',
    region: process.env.STORAGE_REGION || 'eu-west-1',
    accessKey: process.env.STORAGE_ACCESS_KEY || 'minio_access_key',
    secretKey: process.env.STORAGE_SECRET_KEY || 'minio_secret_key',
    useSSL: process.env.STORAGE_USE_SSL === 'true',
  };
}

export interface StorageConnectionStatus {
  ok: boolean;
  status: 'connected' | 'unavailable' | 'unreachable';
  provider: string;
  endpoint: string;
  bucket: string;
  latencyMs: number;
  message: string;
}

export class StorageClient {
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...getStorageConfig(), ...config };
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.config.endpoint) errors.push('STORAGE_ENDPOINT is required');
    if (!this.config.bucket) errors.push('STORAGE_BUCKET is required');
    if (!this.config.provider) errors.push('STORAGE_PROVIDER is required');
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public async testConnection(timeoutMs: number = 1000): Promise<StorageConnectionStatus> {
    const start = Date.now();
    try {
      const url = new URL(this.config.endpoint);
      const port = Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
      const host = url.hostname;

      const isReachable = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host, port, timeout: timeoutMs });
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
          provider: this.config.provider,
          endpoint: this.config.endpoint,
          bucket: this.config.bucket,
          latencyMs,
          message: `Storage service (${this.config.provider}) reachable at ${this.config.endpoint}`,
        };
      } else {
        return {
          ok: false,
          status: 'unavailable',
          provider: this.config.provider,
          endpoint: this.config.endpoint,
          bucket: this.config.bucket,
          latencyMs,
          message: `MinIO development service not running at ${this.config.endpoint}`,
        };
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: 'unreachable',
        provider: this.config.provider,
        endpoint: this.config.endpoint,
        bucket: this.config.bucket,
        latencyMs,
        message: `Storage configuration error: ${errorMsg}`,
      };
    }
  }

  public getConfig(): Omit<StorageConfig, 'secretKey'> & { secretKey: string } {
    return {
      ...this.config,
      secretKey: '[REDACTED]',
    };
  }

  public getBucketName(): string {
    return this.config.bucket;
  }
}

export const storageClient = new StorageClient();

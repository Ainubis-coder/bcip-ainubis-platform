export interface DatabaseConfig {
  connectionString: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
  timeoutMs: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL || 'postgresql://bcip_user:bcip_secure_password@localhost:5432/bcip_platform';
  return {
    connectionString: url,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'bcip_platform',
    user: process.env.DB_USER || 'bcip_user',
    password: process.env.DB_PASSWORD || 'bcip_secure_password',
    ssl: process.env.DB_SSL === 'true',
    poolMin: Number(process.env.DB_POOL_MIN) || 2,
    poolMax: Number(process.env.DB_POOL_MAX) || 10,
    timeoutMs: Number(process.env.DB_TIMEOUT_MS) || 5000,
  };
}

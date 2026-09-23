import assert from 'assert';
import { dbPool } from '../packages/database/src/client';
import { migrationManager } from '../packages/database/src/migrations/migration-manager';
import { jobQueue } from '../apps/worker/src/queue/job-queue';
import { storageClient } from '../packages/integrations/src/storage';

export async function runInfrastructureTests(): Promise<void> {
  console.log('[TEST] Running Infrastructure & Connectivity Tests...');

  // 1. PostgreSQL Pool Configuration & Probe
  const poolStats = dbPool.getPoolStats();
  assert.strictEqual(poolStats.port, 5432, 'DB port must be 5432');
  assert.strictEqual(poolStats.database, 'bcip_platform', 'DB name must be bcip_platform');
  assert.strictEqual(poolStats.poolMin, 2, 'Pool min must be 2');
  assert.strictEqual(poolStats.poolMax, 10, 'Pool max must be 10');
  assert.strictEqual(poolStats.timeoutMs, 5000, 'Timeout must be 5000ms');

  // Verify password is redacted in public config
  const dbConfig = dbPool.getConfig();
  assert.strictEqual(dbConfig.password, '[REDACTED]', 'Database password must be redacted in config');

  const dbHealth = await dbPool.healthCheck();
  assert.ok(typeof dbHealth.ok === 'boolean', 'DB healthcheck must return boolean ok');
  assert.ok(['connected', 'unavailable'].includes(dbHealth.status), 'DB status must be connected or unavailable');
  console.log(`  ✓ Database pool configured (Min: 2, Max: 10, Timeout: 5000ms) - Status: ${dbHealth.status}`);

  // 2. Migration Mechanism
  const pending = await migrationManager.getPendingMigrations();
  assert.ok(Array.isArray(pending), 'Pending migrations should return an array');
  const migrationResult = await migrationManager.applyMigration('0001_initial_multi_tenant_schema.sql');
  assert.strictEqual(migrationResult.success, true, 'Migration preview apply must succeed');
  console.log('  ✓ Database migration manager executed migration preview successfully');

  // 3. Redis Queue & Connectivity Probe
  const redisConfig = jobQueue.getRedisConfig();
  assert.strictEqual(redisConfig.port, 6379, 'Redis port must be 6379');
  assert.strictEqual(redisConfig.db, 0, 'Redis DB must be 0');
  assert.strictEqual(redisConfig.password, '[REDACTED]', 'Redis password must be redacted');

  const redisHealth = await jobQueue.testRedisConnectivity(500);
  assert.ok(typeof redisHealth.ok === 'boolean', 'Redis health must return boolean ok');
  assert.ok(['connected', 'unavailable'].includes(redisHealth.status), 'Redis status must be connected or unavailable');
  console.log(`  ✓ Redis queue abstraction configured - Status: ${redisHealth.status}`);

  // 4. Object Storage Configuration & Probe
  const storageValidation = storageClient.validateConfig();
  assert.strictEqual(storageValidation.valid, true, 'Storage config must be valid');
  const storageConfig = storageClient.getConfig();
  assert.strictEqual(storageConfig.provider, 'minio', 'Storage provider must be minio');
  assert.strictEqual(storageConfig.bucket, 'bcip-documents', 'Storage bucket must be bcip-documents');
  assert.strictEqual(storageConfig.secretKey, '[REDACTED]', 'Storage secret key must be redacted');

  const storageStatus = await storageClient.testConnection(500);
  assert.ok(typeof storageStatus.ok === 'boolean', 'Storage status must return boolean ok');
  console.log(`  ✓ Storage client configured (${storageConfig.provider} / ${storageConfig.bucket}) - Status: ${storageStatus.status}`);
}

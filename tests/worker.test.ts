import assert from 'assert';
import { workerRuntime } from '../apps/worker/src';
import { jobQueue } from '../apps/worker/src/queue/job-queue';
import { jobRegistry } from '../apps/worker/src/jobs';

export async function runWorkerTests(): Promise<void> {
  console.log('[TEST] Running Worker Runtime Tests...');

  // 1. Verify worker status before start
  const initialStatus = workerRuntime.getStatus();
  assert.strictEqual(initialStatus.service, 'bcip-worker-service');
  assert.ok(initialStatus.registeredJobTypes.length >= 3, 'Found registered job types');

  // 2. Enqueue and process a test job
  const jobId = await jobQueue.enqueue({
    type: 'ai.ainubis_analysis',
    tenantId: 'tenant-test',
    payload: { sample: 'test-job' },
    priority: 'normal',
    maxAttempts: 3,
  });

  assert.ok(jobId.startsWith('job_'), 'Job ID should be generated');
  assert.strictEqual(jobQueue.getQueueLength(), 1, 'Queue length should be 1');

  // Process batch
  const processedCount = await workerRuntime.processNextBatch();
  assert.strictEqual(processedCount, 1, 'Should process 1 job from queue');
  assert.strictEqual(jobQueue.getQueueLength(), 0, 'Queue should now be empty');

  console.log('  ✓ Worker runtime enqueued and processed background job successfully');
}

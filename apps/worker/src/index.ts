import { getWorkerConfig } from './config/index';
import { jobQueue } from './queue/job-queue';
import { jobRegistry } from './jobs/index';

export class WorkerRuntime {
  private isRunning: boolean = false;
  private config = getWorkerConfig();
  private loopInterval?: NodeJS.Timeout;

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[BCIP Worker] Starting worker runtime (${this.config.environment})`);
    console.log(`[BCIP Worker] Concurrency: ${this.config.concurrency}, Registered jobs: ${jobRegistry.listRegisteredTypes().length}`);

    this.loopInterval = setInterval(async () => {
      await this.processNextBatch();
    }, this.config.pollIntervalMs);
  }

  public async processNextBatch(): Promise<number> {
    let processed = 0;
    const job = await jobQueue.dequeue();
    if (job) {
      const handler = jobRegistry.getHandler(job.type);
      if (handler) {
        await handler(job);
        processed++;
      }
    }
    return processed;
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
    }
    console.log('[BCIP Worker] Worker runtime stopped cleanly');
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      service: this.config.serviceName,
      concurrency: this.config.concurrency,
      queueDepth: jobQueue.getQueueLength(),
      registeredJobTypes: jobRegistry.listRegisteredTypes(),
    };
  }
}

export const workerRuntime = new WorkerRuntime();

if (process.env.STANDALONE_WORKER === 'true') {
  workerRuntime.start();

  process.on('SIGTERM', async () => {
    await workerRuntime.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await workerRuntime.stop();
    process.exit(0);
  });
}

import { BackgroundJob, JobResult } from '../queue/job-queue';

export type JobHandler = (job: BackgroundJob) => Promise<JobResult>;

export class JobRegistry {
  private handlers: Map<string, JobHandler> = new Map();

  public register(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  public getHandler(jobType: string): JobHandler | undefined {
    return this.handlers.get(jobType);
  }

  public listRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const jobRegistry = new JobRegistry();

// Register foundational job processors
jobRegistry.register('ai.ainubis_analysis', async (job) => {
  const start = Date.now();
  return {
    success: true,
    jobId: job.id,
    durationMs: Date.now() - start,
  };
});

jobRegistry.register('notification.dispatch', async (job) => {
  const start = Date.now();
  return {
    success: true,
    jobId: job.id,
    durationMs: Date.now() - start,
  };
});

jobRegistry.register('integration.accounting_sync', async (job) => {
  const start = Date.now();
  return {
    success: true,
    jobId: job.id,
    durationMs: Date.now() - start,
  };
});

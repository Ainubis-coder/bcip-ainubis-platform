import { BackgroundJob, JobResult } from '../queue/job-queue';
import {
  ainubisPipelineHygieneService,
  ainubisContinuousMonitorService,
  AICapability,
} from '@bcip/database';

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
  const { tenantId, entityId, capability, correlationId } = job.payload as {
    tenantId: string;
    entityId: string;
    capability?: AICapability;
    correlationId?: string;
  };

  if (tenantId && entityId && capability === AICapability.CRM_PIPELINE_HYGIENE) {
    try {
      const res = await ainubisPipelineHygieneService.analyzeOpportunity(tenantId, entityId, correlationId);
      return {
        success: true,
        jobId: job.id,
        durationMs: Date.now() - start,
        metadata: { generatedCount: res.observations.length },
      };
    } catch (err: unknown) {
      return {
        success: false,
        jobId: job.id,
        durationMs: Date.now() - start,
        error: (err as Error).message,
      };
    }
  }

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

jobRegistry.register('ai.ainubis_monitor', async (job) => {
  const start = Date.now();
  const { tenantId, capability, correlationId } = (job.payload || {}) as {
    tenantId?: string;
    capability?: AICapability;
    correlationId?: string;
  };

  const targetTenant = tenantId || job.tenantId;
  if (!targetTenant) {
    return {
      success: false,
      jobId: job.id,
      durationMs: Date.now() - start,
      error: 'Tenant context is required for monitoring job',
    };
  }

  try {
    const result = await ainubisContinuousMonitorService.runTenantMonitoring(targetTenant, {
      capability,
      correlationId: correlationId || job.id,
      triggerType: 'SCHEDULED',
    });

    return {
      success: true,
      jobId: job.id,
      durationMs: Date.now() - start,
      metadata: {
        newObservations: result.newObservations.length,
        resolvedObservations: result.resolvedObservations.length,
        updatedObservations: result.updatedObservations.length,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      jobId: job.id,
      durationMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
});

jobRegistry.register('ai.ainubis_scheduled_all', async (job) => {
  const start = Date.now();
  try {
    const summary = await ainubisContinuousMonitorService.runScheduledMonitoringForAllTenants();
    return {
      success: summary.failedTenants.length === 0,
      jobId: job.id,
      durationMs: Date.now() - start,
      metadata: {
        totalTenants: summary.totalTenants,
        successfulTenants: summary.successfulTenants.length,
        failedTenants: summary.failedTenants.length,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      jobId: job.id,
      durationMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
});

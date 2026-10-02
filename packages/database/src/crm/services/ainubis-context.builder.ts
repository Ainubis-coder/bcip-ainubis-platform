/**
 * BCIP Ainubis CRM Context Builder
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 * Gathers tenant-isolated CRM data and prepares sanitized context for AI analysis.
 */

import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { TaskStatus } from '../enums.ts';
import { proposalRepository } from '../repositories/proposal.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import type {
  Opportunity,
  Activity,
  CRMTask,
  Proposal,
  Organisation,
  SchemeProspect,
} from '../types.ts';
import { aiPolicyEngine } from '@bcip/ai';

export interface OpportunityContextData {
  tenantId: string;
  opportunity: Opportunity;
  activities: Activity[];
  tasks: CRMTask[];
  proposals: Proposal[];
  organisation?: Organisation | null;
  schemeProspect?: SchemeProspect | null;
  metrics: {
    daysSinceLastActivity: number;
    openTaskCount: number;
    overdueTaskCount: number;
    hasExpectedCloseDate: boolean;
    hasEstimatedValue: boolean;
    proposalCount: number;
  };
}

export class AinubisContextBuilder {
  /**
   * Assembles complete, tenant-isolated context for a given Opportunity ID
   */
  public async buildOpportunityContext(
    tenantId: string,
    opportunityId: string
  ): Promise<OpportunityContextData> {
    if (!tenantId) {
      throw new Error('Tenant context is required for Ainubis context assembly');
    }

    const opportunity = await opportunityRepository.findById(tenantId, opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found in tenant ${tenantId}`);
    }

    // Verify tenant boundary
    if (opportunity.tenantId !== tenantId) {
      throw new Error(`Security Violation: Cross-tenant context query rejected for tenant ${tenantId}`);
    }

    const [activities, tasks, proposals] = await Promise.all([
      activityRepository.findAll(tenantId, { filter: { opportunityId } }),
      taskRepository.findAll(tenantId, { filter: { opportunityId } }),
      proposalRepository.findAll(tenantId, { filter: { opportunityId } }),
    ]);

    const organisation = opportunity.organisationId
      ? await organisationRepository.findById(tenantId, opportunity.organisationId)
      : null;

    const schemeProspect = opportunity.schemeProspectId
      ? await schemeProspectRepository.findById(tenantId, opportunity.schemeProspectId)
      : null;

    let lastActivityTime = new Date(opportunity.createdAt).getTime();
    activities.forEach((act) => {
      const actTime = new Date(act.activityAt || act.createdAt).getTime();
      if (actTime > lastActivityTime) {
        lastActivityTime = actTime;
      }
    });

    const now = Date.now();
    const daysSinceLastActivity = Math.floor((now - lastActivityTime) / (1000 * 60 * 60 * 24));

    const openTasks = tasks.filter((t) => t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS);
    const overdueTasks = openTasks.filter(
      (t) => t.dueAt && new Date(t.dueAt).getTime() < now
    );

    // Apply PII masking to summary texts if needed
    if (opportunity.description) {
      opportunity.description = aiPolicyEngine.maskPersonalData(opportunity.description);
    }

    return {
      tenantId,
      opportunity,
      activities,
      tasks,
      proposals,
      organisation,
      schemeProspect,
      metrics: {
        daysSinceLastActivity,
        openTaskCount: openTasks.length,
        overdueTaskCount: overdueTasks.length,
        hasExpectedCloseDate: Boolean(opportunity.expectedCloseDate),
        hasEstimatedValue: typeof opportunity.estimatedValue === 'number' && opportunity.estimatedValue > 0,
        proposalCount: proposals.length,
      },
    };
  }
}

export const ainubisContextBuilder = new AinubisContextBuilder();

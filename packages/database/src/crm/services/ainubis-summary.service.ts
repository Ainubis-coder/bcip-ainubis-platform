/**
 * BCIP Ainubis CRM Intelligence Summary Service
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Aggregates evidence-backed observations, calculates category health scores, and retrieves contextual intelligence.
 */

import { aiObservationRepository } from '../repositories/ai-observation.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { leadRepository } from '../repositories/lead.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import {
  HealthStatus,
  CRMHealthCategoryKey,
  IntelligenceStatus,
  IntelligenceType,
  ConfidenceLevel,
} from '../ai-types.ts';
import type {
  AinubisDashboardSummary,
  CRMHealthCategorySummary,
  CRMHealthMetricItem,
  ContextualIntelligenceResponse,
  AIObservationRecord,
} from '../ai-types.ts';
import { TaskStatus, LeadStatus, OpportunityStage } from '../enums.ts';

export class AinubisSummaryService {
  /**
   * Generates a complete executive dashboard summary and category health metrics for a tenant.
   */
  public async getDashboardSummary(tenantId: string): Promise<AinubisDashboardSummary> {
    if (!tenantId) {
      throw new Error('Tenant context is required to generate Ainubis dashboard summary');
    }

    // 1. Fetch all observations for the tenant
    const { data: allObservations } = await aiObservationRepository.findMany(tenantId, {
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    // 2. Compute Executive Summary Counters
    const activeObservations = allObservations.filter(
      (o) => o.status !== IntelligenceStatus.DISMISSED && o.status !== IntelligenceStatus.EXPIRED
    );

    const requiringAttention = allObservations.filter(
      (o) =>
        (o.status === IntelligenceStatus.GENERATED || o.status === IntelligenceStatus.REVIEWED) &&
        (o.intelligenceType === IntelligenceType.ALERT ||
          o.intelligenceType === IntelligenceType.RECOMMENDATION ||
          o.intelligenceType === IntelligenceType.HUMAN_APPROVAL_REQUIRED)
    );

    const highPriority = allObservations.filter(
      (o) =>
        o.status !== IntelligenceStatus.DISMISSED &&
        (o.confidenceLevel === ConfidenceLevel.VERY_HIGH ||
          o.confidenceLevel === ConfidenceLevel.HIGH ||
          o.intelligenceType === IntelligenceType.ALERT)
    );

    const underReview = allObservations.filter((o) => o.status === IntelligenceStatus.REVIEWED);
    const approved = allObservations.filter((o) => o.status === IntelligenceStatus.APPROVED);
    const dismissed = allObservations.filter((o) => o.status === IntelligenceStatus.DISMISSED);
    const rejected = allObservations.filter((o) => o.status === IntelligenceStatus.REJECTED);
    const executed = allObservations.filter((o) => o.status === IntelligenceStatus.EXECUTED);

    const recentObservations = allObservations.slice(0, 8);

    // Distribution counters
    const byCapability: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    allObservations.forEach((o) => {
      byCapability[o.capability] = (byCapability[o.capability] || 0) + 1;
      byType[o.intelligenceType] = (byType[o.intelligenceType] || 0) + 1;
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    // 3. Fetch underlying CRM entity counts to contextualize health
    const [opportunities, leads, organisations, schemeProspects, tasks, activities] = await Promise.all([
      opportunityRepository.findAll(tenantId),
      leadRepository.findAll(tenantId),
      organisationRepository.findAll(tenantId),
      schemeProspectRepository.findAll(tenantId),
      taskRepository.findAll(tenantId),
      activityRepository.findAll(tenantId),
    ]);

    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    // Helper: observations by entity type
    const getObsForType = (entityType: string) =>
      activeObservations.filter((o) => o.targetEntityType === entityType);

    // --- CATEGORY 1: Pipeline Health ---
    const pipelineObs = getObsForType('opportunity');
    const openOpportunities = opportunities.filter(
      (o) => o.stage !== OpportunityStage.WON && o.stage !== OpportunityStage.LOST
    );
    const stalledOpps = openOpportunities.filter((o) => {
      // Find latest activity
      const relatedActs = activities.filter((a) => a.opportunityId === o.id);
      const latestTime = relatedActs.reduce(
        (max, a) => Math.max(max, new Date(a.activityAt || a.createdAt).getTime()),
        new Date(o.createdAt).getTime()
      );
      return now - latestTime >= fourteenDaysMs;
    });
    const missingValuationOpps = openOpportunities.filter(
      (o) => !o.estimatedValue || o.estimatedValue <= 0 || !o.expectedCloseDate
    );
    const overdueFollowupOpps = openOpportunities.filter((o) => {
      const oppTasks = tasks.filter((t) => t.opportunityId === o.id);
      return oppTasks.some(
        (t) => t.status !== TaskStatus.COMPLETED && t.dueAt && new Date(t.dueAt).getTime() < now
      );
    });

    const pipelineIssues = pipelineObs.length + stalledOpps.length + missingValuationOpps.length;
    const pipelineScore = Math.max(
      20,
      Math.min(100, Math.round(100 - (pipelineIssues * 15) / Math.max(1, openOpportunities.length)))
    );
    const pipelineStatus: HealthStatus =
      pipelineScore >= 80
        ? HealthStatus.HEALTHY
        : pipelineScore >= 50
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    const pipelineMetrics: CRMHealthMetricItem[] = [
      {
        id: 'stalled_opps',
        label: 'Stalled Opportunities',
        count: stalledOpps.length,
        status: stalledOpps.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Open deals with no logged customer interactions in > 14 days',
      },
      {
        id: 'overdue_followups',
        label: 'Overdue Follow-up Actions',
        count: overdueFollowupOpps.length,
        status: overdueFollowupOpps.length === 0 ? HealthStatus.HEALTHY : HealthStatus.ATTENTION_REQUIRED,
        description: 'Opportunities linked to past-due CRM tasks',
      },
      {
        id: 'missing_valuations',
        label: 'Missing Valuation / Target Date',
        count: missingValuationOpps.length,
        status: missingValuationOpps.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Deals missing revenue estimation or expected close date',
      },
      {
        id: 'active_pipeline_observations',
        label: 'Active Pipeline Hygiene Alerts',
        count: pipelineObs.length,
        status: pipelineObs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Evidence-backed hygiene observations on active pipeline deals',
      },
    ];

    // --- CATEGORY 2: Lead Health ---
    const leadObs = getObsForType('lead');
    const openLeads = leads.filter(
      (l) => l.status !== LeadStatus.CONVERTED && l.status !== LeadStatus.LOST
    );
    const incompleteLeads = openLeads.filter(
      (l) => !l.email && !l.phone
    );
    const staleLeads = openLeads.filter((l) => {
      const relatedActs = activities.filter((a) => a.leadId === l.id);
      const latestTime = relatedActs.reduce(
        (max, a) => Math.max(max, new Date(a.activityAt || a.createdAt).getTime()),
        new Date(l.createdAt).getTime()
      );
      return now - latestTime >= fourteenDaysMs;
    });

    const leadIssues = leadObs.length + incompleteLeads.length + staleLeads.length;
    const leadScore = Math.max(
      25,
      Math.min(100, Math.round(100 - (leadIssues * 15) / Math.max(1, openLeads.length)))
    );
    const leadStatus: HealthStatus =
      leadScore >= 80
        ? HealthStatus.HEALTHY
        : leadScore >= 50
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    const leadMetrics: CRMHealthMetricItem[] = [
      {
        id: 'incomplete_leads',
        label: 'Incomplete Contact Details',
        count: incompleteLeads.length,
        status: incompleteLeads.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Leads missing both direct email and telephone contact channels',
      },
      {
        id: 'stale_leads',
        label: 'Stale Leads (> 14 Days Idle)',
        count: staleLeads.length,
        status: staleLeads.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Unqualified or new leads with zero follow-up logged in 14 days',
      },
      {
        id: 'active_lead_observations',
        label: 'Active Lead Intelligence Alerts',
        count: leadObs.length,
        status: leadObs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Evidence-backed qualification and data quality findings',
      },
    ];

    // --- CATEGORY 3: Organisation Health ---
    const orgObs = getObsForType('organisation');
    const incompleteOrgs = organisations.filter(
      (o) => !o.registrationNumber || !o.address
    );
    const orgScore = Math.max(
      30,
      Math.min(100, Math.round(100 - (incompleteOrgs.length + orgObs.length) * 12))
    );
    const orgStatus: HealthStatus =
      orgScore >= 80
        ? HealthStatus.HEALTHY
        : orgScore >= 50
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    const orgMetrics: CRMHealthMetricItem[] = [
      {
        id: 'incomplete_organisations',
        label: 'Incomplete Corporate Profiles',
        count: incompleteOrgs.length,
        status: incompleteOrgs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Organisations missing official registration number or physical address',
      },
      {
        id: 'active_org_observations',
        label: 'Organisation Intelligence Alerts',
        count: orgObs.length,
        status: orgObs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Audits on commercial accounts and managing agencies',
      },
    ];

    // --- CATEGORY 4: Scheme Prospect Health ---
    const schemeObs = getObsForType('scheme_prospect');
    const incompleteSchemes = schemeProspects.filter(
      (s) => !s.estimatedUnitCount || s.estimatedUnitCount <= 0 || !s.sectionalTitleSchemeCode
    );
    const schemeScore = Math.max(
      30,
      Math.min(100, Math.round(100 - (incompleteSchemes.length + schemeObs.length) * 15))
    );
    const schemeStatus: HealthStatus =
      schemeScore >= 80
        ? HealthStatus.HEALTHY
        : schemeScore >= 50
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    const schemeMetrics: CRMHealthMetricItem[] = [
      {
        id: 'incomplete_schemes',
        label: 'Unverified Scheme Units & Codes',
        count: incompleteSchemes.length,
        status: incompleteSchemes.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Prospects missing registered sectional title scheme codes or unit tallies',
      },
      {
        id: 'active_scheme_observations',
        label: 'Scheme Prospect Alerts',
        count: schemeObs.length,
        status: schemeObs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Intelligence alerts on body corporates and HOAs',
      },
    ];

    // --- CATEGORY 5: Tasks & Activities Health ---
    const taskObs = activeObservations.filter(
      (o) => o.targetEntityType === 'task' || o.targetEntityType === 'activity'
    );
    const overdueTasks = tasks.filter(
      (t) => t.status !== TaskStatus.COMPLETED && t.dueAt && new Date(t.dueAt).getTime() < now
    );
    const openTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);

    const taskScore = Math.max(
      20,
      Math.min(100, Math.round(100 - (overdueTasks.length * 15 + taskObs.length * 10)))
    );
    const taskStatus: HealthStatus =
      taskScore >= 80
        ? HealthStatus.HEALTHY
        : taskScore >= 50
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    const taskMetrics: CRMHealthMetricItem[] = [
      {
        id: 'overdue_tasks',
        label: 'Past Due Follow-up Tasks',
        count: overdueTasks.length,
        status: overdueTasks.length === 0 ? HealthStatus.HEALTHY : HealthStatus.ATTENTION_REQUIRED,
        description: 'Action items past execution target date requiring immediate attention',
      },
      {
        id: 'open_tasks_count',
        label: 'Open CRM Action Items',
        count: openTasks.length,
        status: HealthStatus.HEALTHY,
        description: 'Active task backlog across managing agents and portfolio managers',
      },
      {
        id: 'task_hygiene_observations',
        label: 'Task & Activity Alerts',
        count: taskObs.length,
        status: taskObs.length === 0 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        description: 'Observations regarding missed deadlines or touchpoint gaps',
      },
    ];

    const healthCategories: Record<CRMHealthCategoryKey, CRMHealthCategorySummary> = {
      [CRMHealthCategoryKey.PIPELINE]: {
        key: CRMHealthCategoryKey.PIPELINE,
        title: 'Pipeline Health',
        status: pipelineStatus,
        score: pipelineScore,
        totalEntities: opportunities.length,
        issueCount: pipelineIssues,
        metrics: pipelineMetrics,
        topObservations: pipelineObs.slice(0, 3),
        lastEvaluatedAt: new Date().toISOString(),
      },
      [CRMHealthCategoryKey.LEADS]: {
        key: CRMHealthCategoryKey.LEADS,
        title: 'Lead Health',
        status: leadStatus,
        score: leadScore,
        totalEntities: leads.length,
        issueCount: leadIssues,
        metrics: leadMetrics,
        topObservations: leadObs.slice(0, 3),
        lastEvaluatedAt: new Date().toISOString(),
      },
      [CRMHealthCategoryKey.ORGANISATIONS]: {
        key: CRMHealthCategoryKey.ORGANISATIONS,
        title: 'Organisation Health',
        status: orgStatus,
        score: orgScore,
        totalEntities: organisations.length,
        issueCount: incompleteOrgs.length + orgObs.length,
        metrics: orgMetrics,
        topObservations: orgObs.slice(0, 3),
        lastEvaluatedAt: new Date().toISOString(),
      },
      [CRMHealthCategoryKey.SCHEME_PROSPECTS]: {
        key: CRMHealthCategoryKey.SCHEME_PROSPECTS,
        title: 'Scheme Prospect Health',
        status: schemeStatus,
        score: schemeScore,
        totalEntities: schemeProspects.length,
        issueCount: incompleteSchemes.length + schemeObs.length,
        metrics: schemeMetrics,
        topObservations: schemeObs.slice(0, 3),
        lastEvaluatedAt: new Date().toISOString(),
      },
      [CRMHealthCategoryKey.TASKS_AND_ACTIVITIES]: {
        key: CRMHealthCategoryKey.TASKS_AND_ACTIVITIES,
        title: 'Task & Activity Health',
        status: taskStatus,
        score: taskScore,
        totalEntities: tasks.length + activities.length,
        issueCount: overdueTasks.length + taskObs.length,
        metrics: taskMetrics,
        topObservations: taskObs.slice(0, 3),
        lastEvaluatedAt: new Date().toISOString(),
      },
    };

    // Calculate overall health score as weighted average
    const overallScore = Math.round(
      (pipelineScore * 0.35 +
        leadScore * 0.2 +
        taskScore * 0.25 +
        orgScore * 0.1 +
        schemeScore * 0.1)
    );

    const overallStatus: HealthStatus =
      overallScore >= 80
        ? HealthStatus.HEALTHY
        : overallScore >= 55
        ? HealthStatus.WARNING
        : HealthStatus.ATTENTION_REQUIRED;

    return {
      tenantId,
      totalActive: activeObservations.length,
      requiringAttention: requiringAttention.length,
      highPriority: highPriority.length,
      underReview: underReview.length,
      approved: approved.length,
      dismissed: dismissed.length,
      rejected: rejected.length,
      executed: executed.length,
      recentObservations,
      byCapability,
      byType,
      byStatus,
      healthCategories,
      overallHealthScore: overallScore,
      overallHealthStatus: overallStatus,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves all contextual observations and health status for a specific CRM entity.
   */
  public async getContextualIntelligence(
    tenantId: string,
    targetEntityType: string,
    targetEntityId: string
  ): Promise<ContextualIntelligenceResponse> {
    if (!tenantId) {
      throw new Error('Tenant context is required to query contextual intelligence');
    }

    const { data: directObs } = await aiObservationRepository.findMany(tenantId, {
      targetEntityType,
      targetEntityId,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    // Also look for observations that reference this entity in their evidence
    const { data: allTenantObs } = await aiObservationRepository.findMany(tenantId, {
      limit: 200,
    });

    const relatedObs: AIObservationRecord[] = [];
    allTenantObs.forEach((obs) => {
      if (obs.targetEntityType === targetEntityType && obs.targetEntityId === targetEntityId) {
        return; // Already in directObs
      }
      const hasEvidenceRef = obs.evidence.some(
        (ev) => ev.entityType === targetEntityType && ev.entityId === targetEntityId
      );
      if (hasEvidenceRef) {
        relatedObs.push(obs);
      }
    });

    const combinedObs = [...directObs, ...relatedObs];
    // Deduplicate
    const uniqueObsMap = new Map<string, AIObservationRecord>();
    combinedObs.forEach((o) => uniqueObsMap.set(o.id, o));
    const observations = Array.from(uniqueObsMap.values());

    const activeIssues = observations.filter(
      (o) => o.status !== IntelligenceStatus.DISMISSED && o.status !== IntelligenceStatus.EXPIRED
    );

    const hasAlert = activeIssues.some((o) => o.intelligenceType === IntelligenceType.ALERT);
    const hasRecommendation = activeIssues.some(
      (o) => o.intelligenceType === IntelligenceType.RECOMMENDATION
    );

    const status: HealthStatus = hasAlert
      ? HealthStatus.ATTENTION_REQUIRED
      : hasRecommendation
      ? HealthStatus.WARNING
      : HealthStatus.HEALTHY;

    return {
      tenantId,
      targetEntityType,
      targetEntityId,
      observations,
      totalObservations: observations.length,
      issueCount: activeIssues.length,
      status,
      lastAnalyzedAt: new Date().toISOString(),
    };
  }
}

export const ainubisSummaryService = new AinubisSummaryService();

/**
 * BCIP Ainubis Pipeline Hygiene Service
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 * Deterministic, evidence-grounded pipeline hygiene analyzer for sales opportunities.
 */

import { ainubisContextBuilder } from './ainubis-context.builder.ts';
import { aiObservationRepository } from '../repositories/ai-observation.repository.ts';
import {
  type AIObservationRecord,
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
  type EvidenceReference,
} from '../ai-types.ts';
import { crmEventBus } from '../events/crm-events.ts';
import { CRMEventType } from '../enums.ts';
import { crmAuditService } from '../audit/crm-audit.ts';

export interface PipelineHygieneAnalysisResult {
  tenantId: string;
  opportunityId: string;
  opportunityName: string;
  observations: AIObservationRecord[];
  analyzedAt: string;
}

export class AinubisPipelineHygieneService {
  /**
   * Analyzes an opportunity for pipeline hygiene, staleness, overdue tasks, and missing forecast data.
   */
  public async analyzeOpportunity(
    tenantId: string,
    opportunityId: string,
    correlationId?: string
  ): Promise<PipelineHygieneAnalysisResult> {
    const context = await ainubisContextBuilder.buildOpportunityContext(tenantId, opportunityId);
    const { opportunity, metrics, activities, tasks } = context;

    const generatedObservations: AIObservationRecord[] = [];
    const now = new Date().toISOString();

    // 1. Check Stalled Activity (> 14 days without touchpoint)
    if (metrics.daysSinceLastActivity >= 14) {
      const evidenceList: EvidenceReference[] = [
        {
          id: `ev_${Date.now()}_1`,
          tenantId,
          entityType: 'opportunity',
          entityId: opportunity.id,
          field: 'stage',
          value: opportunity.stage,
          source: 'CRM Opportunity Record',
          evidenceType: 'STATE_CHECK',
          relevance: 1.0,
          timestamp: now,
        },
        {
          id: `ev_${Date.now()}_2`,
          tenantId,
          entityType: 'activity',
          entityId: activities.length > 0 ? activities[0].id : 'none',
          field: 'activityAt',
          value: `${metrics.daysSinceLastActivity} days ago`,
          source: 'CRM Activity Log',
          evidenceType: 'LAST_ACTIVITY_CHECK',
          relevance: 0.9,
          timestamp: now,
        },
      ];

      const obs = await aiObservationRepository.createObservation(tenantId, {
        capability: AICapability.CRM_PIPELINE_HYGIENE,
        intelligenceType: IntelligenceType.RECOMMENDATION,
        title: `Opportunity "${opportunity.name}" requires customer follow-up`,
        summary: `No customer activity has been logged for ${metrics.daysSinceLastActivity} days on opportunity in stage ${opportunity.stage}.`,
        observation: `Opportunity "${opportunity.name}" has been idle for ${metrics.daysSinceLastActivity} days. Pipeline velocity rules recommend client engagement every 14 days.`,
        confidenceScore: 92,
        confidenceLevel: ConfidenceLevel.HIGH,
        evidence: evidenceList,
        targetEntityType: 'opportunity',
        targetEntityId: opportunity.id,
        suggestedAction: {
          actionType: 'SCHEDULE_CALL',
          description: `Schedule a discovery call or email review with contact for "${opportunity.name}".`,
          payload: { opportunityId: opportunity.id },
        },
        approvalRequirement: ApprovalRequirement.RECOMMENDATION,
        status: IntelligenceStatus.GENERATED,
        modelProvider: 'ainubis-rule-engine',
        modelIdentifier: 'pipeline-hygiene-v1',
        triggerEvent: 'crm.opportunity.analyzed',
        correlationId,
      });

      generatedObservations.push(obs);
    }

    // 2. Check Overdue Tasks
    if (metrics.overdueTaskCount > 0) {
      const overdueTasks = tasks.filter(
        (t) => t.dueAt && new Date(t.dueAt).getTime() < Date.now()
      );

      const evidenceList: EvidenceReference[] = overdueTasks.map((tsk, idx) => ({
        id: `ev_tsk_${Date.now()}_${idx}`,
        tenantId,
        entityType: 'task',
        entityId: tsk.id,
        field: 'dueAt',
        value: tsk.dueAt,
        source: 'CRM Task Record',
        evidenceType: 'DUE_DATE_CHECK',
        relevance: 1.0,
        timestamp: now,
      }));

      const obs = await aiObservationRepository.createObservation(tenantId, {
        capability: AICapability.CRM_PIPELINE_HYGIENE,
        intelligenceType: IntelligenceType.ALERT,
        title: `${metrics.overdueTaskCount} overdue task(s) on "${opportunity.name}"`,
        summary: `Opportunity has ${metrics.overdueTaskCount} follow-up task(s) past their target execution deadline.`,
        observation: `Follow-up tasks associated with "${opportunity.name}" require completion or rescheduling to maintain pipeline execution SLA.`,
        confidenceScore: 98,
        confidenceLevel: ConfidenceLevel.VERY_HIGH,
        evidence: evidenceList,
        targetEntityType: 'opportunity',
        targetEntityId: opportunity.id,
        suggestedAction: {
          actionType: 'REVIEW_TASKS',
          description: `Review overdue tasks for opportunity "${opportunity.name}".`,
          payload: { opportunityId: opportunity.id, taskIds: overdueTasks.map((t) => t.id) },
        },
        approvalRequirement: ApprovalRequirement.INFORMATIONAL,
        status: IntelligenceStatus.GENERATED,
        modelProvider: 'ainubis-rule-engine',
        modelIdentifier: 'pipeline-hygiene-v1',
        triggerEvent: 'crm.opportunity.analyzed',
        correlationId,
      });

      generatedObservations.push(obs);
    }

    // 3. Check Missing Forecast Attributes (Target Close Date or Value)
    if (!metrics.hasExpectedCloseDate || !metrics.hasEstimatedValue) {
      const missingFields: string[] = [];
      if (!metrics.hasExpectedCloseDate) missingFields.push('expectedCloseDate');
      if (!metrics.hasEstimatedValue) missingFields.push('estimatedValue');

      const evidenceList: EvidenceReference[] = [
        {
          id: `ev_missing_${Date.now()}`,
          tenantId,
          entityType: 'opportunity',
          entityId: opportunity.id,
          field: missingFields.join(', '),
          value: 'MISSING_OR_ZERO',
          source: 'CRM Opportunity Schema',
          evidenceType: 'ATTRIBUTE_COMPLETENESS_CHECK',
          relevance: 0.95,
          timestamp: now,
        },
      ];

      const obs = await aiObservationRepository.createObservation(tenantId, {
        capability: AICapability.CRM_PIPELINE_HYGIENE,
        intelligenceType: IntelligenceType.OBSERVATION,
        title: `Incomplete pipeline attributes on "${opportunity.name}"`,
        summary: `Opportunity is missing ${missingFields.join(' and ')} required for accurate sales forecasting.`,
        observation: `To maintain accurate pipeline valuation and forecast reporting, update ${missingFields.join(' and ')} for "${opportunity.name}".`,
        confidenceScore: 95,
        confidenceLevel: ConfidenceLevel.HIGH,
        evidence: evidenceList,
        targetEntityType: 'opportunity',
        targetEntityId: opportunity.id,
        suggestedAction: {
          actionType: 'UPDATE_OPPORTUNITY_FIELDS',
          description: `Update missing pipeline fields (${missingFields.join(', ')}) on opportunity.`,
          payload: { opportunityId: opportunity.id, missingFields },
        },
        approvalRequirement: ApprovalRequirement.INFORMATIONAL,
        status: IntelligenceStatus.GENERATED,
        modelProvider: 'ainubis-rule-engine',
        modelIdentifier: 'pipeline-hygiene-v1',
        triggerEvent: 'crm.opportunity.analyzed',
        correlationId,
      });

      generatedObservations.push(obs);
    }

    // Publish event & audit log if observations were generated
    for (const obs of generatedObservations) {
      await crmEventBus.publish(
        CRMEventType.AI_OBSERVATION_CREATED,
        tenantId,
        {
          observationId: obs.id,
          capability: obs.capability,
          intelligenceType: obs.intelligenceType,
          targetEntityType: obs.targetEntityType,
          targetEntityId: obs.targetEntityId,
          confidenceScore: obs.confidenceScore,
        }
      );

      await crmAuditService.record(
        tenantId,
        'opportunity',
        opportunity.id,
        'ainubis_pipeline_hygiene_analyzed',
        'system_ainubis',
        undefined,
        { observationId: obs.id, capability: obs.capability },
        { correlationId }
      );
    }

    return {
      tenantId,
      opportunityId,
      opportunityName: opportunity.name,
      observations: generatedObservations,
      analyzedAt: now,
    };
  }
}

export const ainubisPipelineHygieneService = new AinubisPipelineHygieneService();

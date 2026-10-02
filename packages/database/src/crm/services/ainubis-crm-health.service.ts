/**
 * BCIP Ainubis CRM Health Evaluation Service
 * Phase 2E — Prompt 002E-002: Ainubis CRM Intelligence Dashboard & Contextual Intelligence
 * Provides deterministic, evidence-grounded health audits across CRM categories (Pipeline, Leads, Organisations, Schemes, Tasks).
 */

import { aiObservationRepository } from '../repositories/ai-observation.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { leadRepository } from '../repositories/lead.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import {
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
} from '../ai-types.ts';
import type { AIObservationRecord, EvidenceReference } from '../ai-types.ts';
import { TaskStatus, LeadStatus, OpportunityStage } from '../enums.ts';

export class AinubisCrmHealthService {
  /**
   * Evaluates deterministic hygiene and health across all CRM entities for a tenant.
   * Creates evidence-backed observations for identified conditions.
   */
  public async evaluateTenantCrmHealth(tenantId: string): Promise<AIObservationRecord[]> {
    if (!tenantId) {
      throw new Error('Tenant context is required for CRM health evaluation');
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const generated: AIObservationRecord[] = [];

    // Fetch existing active observations to avoid duplicate creation
    const { data: existingObs } = await aiObservationRepository.findMany(tenantId, { limit: 500 });
    const isAlreadyObserved = (targetEntityId: string, ruleTag: string) =>
      existingObs.some(
        (o) =>
          o.targetEntityId === targetEntityId &&
          o.title.includes(ruleTag) &&
          o.status !== IntelligenceStatus.DISMISSED &&
          o.status !== IntelligenceStatus.EXPIRED
      );

    // 1. Pipeline Checks
    const [opportunities, activities, tasks, leads, organisations, schemeProspects] = await Promise.all([
      opportunityRepository.findAll(tenantId),
      activityRepository.findAll(tenantId),
      taskRepository.findAll(tenantId),
      leadRepository.findAll(tenantId),
      organisationRepository.findAll(tenantId),
      schemeProspectRepository.findAll(tenantId),
    ]);

    for (const opp of opportunities) {
      if (opp.stage === OpportunityStage.WON || opp.stage === OpportunityStage.LOST) {
        continue;
      }

      // Check missing attributes
      if ((!opp.estimatedValue || opp.estimatedValue <= 0 || !opp.expectedCloseDate) && !isAlreadyObserved(opp.id, 'Incomplete pipeline attributes')) {
        const missing: string[] = [];
        if (!opp.estimatedValue || opp.estimatedValue <= 0) missing.push('estimatedValue');
        if (!opp.expectedCloseDate) missing.push('expectedCloseDate');

        const evidence: EvidenceReference[] = [
          {
            id: `ev_val_${Date.now()}_${opp.id}`,
            tenantId,
            entityType: 'opportunity',
            entityId: opp.id,
            field: missing.join(', '),
            value: 'MISSING_OR_ZERO',
            source: 'CRM Opportunity Schema',
            evidenceType: 'ATTRIBUTE_COMPLETENESS_CHECK',
            relevance: 1.0,
            timestamp: nowIso,
          },
        ];

        const obs = await aiObservationRepository.createObservation(tenantId, {
          capability: AICapability.CRM_PIPELINE_HYGIENE,
          intelligenceType: IntelligenceType.OBSERVATION,
          title: `Incomplete pipeline attributes on "${opp.name}"`,
          summary: `Opportunity is missing ${missing.join(' and ')} required for accurate sales forecasting.`,
          observation: `Deterministic audit found missing forecast attributes (${missing.join(', ')}) on opportunity in stage ${opp.stage}.`,
          confidenceScore: 95,
          confidenceLevel: ConfidenceLevel.HIGH,
          evidence,
          targetEntityType: 'opportunity',
          targetEntityId: opp.id,
          approvalRequirement: ApprovalRequirement.INFORMATIONAL,
          status: IntelligenceStatus.GENERATED,
          modelProvider: 'ainubis-rule-engine',
          modelIdentifier: 'crm-health-v1',
          triggerEvent: 'crm.health.evaluated',
        });
        generated.push(obs);
      }

      // Check idle time
      const relatedActs = activities.filter((a) => a.opportunityId === opp.id);
      const latestTime = relatedActs.reduce(
        (max, a) => Math.max(max, new Date(a.activityAt || a.createdAt).getTime()),
        new Date(opp.createdAt).getTime()
      );
      const daysIdle = Math.floor((now - latestTime) / (1000 * 60 * 60 * 24));

      if (daysIdle >= 14 && !isAlreadyObserved(opp.id, 'requires customer follow-up')) {
        const evidence: EvidenceReference[] = [
          {
            id: `ev_idle_${Date.now()}_${opp.id}`,
            tenantId,
            entityType: 'opportunity',
            entityId: opp.id,
            field: 'stage',
            value: opp.stage,
            source: 'CRM Opportunity Record',
            evidenceType: 'STATE_CHECK',
            relevance: 1.0,
            timestamp: nowIso,
          },
          {
            id: `ev_idle_time_${Date.now()}_${opp.id}`,
            tenantId,
            entityType: 'activity',
            entityId: relatedActs.length > 0 ? relatedActs[0].id : 'none',
            field: 'activityAt',
            value: `${daysIdle} days since last activity`,
            source: 'CRM Activity Log',
            evidenceType: 'LAST_ACTIVITY_CHECK',
            relevance: 0.95,
            timestamp: nowIso,
          },
        ];

        const obs = await aiObservationRepository.createObservation(tenantId, {
          capability: AICapability.CRM_PIPELINE_HYGIENE,
          intelligenceType: IntelligenceType.RECOMMENDATION,
          title: `Opportunity "${opp.name}" requires customer follow-up`,
          summary: `No customer activity has been logged for ${daysIdle} days on active deal in stage ${opp.stage}.`,
          observation: `Pipeline engagement rules recommend client touchpoints at least every 14 days. Deal has been dormant for ${daysIdle} days.`,
          confidenceScore: 92,
          confidenceLevel: ConfidenceLevel.HIGH,
          evidence,
          targetEntityType: 'opportunity',
          targetEntityId: opp.id,
          suggestedAction: {
            actionType: 'SCHEDULE_CALL',
            description: `Schedule a follow-up review with contact for "${opp.name}".`,
            payload: { opportunityId: opp.id },
          },
          approvalRequirement: ApprovalRequirement.RECOMMENDATION,
          status: IntelligenceStatus.GENERATED,
          modelProvider: 'ainubis-rule-engine',
          modelIdentifier: 'crm-health-v1',
          triggerEvent: 'crm.health.evaluated',
        });
        generated.push(obs);
      }
    }

    // 2. Leads Checks
    for (const lead of leads) {
      if (lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST) {
        continue;
      }

      // Check missing contact information
      if (!lead.email && !lead.phone && !isAlreadyObserved(lead.id, 'Missing contact phone & email')) {
        const evidence: EvidenceReference[] = [
          {
            id: `ev_lead_cnt_${Date.now()}_${lead.id}`,
            tenantId,
            entityType: 'lead',
            entityId: lead.id,
            field: 'email, phone',
            value: 'NONE',
            source: 'CRM Lead Schema',
            evidenceType: 'NULL_CHECK',
            relevance: 1.0,
            timestamp: nowIso,
          },
        ];

        const obs = await aiObservationRepository.createObservation(tenantId, {
          capability: AICapability.CRM_DATA_QUALITY,
          intelligenceType: IntelligenceType.ALERT,
          title: `Missing contact phone & email on lead "${lead.title}"`,
          summary: 'Lead record has no reachable telephone or email address on file.',
          observation: `Lead "${lead.title}" lacks direct contact channels. Qualification cannot proceed without trustee or agent contact information.`,
          confidenceScore: 98,
          confidenceLevel: ConfidenceLevel.VERY_HIGH,
          evidence,
          targetEntityType: 'lead',
          targetEntityId: lead.id,
          suggestedAction: {
            actionType: 'ENRICH_CONTACT_INFO',
            description: `Update contact email or telephone for "${lead.title}".`,
            payload: { leadId: lead.id },
          },
          approvalRequirement: ApprovalRequirement.RECOMMENDATION,
          status: IntelligenceStatus.GENERATED,
          modelProvider: 'ainubis-rule-engine',
          modelIdentifier: 'crm-health-v1',
          triggerEvent: 'crm.health.evaluated',
        });
        generated.push(obs);
      }
    }

    // 3. Organisation Checks
    for (const org of organisations) {
      if (!org.registrationNumber && !isAlreadyObserved(org.id, 'Unverified registration details')) {
        const evidence: EvidenceReference[] = [
          {
            id: `ev_org_reg_${Date.now()}_${org.id}`,
            tenantId,
            entityType: 'organisation',
            entityId: org.id,
            field: 'registrationNumber',
            value: null,
            source: 'CRM Organisation Schema',
            evidenceType: 'COMPLIANCE_CHECK',
            relevance: 0.9,
            timestamp: nowIso,
          },
        ];

        const obs = await aiObservationRepository.createObservation(tenantId, {
          capability: AICapability.CRM_DATA_QUALITY,
          intelligenceType: IntelligenceType.OBSERVATION,
          title: `Unverified registration details for "${org.name}"`,
          summary: 'Corporate entity is missing registered business registration number.',
          observation: `Commercial entity record for "${org.name}" is missing statutory registration details required for commercial contract generation.`,
          confidenceScore: 88,
          confidenceLevel: ConfidenceLevel.HIGH,
          evidence,
          targetEntityType: 'organisation',
          targetEntityId: org.id,
          approvalRequirement: ApprovalRequirement.INFORMATIONAL,
          status: IntelligenceStatus.GENERATED,
          modelProvider: 'ainubis-rule-engine',
          modelIdentifier: 'crm-health-v1',
          triggerEvent: 'crm.health.evaluated',
        });
        generated.push(obs);
      }
    }

    // 4. Scheme Prospect Checks
    for (const sp of schemeProspects) {
      if ((!sp.estimatedUnitCount || sp.estimatedUnitCount <= 0) && !isAlreadyObserved(sp.id, 'Unspecified unit count')) {
        const evidence: EvidenceReference[] = [
          {
            id: `ev_sp_units_${Date.now()}_${sp.id}`,
            tenantId,
            entityType: 'scheme_prospect',
            entityId: sp.id,
            field: 'estimatedUnitCount',
            value: sp.estimatedUnitCount,
            source: 'CRM Scheme Prospect Schema',
            evidenceType: 'NULL_CHECK',
            relevance: 0.95,
            timestamp: nowIso,
          },
        ];

        const obs = await aiObservationRepository.createObservation(tenantId, {
          capability: AICapability.CRM_SCHEME_INTELLIGENCE,
          intelligenceType: IntelligenceType.OBSERVATION,
          title: `Unspecified unit count on scheme prospect "${sp.name}"`,
          summary: 'Sectional title scheme prospect does not have an estimated residential/commercial unit count.',
          observation: `Scheme prospect "${sp.name}" is missing unit counts required for fee tier calculation and levy migration planning.`,
          confidenceScore: 90,
          confidenceLevel: ConfidenceLevel.HIGH,
          evidence,
          targetEntityType: 'scheme_prospect',
          targetEntityId: sp.id,
          approvalRequirement: ApprovalRequirement.INFORMATIONAL,
          status: IntelligenceStatus.GENERATED,
          modelProvider: 'ainubis-rule-engine',
          modelIdentifier: 'crm-health-v1',
          triggerEvent: 'crm.health.evaluated',
        });
        generated.push(obs);
      }
    }

    // 5. Overdue Tasks Checks
    for (const tsk of tasks) {
      if (tsk.status !== TaskStatus.COMPLETED && tsk.dueAt && new Date(tsk.dueAt).getTime() < now) {
        if (!isAlreadyObserved(tsk.id, 'Task deadline exceeded')) {
          const daysOverdue = Math.floor((now - new Date(tsk.dueAt).getTime()) / (1000 * 60 * 60 * 24));
          const evidence: EvidenceReference[] = [
            {
              id: `ev_tsk_due_${Date.now()}_${tsk.id}`,
              tenantId,
              entityType: 'task',
              entityId: tsk.id,
              field: 'dueAt',
              value: tsk.dueAt,
              source: 'CRM Task Record',
              evidenceType: 'DUE_DATE_CHECK',
              relevance: 1.0,
              timestamp: nowIso,
            },
          ];

          const obs = await aiObservationRepository.createObservation(tenantId, {
            capability: AICapability.CRM_PIPELINE_HYGIENE,
            intelligenceType: IntelligenceType.ALERT,
            title: `Task deadline exceeded on "${tsk.title}"`,
            summary: `Task is ${daysOverdue} day(s) overdue past execution target deadline.`,
            observation: `Operational follow-up "${tsk.title}" has passed its scheduled due date (${tsk.dueAt}) and requires immediate completion or rescheduling.`,
            confidenceScore: 99,
            confidenceLevel: ConfidenceLevel.VERY_HIGH,
            evidence,
            targetEntityType: 'task',
            targetEntityId: tsk.id,
            suggestedAction: {
              actionType: 'RESOLVE_TASK',
              description: `Review and complete task "${tsk.title}".`,
              payload: { taskId: tsk.id },
            },
            approvalRequirement: ApprovalRequirement.RECOMMENDATION,
            status: IntelligenceStatus.GENERATED,
            modelProvider: 'ainubis-rule-engine',
            modelIdentifier: 'crm-health-v1',
            triggerEvent: 'crm.health.evaluated',
          });
          generated.push(obs);
        }
      }
    }

    return generated;
  }
}

export const ainubisCrmHealthService = new AinubisCrmHealthService();

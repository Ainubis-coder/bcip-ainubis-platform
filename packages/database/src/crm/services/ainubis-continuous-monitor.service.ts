/**
 * BCIP Ainubis Continuous CRM Intelligence & Automated Monitoring Service
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 *
 * Provides continuous background and event-driven monitoring of CRM operational conditions:
 * - Pipeline hygiene (stalled deals, overdue followups, valuation headers, stage inactivity)
 * - Lead hygiene (contact completeness, uncontacted staleness, follow-up gaps)
 * - Organisation hygiene (registration completeness, contact linkage, relationship dormant gaps)
 * - Scheme prospect hygiene (unit count validation, opportunity linkage)
 * - Task & operational hygiene (overdue deadlines, stale open items)
 *
 * Core Governance:
 * Monitor -> Detect -> Explain -> Evidence -> Recommend -> Human Decision
 * Never autonomously alters CRM entity state.
 */

import { aiObservationRepository } from '../repositories/ai-observation.repository.ts';
import { aiMonitoringExecutionRepository } from '../repositories/ai-monitoring-execution.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { leadRepository } from '../repositories/lead.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { contactRepository } from '../repositories/contact.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import { crmEventBus } from '../events/crm-events.ts';
import { crmAuditService } from '../audit/crm-audit.ts';
import {
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  ConfidenceLevel,
  ApprovalRequirement,
  type AIObservationRecord,
  type EvidenceReference,
  type AIMonitoringExecutionRecord,
  type AIMonitoringStatusSummary,
  MonitoringTriggerType,
  MonitoringExecutionStatus,
} from '../ai-types.ts';
import { OpportunityStage, LeadStatus, TaskStatus, CRMEventType } from '../enums.ts';
import { ainubisCapabilityRegistry } from './ainubis-capability.registry.ts';

export interface ContinuousMonitoringOptions {
  capability?: AICapability;
  triggerType?: MonitoringTriggerType;
  correlationId?: string;
  actorUserId?: string;
}

export interface MonitoringRunResult {
  execution: AIMonitoringExecutionRecord;
  newObservations: AIObservationRecord[];
  resolvedObservations: AIObservationRecord[];
  updatedObservations: AIObservationRecord[];
}

export class AinubisContinuousMonitorService {
  private isEventBusSubscribed: boolean = false;
  private lastScheduledRunTime: string | null = null;

  constructor() {
    this.initEventListener();
  }

  /**
   * Subscribes to CRM domain events for event-driven targeted intelligence.
   */
  public initEventListener(): void {
    if (this.isEventBusSubscribed) return;
    this.isEventBusSubscribed = true;

    crmEventBus.subscribe('*', async (event) => {
      // Avoid infinite feedback loops from AI observation events
      if (event.eventType.startsWith('ai.')) return;

      const tenantId = event.tenantId;
      if (!tenantId) return;

      try {
        await this.handleDomainEvent(event.eventType, tenantId, event.payload as Record<string, unknown>);
      } catch (err) {
        console.error(`[AinubisMonitor] Error processing domain event ${event.eventType} for tenant ${tenantId}:`, err);
      }
    });
  }

  /**
   * Targeted event-driven evaluator that runs targeted checks on the affected entity.
   */
  public async handleDomainEvent(
    eventType: CRMEventType,
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const correlationId = `evt_mon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    switch (eventType) {
      case CRMEventType.TASK_COMPLETED:
      case CRMEventType.TASK_CREATED: {
        const taskId = (payload.id || payload.taskId) as string;
        if (taskId) {
          await this.evaluateTargetedTask(tenantId, taskId, correlationId);
        }
        break;
      }

      case CRMEventType.ACTIVITY_CREATED: {
        const oppId = payload.opportunityId as string | undefined;
        const leadId = payload.leadId as string | undefined;
        const orgId = payload.organisationId as string | undefined;

        if (oppId) await this.evaluateTargetedOpportunity(tenantId, oppId, correlationId);
        if (leadId) await this.evaluateTargetedLead(tenantId, leadId, correlationId);
        if (orgId) await this.evaluateTargetedOrganisation(tenantId, orgId, correlationId);
        break;
      }

      case CRMEventType.OPPORTUNITY_UPDATED:
      case CRMEventType.OPPORTUNITY_STAGE_CHANGED: {
        const oppId = (payload.id || payload.opportunityId) as string;
        if (oppId) await this.evaluateTargetedOpportunity(tenantId, oppId, correlationId);
        break;
      }

      case CRMEventType.LEAD_UPDATED:
      case CRMEventType.LEAD_STATUS_CHANGED:
      case CRMEventType.LEAD_CONVERTED: {
        const leadId = (payload.id || payload.leadId) as string;
        if (leadId) await this.evaluateTargetedLead(tenantId, leadId, correlationId);
        break;
      }

      case CRMEventType.ORGANISATION_UPDATED: {
        const orgId = (payload.id || payload.organisationId) as string;
        if (orgId) await this.evaluateTargetedOrganisation(tenantId, orgId, correlationId);
        break;
      }

      case CRMEventType.SCHEME_PROSPECT_UPDATED: {
        const spId = (payload.id || payload.schemeProspectId) as string;
        if (spId) await this.evaluateTargetedSchemeProspect(tenantId, spId, correlationId);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Executes a complete continuous monitoring cycle for a single tenant.
   * Strictly tenant-scoped.
   */
  public async runTenantMonitoring(
    tenantId: string,
    options?: ContinuousMonitoringOptions
  ): Promise<MonitoringRunResult> {
    if (!tenantId) {
      throw new Error('Tenant context is strictly required for continuous monitoring');
    }

    const startTime = Date.now();
    const correlationId = options?.correlationId || `mon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const triggerType = options?.triggerType || MonitoringTriggerType.SCHEDULED;
    const capabilityFilter = options?.capability;

    // Start execution record
    const execution = await aiMonitoringExecutionRepository.recordExecution(tenantId, {
      capability: capabilityFilter || 'ALL_CAPABILITIES',
      triggerType,
      status: MonitoringExecutionStatus.RUNNING,
      startedAt: new Date(startTime).toISOString(),
      observationsGenerated: 0,
      observationsUpdated: 0,
      observationsResolved: 0,
      correlationId,
      details: { capabilityFilter, actorUserId: options?.actorUserId },
    });

    const newObservations: AIObservationRecord[] = [];
    const updatedObservations: AIObservationRecord[] = [];
    const resolvedObservations: AIObservationRecord[] = [];

    try {
      // 1. Fetch current CRM data for tenant
      const [opportunities, leads, organisations, contacts, schemeProspects, tasks, activities] = await Promise.all([
        opportunityRepository.findAll(tenantId),
        leadRepository.findAll(tenantId),
        organisationRepository.findAll(tenantId),
        contactRepository.findAll(tenantId),
        schemeProspectRepository.findAll(tenantId),
        taskRepository.findAll(tenantId),
        activityRepository.findAll(tenantId),
      ]);

      const now = Date.now();
      const nowIso = new Date().toISOString();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      // ----------------------------------------------------------------------
      // CAPABILITY 1: CRM_PIPELINE_HYGIENE
      // ----------------------------------------------------------------------
      if (!capabilityFilter || capabilityFilter === AICapability.CRM_PIPELINE_HYGIENE) {
        for (const opp of opportunities) {
          const isClosed = opp.stage === OpportunityStage.WON || opp.stage === OpportunityStage.LOST;

          // 1.1 Incomplete forecast attributes (missing valuation or close date)
          const valuationCondition = 'pipeline.incomplete_attributes';
          if (!isClosed && (!opp.estimatedValue || opp.estimatedValue <= 0 || !opp.expectedCloseDate)) {
            const missingFields: string[] = [];
            if (!opp.estimatedValue || opp.estimatedValue <= 0) missingFields.push('estimatedValue');
            if (!opp.expectedCloseDate) missingFields.push('expectedCloseDate');

            const evidence: EvidenceReference[] = [
              {
                id: `ev_val_${now}_${opp.id}`,
                tenantId,
                entityType: 'opportunity',
                entityId: opp.id,
                field: missingFields.join(', '),
                value: 'MISSING_OR_ZERO',
                source: 'CRM Opportunity Schema',
                evidenceType: 'ATTRIBUTE_COMPLETENESS_CHECK',
                relevance: 1.0,
                timestamp: nowIso,
              },
            ];

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_PIPELINE_HYGIENE,
              intelligenceType: IntelligenceType.OBSERVATION,
              title: `Incomplete pipeline attributes on "${opp.name}"`,
              summary: `Opportunity is missing ${missingFields.join(' and ')} required for accurate sales forecasting.`,
              observation: `Deterministic monitoring identified missing commercial forecast fields (${missingFields.join(', ')}) on opportunity in stage ${opp.stage}.`,
              confidenceScore: 95,
              confidenceLevel: ConfidenceLevel.HIGH,
              evidence,
              targetEntityType: 'opportunity',
              targetEntityId: opp.id,
              conditionKey: valuationCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.INFORMATIONAL,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-pipeline-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            // Auto-resolve if previously flagged but now complete or closed
            const resolved = await this.autoResolveCondition(tenantId, 'opportunity', opp.id, valuationCondition);
            if (resolved) resolvedObservations.push(resolved);
          }

          // 1.2 Stalled opportunity (no activity > 14 days)
          const stalledCondition = 'pipeline.stalled_opportunity';
          const relatedActs = activities.filter((a) => a.opportunityId === opp.id);
          const latestActTime = relatedActs.reduce(
            (max, a) => Math.max(max, new Date(a.activityAt || a.createdAt).getTime()),
            new Date(opp.createdAt).getTime()
          );
          const daysIdle = Math.floor((now - latestActTime) / (1000 * 60 * 60 * 24));

          if (!isClosed && daysIdle >= 14) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_idle_state_${now}_${opp.id}`,
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
                id: `ev_idle_time_${now}_${opp.id}`,
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

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
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
              conditionKey: stalledCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              suggestedAction: {
                actionType: 'SCHEDULE_CALL',
                description: `Schedule a follow-up review with contact for "${opp.name}".`,
                payload: { opportunityId: opp.id },
              },
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-pipeline-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            // Auto-resolve if recent activity recorded or closed
            const resolved = await this.autoResolveCondition(tenantId, 'opportunity', opp.id, stalledCondition);
            if (resolved) resolvedObservations.push(resolved);
          }

          // 1.3 Overdue deal follow-up tasks
          const dealTasks = tasks.filter((t) => t.opportunityId === opp.id && t.status !== TaskStatus.COMPLETED);
          const overdueDealTasks = dealTasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now);
          const dealFollowupCondition = 'pipeline.overdue_followup';

          if (!isClosed && overdueDealTasks.length > 0) {
            const evidence: EvidenceReference[] = overdueDealTasks.map((t) => ({
              id: `ev_dt_${now}_${t.id}`,
              tenantId,
              entityType: 'task',
              entityId: t.id,
              field: 'dueAt',
              value: t.dueAt,
              source: 'CRM Task Record',
              evidenceType: 'DUE_DATE_CHECK',
              relevance: 1.0,
              timestamp: nowIso,
            }));

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_PIPELINE_HYGIENE,
              intelligenceType: IntelligenceType.ALERT,
              title: `Overdue follow-up task on opportunity "${opp.name}"`,
              summary: `${overdueDealTasks.length} task(s) are overdue on active deal in stage ${opp.stage}.`,
              observation: `Opportunity "${opp.name}" has ${overdueDealTasks.length} overdue task(s). Prompt resolution is recommended to avoid pipeline slippage.`,
              confidenceScore: 96,
              confidenceLevel: ConfidenceLevel.VERY_HIGH,
              evidence,
              targetEntityType: 'opportunity',
              targetEntityId: opp.id,
              conditionKey: dealFollowupCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-pipeline-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'opportunity', opp.id, dealFollowupCondition);
            if (resolved) resolvedObservations.push(resolved);
          }
        }
      }

      // ----------------------------------------------------------------------
      // CAPABILITY 2: CRM_LEAD_HYGIENE
      // ----------------------------------------------------------------------
      if (!capabilityFilter || capabilityFilter === AICapability.CRM_LEAD_HYGIENE) {
        for (const lead of leads) {
          const isClosedLead = lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST;

          // 2.1 Missing contact telephone and email
          const leadContactCondition = 'lead.missing_contact_info';
          if (!isClosedLead && !lead.email && !lead.phone) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_ld_cnt_${now}_${lead.id}`,
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

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_LEAD_HYGIENE,
              intelligenceType: IntelligenceType.ALERT,
              title: `Missing contact phone & email on lead "${lead.title}"`,
              summary: 'Lead record has no reachable telephone or email address on file.',
              observation: `Lead "${lead.title}" lacks direct contact channels. Qualification cannot proceed without trustee or agent contact information.`,
              confidenceScore: 98,
              confidenceLevel: ConfidenceLevel.VERY_HIGH,
              evidence,
              targetEntityType: 'lead',
              targetEntityId: lead.id,
              conditionKey: leadContactCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              suggestedAction: {
                actionType: 'ENRICH_CONTACT_INFO',
                description: `Update contact email or telephone for "${lead.title}".`,
                payload: { leadId: lead.id },
              },
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-lead-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'lead', lead.id, leadContactCondition);
            if (resolved) resolvedObservations.push(resolved);
          }

          // 2.2 Stale uncontacted lead (NEW status, created > 14 days ago without activity)
          const staleLeadCondition = 'lead.stale_uncontacted';
          const leadActs = activities.filter((a) => a.leadId === lead.id);
          const daysSinceCreation = Math.floor((now - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));

          if (!isClosedLead && lead.status === LeadStatus.NEW && leadActs.length === 0 && daysSinceCreation >= 14) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_ld_stale_${now}_${lead.id}`,
                tenantId,
                entityType: 'lead',
                entityId: lead.id,
                field: 'createdAt',
                value: `${daysSinceCreation} days without outreach`,
                source: 'CRM Lead Record',
                evidenceType: 'IDLE_TIME_CHECK',
                relevance: 0.95,
                timestamp: nowIso,
              },
            ];

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_LEAD_HYGIENE,
              intelligenceType: IntelligenceType.RECOMMENDATION,
              title: `Uncontacted lead "${lead.title}" is stale (${daysSinceCreation} days)`,
              summary: `Inbound lead has remained in NEW status for ${daysSinceCreation} days without outreach activity.`,
              observation: `Lead "${lead.title}" was received ${daysSinceCreation} days ago but has no logged communications. Early engagement improves conversion rate.`,
              confidenceScore: 90,
              confidenceLevel: ConfidenceLevel.HIGH,
              evidence,
              targetEntityType: 'lead',
              targetEntityId: lead.id,
              conditionKey: staleLeadCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-lead-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'lead', lead.id, staleLeadCondition);
            if (resolved) resolvedObservations.push(resolved);
          }
        }
      }

      // ----------------------------------------------------------------------
      // CAPABILITY 3: CRM_ORGANISATION_HYGIENE
      // ----------------------------------------------------------------------
      if (!capabilityFilter || capabilityFilter === AICapability.CRM_ORGANISATION_HYGIENE) {
        for (const org of organisations) {
          // 3.1 Unverified registration number
          const orgRegCondition = 'org.missing_registration';
          if (!org.registrationNumber) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_org_reg_${now}_${org.id}`,
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

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_ORGANISATION_HYGIENE,
              intelligenceType: IntelligenceType.OBSERVATION,
              title: `Unverified registration details for "${org.name}"`,
              summary: 'Corporate entity is missing registered business registration number.',
              observation: `Commercial entity record for "${org.name}" is missing statutory registration details required for commercial contract generation.`,
              confidenceScore: 88,
              confidenceLevel: ConfidenceLevel.HIGH,
              evidence,
              targetEntityType: 'organisation',
              targetEntityId: org.id,
              conditionKey: orgRegCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.INFORMATIONAL,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-org-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'organisation', org.id, orgRegCondition);
            if (resolved) resolvedObservations.push(resolved);
          }

          // 3.2 Missing key contacts
          const orgContactsCondition = 'org.no_contacts';
          const orgContactCount = contacts.filter((c) => c.organisationId === org.id).length;
          if (orgContactCount === 0) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_org_cnt_${now}_${org.id}`,
                tenantId,
                entityType: 'organisation',
                entityId: org.id,
                field: 'contacts',
                value: 0,
                source: 'CRM Contact Repository',
                evidenceType: 'COUNT_CHECK',
                relevance: 0.95,
                timestamp: nowIso,
              },
            ];

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_ORGANISATION_HYGIENE,
              intelligenceType: IntelligenceType.RECOMMENDATION,
              title: `No linked contacts for organisation "${org.name}"`,
              summary: 'Organisation has no individual key contacts or trustees linked.',
              observation: `Organisation "${org.name}" has 0 contacts associated. Adding portfolio managers or trustee chairpersons enables structured communications.`,
              confidenceScore: 90,
              confidenceLevel: ConfidenceLevel.HIGH,
              evidence,
              targetEntityType: 'organisation',
              targetEntityId: org.id,
              conditionKey: orgContactsCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-org-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'organisation', org.id, orgContactsCondition);
            if (resolved) resolvedObservations.push(resolved);
          }
        }
      }

      // ----------------------------------------------------------------------
      // CAPABILITY 4: CRM_SCHEME_PROSPECT_HYGIENE
      // ----------------------------------------------------------------------
      if (!capabilityFilter || capabilityFilter === AICapability.CRM_SCHEME_PROSPECT_HYGIENE) {
        for (const sp of schemeProspects) {
          const spUnitsCondition = 'scheme.unspecified_units';
          if (!sp.estimatedUnitCount || sp.estimatedUnitCount <= 0) {
            const evidence: EvidenceReference[] = [
              {
                id: `ev_sp_u_${now}_${sp.id}`,
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

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_SCHEME_PROSPECT_HYGIENE,
              intelligenceType: IntelligenceType.OBSERVATION,
              title: `Unspecified unit count on scheme prospect "${sp.name}"`,
              summary: 'Sectional title scheme prospect does not have an estimated residential/commercial unit count.',
              observation: `Scheme prospect "${sp.name}" is missing unit counts required for fee tier calculation and levy migration planning.`,
              confidenceScore: 90,
              confidenceLevel: ConfidenceLevel.HIGH,
              evidence,
              targetEntityType: 'scheme_prospect',
              targetEntityId: sp.id,
              conditionKey: spUnitsCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              approvalRequirement: ApprovalRequirement.INFORMATIONAL,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-scheme-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'scheme_prospect', sp.id, spUnitsCondition);
            if (resolved) resolvedObservations.push(resolved);
          }
        }
      }

      // ----------------------------------------------------------------------
      // CAPABILITY 5: CRM_TASK_HYGIENE
      // ----------------------------------------------------------------------
      if (!capabilityFilter || capabilityFilter === AICapability.CRM_TASK_HYGIENE) {
        for (const tsk of tasks) {
          const taskOverdueCondition = 'task.deadline_exceeded';
          const isOverdue = tsk.status !== TaskStatus.COMPLETED && tsk.dueAt && new Date(tsk.dueAt).getTime() < now;

          if (isOverdue) {
            const daysOverdue = Math.floor((now - new Date(tsk.dueAt!).getTime()) / (1000 * 60 * 60 * 24));
            const evidence: EvidenceReference[] = [
              {
                id: `ev_tsk_${now}_${tsk.id}`,
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

            const obs = await this.recordOrDeduplicateObservation(tenantId, {
              capability: AICapability.CRM_TASK_HYGIENE,
              intelligenceType: IntelligenceType.ALERT,
              title: `Task deadline exceeded on "${tsk.title}"`,
              summary: `Task is ${daysOverdue} day(s) overdue past execution target deadline.`,
              observation: `Operational follow-up "${tsk.title}" has passed its scheduled due date (${tsk.dueAt}) and requires immediate completion or rescheduling.`,
              confidenceScore: 99,
              confidenceLevel: ConfidenceLevel.VERY_HIGH,
              evidence,
              targetEntityType: 'task',
              targetEntityId: tsk.id,
              conditionKey: taskOverdueCondition,
              sourceMode: 'AUTOMATED_MONITORING',
              suggestedAction: {
                actionType: 'RESOLVE_TASK',
                description: `Review and complete task "${tsk.title}".`,
                payload: { taskId: tsk.id },
              },
              approvalRequirement: ApprovalRequirement.RECOMMENDATION,
              status: IntelligenceStatus.GENERATED,
              modelProvider: 'ainubis-monitor-engine',
              modelIdentifier: 'crm-task-monitor-v1',
              correlationId,
            });

            if (obs.isNew) newObservations.push(obs.record);
            else updatedObservations.push(obs.record);
          } else {
            const resolved = await this.autoResolveCondition(tenantId, 'task', tsk.id, taskOverdueCondition);
            if (resolved) resolvedObservations.push(resolved);
          }
        }
      }

      // Complete execution record
      const durationMs = Date.now() - startTime;
      await aiMonitoringExecutionRepository.updateExecution(tenantId, execution.id, {
        status: MonitoringExecutionStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        durationMs,
        observationsGenerated: newObservations.length,
        observationsUpdated: updatedObservations.length,
        observationsResolved: resolvedObservations.length,
      });

      this.lastScheduledRunTime = new Date().toISOString();

      await crmAuditService.record(
        tenantId,
        'opportunity',
        execution.id,
        'MONITORING_CYCLE_COMPLETED',
        options?.actorUserId || 'system.ainubis_monitor',
        undefined,
        undefined,
        {
          triggerType,
          newObservations: newObservations.length,
          resolvedObservations: resolvedObservations.length,
          durationMs,
        }
      );

      return {
        execution: (await aiMonitoringExecutionRepository.findById(tenantId, execution.id))!,
        newObservations,
        resolvedObservations,
        updatedObservations,
      };
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Unknown monitoring error';
      await aiMonitoringExecutionRepository.updateExecution(tenantId, execution.id, {
        status: MonitoringExecutionStatus.FAILED,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: errorMsg,
      });

      throw err;
    }
  }

  /**
   * Evaluates a targeted task on event (e.g. task completed or updated).
   */
  public async evaluateTargetedTask(tenantId: string, taskId: string, correlationId: string): Promise<void> {
    const task = await taskRepository.findById(tenantId, taskId);
    if (!task) return;

    const taskOverdueCondition = 'task.deadline_exceeded';
    const now = Date.now();

    if (task.status === TaskStatus.COMPLETED || !task.dueAt || new Date(task.dueAt).getTime() >= now) {
      await this.autoResolveCondition(tenantId, 'task', task.id, taskOverdueCondition);
    } else {
      // Still overdue, record/update
      const daysOverdue = Math.floor((now - new Date(task.dueAt).getTime()) / (1000 * 60 * 60 * 24));
      await this.recordOrDeduplicateObservation(tenantId, {
        capability: AICapability.CRM_TASK_HYGIENE,
        intelligenceType: IntelligenceType.ALERT,
        title: `Task deadline exceeded on "${task.title}"`,
        summary: `Task is ${daysOverdue} day(s) overdue past execution target deadline.`,
        observation: `Operational follow-up "${task.title}" has passed its scheduled due date (${task.dueAt}) and requires immediate completion or rescheduling.`,
        confidenceScore: 99,
        confidenceLevel: ConfidenceLevel.VERY_HIGH,
        evidence: [
          {
            id: `ev_tsk_target_${now}_${task.id}`,
            tenantId,
            entityType: 'task',
            entityId: task.id,
            field: 'dueAt',
            value: task.dueAt,
            source: 'CRM Task Record',
            evidenceType: 'DUE_DATE_CHECK',
            relevance: 1.0,
            timestamp: new Date().toISOString(),
          },
        ],
        targetEntityType: 'task',
        targetEntityId: task.id,
        conditionKey: taskOverdueCondition,
        sourceMode: 'EVENT_TRIGGERED',
        approvalRequirement: ApprovalRequirement.RECOMMENDATION,
        status: IntelligenceStatus.GENERATED,
        modelProvider: 'ainubis-event-engine',
        modelIdentifier: 'crm-task-event-v1',
        correlationId,
      });
    }

    // Also check parent opportunity if present
    if (task.opportunityId) {
      await this.evaluateTargetedOpportunity(tenantId, task.opportunityId, correlationId);
    }
  }

  /**
   * Evaluates a targeted opportunity on event.
   */
  public async evaluateTargetedOpportunity(
    tenantId: string,
    opportunityId: string,
    correlationId: string
  ): Promise<void> {
    const opp = await opportunityRepository.findById(tenantId, opportunityId);
    if (!opp) return;

    const now = Date.now();
    const isClosed = opp.stage === OpportunityStage.WON || opp.stage === OpportunityStage.LOST;

    // Check stalled condition
    const stalledCondition = 'pipeline.stalled_opportunity';
    const activities = await activityRepository.findAll(tenantId);
    const relatedActs = activities.filter((a) => a.opportunityId === opp.id);
    const latestActTime = relatedActs.reduce(
      (max, a) => Math.max(max, new Date(a.activityAt || a.createdAt).getTime()),
      new Date(opp.createdAt).getTime()
    );
    const daysIdle = Math.floor((now - latestActTime) / (1000 * 60 * 60 * 24));

    if (isClosed || daysIdle < 14) {
      await this.autoResolveCondition(tenantId, 'opportunity', opp.id, stalledCondition);
    }

    // Check overdue followups
    const tasks = await taskRepository.findAll(tenantId);
    const overdueTasks = tasks.filter(
      (t) => t.opportunityId === opp.id && t.status !== TaskStatus.COMPLETED && t.dueAt && new Date(t.dueAt).getTime() < now
    );
    const followupCondition = 'pipeline.overdue_followup';
    if (isClosed || overdueTasks.length === 0) {
      await this.autoResolveCondition(tenantId, 'opportunity', opp.id, followupCondition);
    }
  }

  /**
   * Evaluates a targeted lead on event.
   */
  public async evaluateTargetedLead(tenantId: string, leadId: string, _correlationId: string): Promise<void> {
    const lead = await leadRepository.findById(tenantId, leadId);
    if (!lead) return;

    const contactCondition = 'lead.missing_contact_info';
    if (lead.email || lead.phone || lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST) {
      await this.autoResolveCondition(tenantId, 'lead', lead.id, contactCondition);
    }

    const staleCondition = 'lead.stale_uncontacted';
    if (lead.status !== LeadStatus.NEW) {
      await this.autoResolveCondition(tenantId, 'lead', lead.id, staleCondition);
    }
  }

  /**
   * Evaluates a targeted organisation on event.
   */
  public async evaluateTargetedOrganisation(tenantId: string, orgId: string, _correlationId: string): Promise<void> {
    const org = await organisationRepository.findById(tenantId, orgId);
    if (!org) return;

    if (org.registrationNumber) {
      await this.autoResolveCondition(tenantId, 'organisation', org.id, 'org.missing_registration');
    }

    const contacts = await contactRepository.findAll(tenantId);
    const orgContacts = contacts.filter((c) => c.organisationId === org.id);
    if (orgContacts.length > 0) {
      await this.autoResolveCondition(tenantId, 'organisation', org.id, 'org.no_contacts');
    }
  }

  /**
   * Evaluates a targeted scheme prospect on event.
   */
  public async evaluateTargetedSchemeProspect(tenantId: string, spId: string, _correlationId: string): Promise<void> {
    const sp = await schemeProspectRepository.findById(tenantId, spId);
    if (!sp) return;

    if (sp.estimatedUnitCount && sp.estimatedUnitCount > 0) {
      await this.autoResolveCondition(tenantId, 'scheme_prospect', sp.id, 'scheme.unspecified_units');
    }
  }

  /**
   * Idempotent observation handler:
   * - If an active observation exists with the same (targetEntityType, targetEntityId, conditionKey),
   *   does NOT create a duplicate. Updates updatedAt.
   * - If a previously RESOLVED or DISMISSED observation exists, reopens it or creates a new occurrence.
   * - If no observation exists, creates a fresh observation.
   */
  private async recordOrDeduplicateObservation(
    tenantId: string,
    dto: Parameters<typeof aiObservationRepository.createObservation>[1] & { conditionKey: string }
  ): Promise<{ record: AIObservationRecord; isNew: boolean }> {
    const { targetEntityType, targetEntityId, conditionKey } = dto;

    if (targetEntityType && targetEntityId && conditionKey) {
      // 1. Check for active observation
      const active = await aiObservationRepository.findActiveByCondition(
        tenantId,
        targetEntityType,
        targetEntityId,
        conditionKey
      );

      if (active) {
        // Idempotent: Update evidence & timestamp without duplicate
        const updated = await aiObservationRepository.update(tenantId, active.id, {
          evidence: dto.evidence,
          confidenceScore: dto.confidenceScore,
          updatedAt: new Date().toISOString(),
        });
        return { record: updated!, isNew: false };
      }

      // 2. Check for previously resolved or dismissed observation (reopening strategy)
      const latest = await aiObservationRepository.findLatestByCondition(
        tenantId,
        targetEntityType,
        targetEntityId,
        conditionKey
      );

      if (latest && (latest.status === IntelligenceStatus.RESOLVED || latest.status === IntelligenceStatus.DISMISSED)) {
        // Reopen into a new governed occurrence referencing previous resolution
        const reopened = await aiObservationRepository.reopenObservation(tenantId, latest.id, {
          ...dto,
          status: IntelligenceStatus.REOPENED,
          reopenedAt: new Date().toISOString(),
          reopenedFromId: latest.id,
        });

        // Publish event for newly reopened observation
        crmEventBus.publish(
          CRMEventType.AI_OBSERVATION_CREATED,
          tenantId,
          { observationId: reopened!.id, capability: reopened!.capability, conditionKey },
          'ainubis-continuous-monitor'
        ).catch(() => {});

        return { record: reopened!, isNew: true };
      }
    }

    // 3. Brand new observation
    const created = await aiObservationRepository.createObservation(tenantId, {
      ...dto,
      status: dto.status || IntelligenceStatus.GENERATED,
    });

    crmEventBus.publish(
      CRMEventType.AI_OBSERVATION_CREATED,
      tenantId,
      { observationId: created.id, capability: created.capability, conditionKey: dto.conditionKey },
      'ainubis-continuous-monitor'
    ).catch(() => {});

    return { record: created, isNew: true };
  }

  /**
   * Automatically resolves an active observation if its condition is no longer present.
   */
  private async autoResolveCondition(
    tenantId: string,
    targetEntityType: string,
    targetEntityId: string,
    conditionKey: string
  ): Promise<AIObservationRecord | null> {
    const active = await aiObservationRepository.findActiveByCondition(
      tenantId,
      targetEntityType,
      targetEntityId,
      conditionKey
    );

    if (!active) return null;

    return aiObservationRepository.resolveObservation(
      tenantId,
      active.id,
      `Observed condition ${conditionKey} verified resolved in latest CRM data.`
    );
  }

  /**
   * Scheduled runner across all eligible tenants with FAILURE ISOLATION.
   * If Tenant B fails, Tenant A and Tenant C continue unimpeded.
   */
  public async runScheduledMonitoringForAllTenants(): Promise<{
    totalTenants: number;
    successfulTenants: string[];
    failedTenants: string[];
    errors: Array<{ tenantId: string; error: string }>;
  }> {
    const allTenants = await this.discoverActiveTenants();
    const successfulTenants: string[] = [];
    const failedTenants: string[] = [];
    const errors: Array<{ tenantId: string; error: string }> = [];

    for (const tenantId of allTenants) {
      try {
        await this.runTenantMonitoring(tenantId, {
          triggerType: MonitoringTriggerType.SCHEDULED,
        });
        successfulTenants.push(tenantId);
      } catch (err: unknown) {
        // FAILURE ISOLATION: A failure for one tenant does not stop monitoring for others!
        const errorMsg = (err as Error).message || 'Failed monitoring run';
        failedTenants.push(tenantId);
        errors.push({ tenantId, error: errorMsg });
        console.error(`[AinubisContinuousMonitor] Tenant ${tenantId} monitoring failed:`, errorMsg);
      }
    }

    return {
      totalTenants: allTenants.length,
      successfulTenants,
      failedTenants,
      errors,
    };
  }

  /**
   * Aggregates distinct active tenant IDs in the system.
   */
  public async discoverActiveTenants(): Promise<string[]> {
    const tenantSet = new Set<string>();

    const [opps, leads, orgs] = await Promise.all([
      Promise.resolve(opportunityRepository.findAllUnscoped()),
      Promise.resolve(leadRepository.findAllUnscoped()),
      Promise.resolve(organisationRepository.findAllUnscoped()),
    ]);

    opps.forEach((o) => o.tenantId && tenantSet.add(o.tenantId));
    leads.forEach((l) => l.tenantId && tenantSet.add(l.tenantId));
    orgs.forEach((org) => org.tenantId && tenantSet.add(org.tenantId));

    // Fallback default demo tenant if empty
    if (tenantSet.size === 0) {
      tenantSet.add('ten-001');
    }

    return Array.from(tenantSet);
  }

  /**
   * Retrieves monitoring summary for a given tenant.
   */
  public async getMonitoringStatus(tenantId: string): Promise<AIMonitoringStatusSummary> {
    const [latestExec, { data: recentExecs }, { data: activeObs }, { data: resolvedObs }] = await Promise.all([
      aiMonitoringExecutionRepository.getLatestForTenant(tenantId),
      aiMonitoringExecutionRepository.findMany(tenantId, { limit: 10 }),
      aiObservationRepository.findMany(tenantId, {
        limit: 1000,
        status: IntelligenceStatus.GENERATED,
      }),
      aiObservationRepository.findMany(tenantId, {
        limit: 1000,
        status: IntelligenceStatus.RESOLVED,
      }),
    ]);

    const recentErrors = recentExecs
      .filter((e) => e.status === MonitoringExecutionStatus.FAILED && e.error)
      .map((e) => ({
        timestamp: e.startedAt,
        message: e.error!,
        capability: e.capability,
      }));

    const activeCapabilitiesCount = ainubisCapabilityRegistry.getMonitoringAvailableCapabilities().length;

    return {
      tenantId,
      monitoringActive: true,
      status: latestExec?.status === MonitoringExecutionStatus.FAILED ? 'ERROR' : 'IDLE',
      lastRunAt: latestExec?.completedAt || latestExec?.startedAt || this.lastScheduledRunTime,
      nextScheduledRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Hourly
      totalActiveObservations: activeObs.length,
      totalResolvedObservations: resolvedObs.length,
      activeCapabilitiesCount,
      recentExecutions: recentExecs,
      recentErrors,
    };
  }
}

export const ainubisContinuousMonitorService = new AinubisContinuousMonitorService();

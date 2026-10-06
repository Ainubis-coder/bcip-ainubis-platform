/**
 * BCIP Ainubis AI Action Execution Service
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 * Governs the complete pre-execution validation, stale-state guardrails, CRM service delegation, and verification pipeline.
 */

import { aiActionRepository } from '../repositories/ai-action.repository.ts';
import { taskService } from './task.service.ts';
import { activityService } from './activity.service.ts';
import { leadService } from './lead.service.ts';
import { opportunityService } from './opportunity.service.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { leadRepository } from '../repositories/lead.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import { organisationRepository } from '../repositories/organisation.repository.ts';
import { schemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { crmEventBus } from '../events/crm-events.ts';
import { crmAuditService } from '../audit/crm-audit.ts';
import { ainubisActionVerificationService } from './ainubis-action-verification.service.ts';
import {
  type AIActionRecord,
  AIActionType,
  AIActionStatus,
  AIActionApprovalRequirement,
} from '../ai-types.ts';
import { CRMEventType } from '../enums.ts';

export class AinubisActionExecutionService {
  /**
   * Proposes an AI Action.
   */
  public async proposeAction(
    tenantId: string,
    recordDto: Omit<AIActionRecord, 'id' | 'tenantId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<AIActionRecord> {
    // Safety boundary validation
    this.validateSafetyBoundaries(recordDto.actionType, recordDto.proposedChanges);

    const expiresAt = recordDto.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default 7 days
    const approvalRequirement = recordDto.approvalRequirement || AIActionApprovalRequirement.HUMAN_APPROVAL;

    const action = await aiActionRepository.createAction(tenantId, {
      ...recordDto,
      status: AIActionStatus.PROPOSED,
      approvalRequirement,
      expiresAt,
    });

    await crmAuditService.record(
      tenantId,
      'opportunity',
      action.id,
      'AI_ACTION_PROPOSED',
      recordDto.createdBy || 'system.ainubis',
      undefined,
      action as unknown as Record<string, unknown>
    );

    await crmEventBus.publish(
      CRMEventType.AI_ACTION_REQUESTED,
      tenantId,
      { actionId: action.id, actionType: action.actionType },
      recordDto.createdBy || 'system.ainubis'
    );

    return action;
  }

  /**
   * Proposes a controlled AI Action based on an existing Observation.
   */
  public async proposeActionFromObservation(
    tenantId: string,
    observationId: string,
    userId: string
  ): Promise<AIActionRecord> {
    const { aiObservationRepository } = await import('../repositories/ai-observation.repository.ts');
    const { ainubisActionTemplateRegistry } = await import('./ainubis-action-template.registry.ts');

    const observation = await aiObservationRepository.findById(tenantId, observationId);
    if (!observation) {
      throw new Error(`AI Observation ${observationId} not found`);
    }

    // Determine Template
    let templateId = 'PIPELINE_STALE_FOLLOWUP'; // fallback
    const conditionKey = observation.conditionKey || '';

    if (conditionKey.includes('stalled_opportunity') || conditionKey.includes('stalledOpportunity')) {
      templateId = 'PIPELINE_STALE_FOLLOWUP';
    } else if (conditionKey.includes('stale_uncontacted') || conditionKey.includes('staleLead')) {
      templateId = 'LEAD_QUALIFICATION_FOLLOWUP';
    } else if (conditionKey.includes('incomplete_attributes') || conditionKey.includes('contract')) {
      templateId = 'CONTRACT_FOLLOWUP';
    } else if (conditionKey.includes('overdue_followup') || conditionKey.includes('escalation')) {
      templateId = 'TASK_ESCALATION';
    } else if (observation.capability === 'CRM_PIPELINE_HYGIENE' && observation.intelligenceType === 'RECOMMENDATION') {
      templateId = 'PROPOSAL_FOLLOWUP';
    }

    const template = ainubisActionTemplateRegistry.getTemplate(templateId) || ainubisActionTemplateRegistry.getTemplate('PIPELINE_STALE_FOLLOWUP')!;

    // Resolve current values based on target entity
    let currentValues: Record<string, unknown> = {};
    let proposedValues: Record<string, unknown> = {};

    const targetEntityType = observation.targetEntityType || 'opportunity';
    const targetEntityId = observation.targetEntityId || '';

    if (targetEntityType === 'lead' && targetEntityId) {
      const lead = await leadRepository.findById(tenantId, targetEntityId);
      if (lead) {
        currentValues = { status: lead.status };
      }
    } else if (targetEntityType === 'opportunity' && targetEntityId) {
      const opp = await opportunityRepository.findById(tenantId, targetEntityId);
      if (opp) {
        currentValues = {
          stage: opp.stage,
          estimatedValue: opp.estimatedValue,
          expectedCloseDate: opp.expectedCloseDate,
        };
      }
    } else if (targetEntityType === 'task' && targetEntityId) {
      const task = await taskRepository.findById(tenantId, targetEntityId);
      if (task) {
        currentValues = { status: task.status };
      }
    }

    // Map proposed changes
    let proposedChanges: Record<string, unknown> = { ...template.proposedChanges };

    // Dynamic adjustment for specific target entity
    if (template.actionType === AIActionType.CREATE_TASK) {
      proposedChanges = {
        ...proposedChanges,
        opportunityId: targetEntityType === 'opportunity' ? targetEntityId : undefined,
        leadId: targetEntityType === 'lead' ? targetEntityId : undefined,
        organisationId: targetEntityType === 'organisation' ? targetEntityId : undefined,
        schemeProspectId: targetEntityType === 'scheme_prospect' ? targetEntityId : undefined,
      };
    } else if (template.actionType === AIActionType.CREATE_ACTIVITY) {
      proposedChanges = {
        ...proposedChanges,
        opportunityId: targetEntityType === 'opportunity' ? targetEntityId : undefined,
        leadId: targetEntityType === 'lead' ? targetEntityId : undefined,
        organisationId: targetEntityType === 'organisation' ? targetEntityId : undefined,
      };
    }

    proposedValues = { ...currentValues, ...proposedChanges };

    const expiresAt = observation.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create proposed Action
    const action = await this.proposeAction(tenantId, {
      observationId: observation.id,
      capabilityId: observation.capability,
      actionType: template.actionType,
      title: template.defaultTitle,
      description: template.description,
      targetEntityType,
      targetEntityId,
      proposedChanges,
      currentValues,
      proposedValues,
      rationale: observation.observation || observation.summary,
      confidenceLevel: observation.confidenceLevel,
      riskLevel: template.riskLevel,
      approvalRequirement: template.approvalRequirement,
      expiresAt,
      createdBy: userId,
    });

    // Create Action Evidence trace
    if (observation.evidence && Array.isArray(observation.evidence)) {
      for (const ev of observation.evidence) {
        await aiActionRepository.createEvidence(tenantId, {
          actionId: action.id,
          entityType: ev.entityType,
          entityId: ev.entityId,
          description: `${ev.evidenceType}: flagged field "${ev.field || 'all'}" as having value "${String(ev.value)}" on ${ev.source}`,
        });
      }
    }

    // Add explicit evidence link to the observation itself
    await aiActionRepository.createEvidence(tenantId, {
      actionId: action.id,
      entityType: 'observation',
      entityId: observation.id,
      description: `Originating observation: "${observation.title}" (Capability: ${observation.capability})`,
    });

    return action;
  }

  /**
   * Approves an AI action.
   */
  public async approveAction(
    tenantId: string,
    actionId: string,
    approverId: string,
    notes?: string
  ): Promise<AIActionRecord> {
    const action = await aiActionRepository.findById(tenantId, actionId);
    if (!action) {
      throw new Error(`AI Action with ID ${actionId} not found`);
    }

    if (action.status !== AIActionStatus.PROPOSED && action.status !== AIActionStatus.REVIEW_REQUIRED) {
      throw new Error(`AI Action with ID ${actionId} cannot be approved from state ${action.status}`);
    }

    const now = new Date().toISOString();

    // Create approval record
    await aiActionRepository.createApproval(tenantId, {
      actionId,
      approverId,
      approvalStatus: 'APPROVED',
      approvedAt: now,
      reason: notes,
    });

    const updated = await aiActionRepository.update(tenantId, actionId, {
      status: AIActionStatus.APPROVED,
      approvedBy: approverId,
      approvedAt: now,
    });

    await crmAuditService.record(
      tenantId,
      'opportunity',
      actionId,
      'AI_ACTION_APPROVED',
      approverId,
      { status: action.status },
      { status: AIActionStatus.APPROVED, notes }
    );

    // Publish event
    await crmEventBus.publish(
      CRMEventType.AI_RECOMMENDATION_APPROVED,
      tenantId,
      { actionId, approvedBy: approverId },
      approverId
    );

    // Notify workflow orchestration service of the human decision
    try {
      const { ainubisWorkflowOrchestrationService } = await import('./ainubis-workflow-orchestration.service.ts');
      await ainubisWorkflowOrchestrationService.handleApprovalDecision(
        tenantId,
        actionId,
        'APPROVED',
        notes || 'Manually approved',
        approverId
      );
    } catch (err) {
      console.error(`[AinubisActionExecutionService] Error alerting workflow orchestrator:`, err);
    }

    return updated!;
  }

  /**
   * Rejects an AI action.
   */
  public async rejectAction(
    tenantId: string,
    actionId: string,
    rejecterId: string,
    reason: string
  ): Promise<AIActionRecord> {
    const action = await aiActionRepository.findById(tenantId, actionId);
    if (!action) {
      throw new Error(`AI Action with ID ${actionId} not found`);
    }

    if (action.status !== AIActionStatus.PROPOSED && action.status !== AIActionStatus.REVIEW_REQUIRED) {
      throw new Error(`AI Action with ID ${actionId} cannot be rejected from state ${action.status}`);
    }

    const now = new Date().toISOString();

    await aiActionRepository.createApproval(tenantId, {
      actionId,
      approverId: rejecterId,
      approvalStatus: 'REJECTED',
      approvedAt: now,
      reason,
    });

    const updated = await aiActionRepository.update(tenantId, actionId, {
      status: AIActionStatus.REJECTED,
    });

    await crmAuditService.record(
      tenantId,
      'opportunity',
      actionId,
      'AI_ACTION_REJECTED',
      rejecterId,
      { status: action.status },
      { status: AIActionStatus.REJECTED, reason }
    );

    await crmEventBus.publish(
      CRMEventType.AI_RECOMMENDATION_REJECTED,
      tenantId,
      { actionId, rejectedBy: rejecterId, reason },
      rejecterId
    );

    // Notify workflow orchestration service of the human decision
    try {
      const { ainubisWorkflowOrchestrationService } = await import('./ainubis-workflow-orchestration.service.ts');
      await ainubisWorkflowOrchestrationService.handleApprovalDecision(
        tenantId,
        actionId,
        'REJECTED',
        reason || 'Rejected by human',
        rejecterId
      );
    } catch (err) {
      console.error(`[AinubisActionExecutionService] Error alerting workflow orchestrator:`, err);
    }

    return updated!;
  }

  /**
   * Cancels an AI action.
   */
  public async cancelAction(tenantId: string, actionId: string, cancelerId: string): Promise<AIActionRecord> {
    const action = await aiActionRepository.findById(tenantId, actionId);
    if (!action) {
      throw new Error(`AI Action with ID ${actionId} not found`);
    }

    if (
      action.status === AIActionStatus.EXECUTED ||
      action.status === AIActionStatus.VERIFIED ||
      action.status === AIActionStatus.FAILED
    ) {
      throw new Error(`AI Action with ID ${actionId} is already in a terminal state: ${action.status}`);
    }

    const updated = await aiActionRepository.update(tenantId, actionId, {
      status: AIActionStatus.CANCELLED,
    });

    await crmAuditService.record(
      tenantId,
      'opportunity',
      actionId,
      'AI_ACTION_CANCELLED',
      cancelerId,
      { status: action.status },
      { status: AIActionStatus.CANCELLED }
    );

    return updated!;
  }

  /**
   * Executes an approved AI Action.
   */
  public async executeAction(
    tenantId: string,
    actionId: string,
    executorUserId: string,
    idempotencyKey?: string
  ): Promise<AIActionRecord> {
    const action = await aiActionRepository.findById(tenantId, actionId);
    if (!action) {
      throw new Error(`AI Action with ID ${actionId} not found`);
    }

    // Expiration check
    if (new Date().getTime() > new Date(action.expiresAt).getTime()) {
      await aiActionRepository.update(tenantId, actionId, {
        status: AIActionStatus.EXPIRED,
      });
      throw new Error(`AI Action ${actionId} has expired and cannot be executed`);
    }

    // State validation
    if (action.status === AIActionStatus.EXECUTED || action.status === AIActionStatus.VERIFIED) {
      return action; // Idempotent success return
    }

    if (action.status !== AIActionStatus.APPROVED && action.approvalRequirement !== AIActionApprovalRequirement.NONE) {
      throw new Error(`AI Action ${actionId} requires approval before execution, current status: ${action.status}`);
    }

    // Guardrails: Stale Action Protection (Check current values)
    await this.verifyCurrentStateGuardrails(tenantId, action);

    // Update state to EXECUTING
    await aiActionRepository.update(tenantId, actionId, {
      status: AIActionStatus.EXECUTING,
      idempotencyKey,
    });

    // Record execution trigger
    await aiActionRepository.createExecution(tenantId, {
      actionId,
      status: 'SUCCESS',
      executedAt: new Date().toISOString(),
      executorId: executorUserId,
    });

    let executedTargetId = action.targetEntityId;

    try {
      switch (action.actionType) {
        case AIActionType.CREATE_TASK: {
          const taskDto: any = {
            ...action.proposedChanges,
            opportunityId: (action.proposedChanges as any).opportunityId || (action.targetEntityType === 'opportunity' ? action.targetEntityId : undefined),
            leadId: (action.proposedChanges as any).leadId || (action.targetEntityType === 'lead' ? action.targetEntityId : undefined),
            organisationId: (action.proposedChanges as any).organisationId || (action.targetEntityType === 'organisation' ? action.targetEntityId : undefined),
            schemeProspectId: (action.proposedChanges as any).schemeProspectId || (action.targetEntityType === 'scheme_prospect' ? action.targetEntityId : undefined),
          };
          const task = await taskService.createTask(tenantId, taskDto, executorUserId);
          executedTargetId = task.id;
          break;
        }

        case AIActionType.CREATE_ACTIVITY: {
          const activityDto: any = {
            ...action.proposedChanges,
            opportunityId: (action.proposedChanges as any).opportunityId || (action.targetEntityType === 'opportunity' ? action.targetEntityId : undefined),
            leadId: (action.proposedChanges as any).leadId || (action.targetEntityType === 'lead' ? action.targetEntityId : undefined),
            organisationId: (action.proposedChanges as any).organisationId || (action.targetEntityType === 'organisation' ? action.targetEntityId : undefined),
            schemeProspectId: (action.proposedChanges as any).schemeProspectId || (action.targetEntityType === 'scheme_prospect' ? action.targetEntityId : undefined),
          };
          const activity = await activityService.logActivity(tenantId, activityDto, executorUserId);
          executedTargetId = activity.id;
          break;
        }

        case AIActionType.UPDATE_LEAD_STATUS: {
          const lead = await leadService.updateStatus(
            tenantId,
            action.targetEntityId,
            action.proposedChanges.status as any,
            executorUserId
          );
          executedTargetId = lead.id;
          break;
        }

        case AIActionType.UPDATE_OPPORTUNITY_STAGE: {
          const result = await opportunityService.transitionStage(
            tenantId,
            action.targetEntityId,
            action.proposedChanges.stage as any,
            executorUserId,
            'Ainubis authorized automated pipeline update'
          );
          executedTargetId = result.opportunity.id;
          break;
        }

        case AIActionType.UPDATE_OPPORTUNITY_ATTRIBUTES: {
          const opp = await opportunityService.update(
            tenantId,
            action.targetEntityId,
            action.proposedChanges as any,
            executorUserId
          );
          executedTargetId = opp.id;
          break;
        }

        default:
          throw new Error(`Unsupported AI Action Type: ${action.actionType}`);
      }

      // Mark as EXECUTED
      await aiActionRepository.update(tenantId, actionId, {
        status: AIActionStatus.EXECUTED,
        targetEntityId: executedTargetId,
        executedAt: new Date().toISOString(),
      });

      await crmAuditService.record(
        tenantId,
        'opportunity',
        actionId,
        'AI_ACTION_EXECUTED',
        executorUserId,
        { status: AIActionStatus.EXECUTING },
        { status: AIActionStatus.EXECUTED, targetEntityId: executedTargetId }
      );

      // Trigger automatic verification pipeline
      await ainubisActionVerificationService.verifyAction(tenantId, actionId);

      const finalRecord = await aiActionRepository.findById(tenantId, actionId);
      return finalRecord!;
    } catch (err: any) {
      await aiActionRepository.update(tenantId, actionId, {
        status: AIActionStatus.FAILED,
        failureReason: err.message,
      });

      await crmAuditService.record(
        tenantId,
        'opportunity',
        actionId,
        'AI_ACTION_FAILED',
        executorUserId,
        { status: AIActionStatus.EXECUTING },
        { status: AIActionStatus.FAILED, reason: err.message }
      );

      throw err;
    }
  }

  /**
   * Strictly enforces safety boundaries. Throws error if any prohibited fields or actions are defined.
   */
  private validateSafetyBoundaries(actionType: AIActionType, proposedChanges: Record<string, unknown>): void {
    const supportedTypes = Object.values(AIActionType);
    if (!supportedTypes.includes(actionType)) {
      throw new Error(`Prohibited or unsupported Action Type: ${actionType}`);
    }

    const prohibitedKeys = [
      'delete',
      'tenantOwner',
      'role',
      'permission',
      'ledger',
      'payment',
      'invoice',
      'creditNote',
      'bank',
      'reserveFund',
      'statutoryLevy',
      'contract',
    ];

    for (const key of Object.keys(proposedChanges)) {
      if (prohibitedKeys.some((prohibited) => key.toLowerCase().includes(prohibited))) {
        throw new Error(`CRITICAL SAFETY BOUNDARY BREACH: proposedChanges contains prohibited key "${key}"`);
      }
    }
  }

  /**
   * Confirms current target values match values recorded when action was proposed (Stale Action Protection).
   */
  private async verifyCurrentStateGuardrails(tenantId: string, action: AIActionRecord): Promise<void> {
    if (action.actionType === AIActionType.CREATE_TASK || action.actionType === AIActionType.CREATE_ACTIVITY) {
      return; // Skip target check for newly created items
    }

    let currentVal: Record<string, unknown> = {};

    switch (action.targetEntityType) {
      case 'lead': {
        const lead = await leadRepository.findById(tenantId, action.targetEntityId);
        if (!lead) throw new Error(`Target Lead with ID ${action.targetEntityId} not found`);
        currentVal = { status: lead.status };
        break;
      }
      case 'opportunity': {
        const opp = await opportunityRepository.findById(tenantId, action.targetEntityId);
        if (!opp) throw new Error(`Target Opportunity with ID ${action.targetEntityId} not found`);
        currentVal = { stage: opp.stage, estimatedValue: opp.estimatedValue, expectedCloseDate: opp.expectedCloseDate };
        break;
      }
      default:
        break;
    }

    // Compare with expected current values when action was proposed
    for (const key of Object.keys(action.currentValues)) {
      if (String(currentVal[key]) !== String(action.currentValues[key])) {
        // Mark action as FAILED due to conflict state
        await aiActionRepository.update(tenantId, action.id, {
          status: AIActionStatus.FAILED,
          failureReason: `Stale action conflict detected. Target ${action.targetEntityType} "${key}" changed from expected "${action.currentValues[key]}" to "${currentVal[key]}".`,
        });
        throw new Error(`STALE_ACTION_CONFLICT: Target state changed before execution.`);
      }
    }
  }
}

export const ainubisActionExecutionService = new AinubisActionExecutionService();

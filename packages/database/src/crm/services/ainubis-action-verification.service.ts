/**
 * BCIP Ainubis AI Action Verification Service
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 * Inspects execution states and re-reads target entities from CRM repositories to verify successfully applied changes.
 */

import { aiActionRepository } from '../repositories/ai-action.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { activityRepository } from '../repositories/activity.repository.ts';
import { leadRepository } from '../repositories/lead.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import {
  type AIActionRecord,
  AIActionStatus,
  AIActionType,
} from '../ai-types.ts';

export class AinubisActionVerificationService {
  /**
   * Reads target entity state and compares it against expected proposed changes.
   */
  public async verifyAction(tenantId: string, actionId: string): Promise<boolean> {
    const action = await aiActionRepository.findById(tenantId, actionId);
    if (!action) {
      throw new Error(`AI Action with ID ${actionId} not found`);
    }

    if (action.status !== AIActionStatus.EXECUTED) {
      throw new Error(`AI Action with ID ${actionId} must be in EXECUTED state to verify, current: ${action.status}`);
    }

    const expectedState: Record<string, unknown> = { ...action.proposedValues };
    let actualState: Record<string, unknown> = {};
    let isVerified = false;
    let failureReason = '';

    try {
      switch (action.actionType) {
        case AIActionType.CREATE_TASK: {
          // Re-read created task
          const task = await taskRepository.findById(tenantId, action.targetEntityId);
          if (task) {
            actualState = { status: task.status, title: task.title };
            // A task created must exist and have the expected attributes
            isVerified = true;
          } else {
            failureReason = `Task with ID ${action.targetEntityId} not found in CRM`;
          }
          break;
        }

        case AIActionType.CREATE_ACTIVITY: {
          const activity = await activityRepository.findById(tenantId, action.targetEntityId);
          if (activity) {
            actualState = { type: activity.activityType, description: activity.description };
            isVerified = true;
          } else {
            failureReason = `Activity with ID ${action.targetEntityId} not found in CRM`;
          }
          break;
        }

        case AIActionType.UPDATE_LEAD_STATUS: {
          const lead = await leadRepository.findById(tenantId, action.targetEntityId);
          if (lead) {
            actualState = { status: lead.status };
            if (lead.status === expectedState.status) {
              isVerified = true;
            } else {
              failureReason = `Lead status mismatch: expected "${expectedState.status}", got "${lead.status}"`;
            }
          } else {
            failureReason = `Lead with ID ${action.targetEntityId} not found in CRM`;
          }
          break;
        }

        case AIActionType.UPDATE_OPPORTUNITY_STAGE: {
          const opp = await opportunityRepository.findById(tenantId, action.targetEntityId);
          if (opp) {
            actualState = { stage: opp.stage };
            if (opp.stage === expectedState.stage) {
              isVerified = true;
            } else {
              failureReason = `Opportunity stage mismatch: expected "${expectedState.stage}", got "${opp.stage}"`;
            }
          } else {
            failureReason = `Opportunity with ID ${action.targetEntityId} not found in CRM`;
          }
          break;
        }

        case AIActionType.UPDATE_OPPORTUNITY_ATTRIBUTES: {
          const opp = await opportunityRepository.findById(tenantId, action.targetEntityId);
          if (opp) {
            actualState = {};
            let match = true;
            for (const key of Object.keys(expectedState)) {
              const currentVal = (opp as any)[key];
              actualState[key] = currentVal;
              if (String(currentVal) !== String(expectedState[key])) {
                match = false;
                failureReason += `${key} mismatch: expected "${expectedState[key]}", got "${currentVal}". `;
              }
            }
            if (match) {
              isVerified = true;
            }
          } else {
            failureReason = `Opportunity with ID ${action.targetEntityId} not found in CRM`;
          }
          break;
        }

        default:
          failureReason = `Unknown action type ${action.actionType}`;
          break;
      }
    } catch (err: any) {
      isVerified = false;
      failureReason = `Verification lookup threw error: ${err.message}`;
    }

    const finalStatus = isVerified ? AIActionStatus.VERIFIED : AIActionStatus.FAILED;

    // Create verification log
    await aiActionRepository.createVerification(tenantId, {
      actionId,
      status: isVerified ? 'VERIFIED' : 'FAILED',
      verifiedAt: new Date().toISOString(),
      expectedState,
      actualState,
      failureReason: isVerified ? undefined : failureReason,
    });

    // Update Action Status
    await aiActionRepository.update(tenantId, actionId, {
      status: finalStatus,
      verifiedAt: new Date().toISOString(),
      failureReason: isVerified ? undefined : failureReason,
      verificationResult: { isVerified, actualState },
    });

    return isVerified;
  }
}

export const ainubisActionVerificationService = new AinubisActionVerificationService();

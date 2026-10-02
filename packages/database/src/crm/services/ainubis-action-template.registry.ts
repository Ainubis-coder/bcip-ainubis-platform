/**
 * BCIP Ainubis AI Action Template Registry
 * Phase 2E — Prompt 002E-004: Ainubis Intelligence Actions & Human-Approved CRM Automation
 * Central template registry defining default states, risk profiles, and verification criteria for CRM actions.
 */

import {
  type AIActionTemplate,
  AIActionType,
  AIActionApprovalRequirement,
} from '../ai-types.ts';

export class AinubisActionTemplateRegistry {
  private templates: Map<string, AIActionTemplate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // 1. PIPELINE_STALE_FOLLOWUP
    this.register({
      templateId: 'PIPELINE_STALE_FOLLOWUP',
      actionType: AIActionType.CREATE_TASK,
      triggerCapability: 'CRM_PIPELINE_HYGIENE',
      defaultTitle: 'Outreach to Stalled Opportunity Contact',
      description: 'Automatically recommend creating an outreach follow-up task on active opportunities without recent customer touchpoints.',
      riskLevel: 'LOW',
      approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
      proposedChanges: {
        title: 'Outreach Follow-up',
        priority: 'HIGH',
        description: 'Ensure contact is maintained for this stalled pipeline deal.',
      },
      verificationCriteria: {
        targetEntityType: 'task',
        field: 'status',
        expectedValue: 'OPEN',
      },
    });

    // 2. LEAD_QUALIFICATION_FOLLOWUP
    this.register({
      templateId: 'LEAD_QUALIFICATION_FOLLOWUP',
      actionType: AIActionType.CREATE_TASK,
      triggerCapability: 'CRM_LEAD_HYGIENE',
      defaultTitle: 'Lead Qualification Follow-up Task',
      description: 'Recommend following up with new leads that remain uncontacted or unqualified beyond the SLA target window.',
      riskLevel: 'LOW',
      approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
      proposedChanges: {
        title: 'New Lead Qualification SLA Follow-up',
        priority: 'HIGH',
        description: 'Lead qualification window exceeded. Verify contact details and follow up immediately.',
      },
      verificationCriteria: {
        targetEntityType: 'task',
        field: 'status',
        expectedValue: 'OPEN',
      },
    });

    // 3. PROPOSAL_FOLLOWUP
    this.register({
      templateId: 'PROPOSAL_FOLLOWUP',
      actionType: AIActionType.CREATE_ACTIVITY,
      triggerCapability: 'CRM_PIPELINE_HYGIENE',
      defaultTitle: 'Proposal Response Reminder activity',
      description: 'Recommend creating a follow-up activity record for sent proposals awaiting customer feedback.',
      riskLevel: 'LOW',
      approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
      proposedChanges: {
        subject: 'Proposal Review Outreach',
        type: 'EMAIL',
        description: 'Customer proposal feedback check-in call/email logged.',
      },
      verificationCriteria: {
        targetEntityType: 'activity',
        field: 'type',
        expectedValue: 'EMAIL',
      },
    });

    // 4. CONTRACT_FOLLOWUP
    this.register({
      templateId: 'CONTRACT_FOLLOWUP',
      actionType: AIActionType.UPDATE_OPPORTUNITY_ATTRIBUTES,
      triggerCapability: 'CRM_PIPELINE_HYGIENE',
      defaultTitle: 'Pipeline attributes completion check',
      description: 'Audit opportunity and recommend correcting critical close-date and values to support forecasts.',
      riskLevel: 'MEDIUM',
      approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
      proposedChanges: {
        estimatedValue: 50000,
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      verificationCriteria: {
        targetEntityType: 'opportunity',
        field: 'estimatedValue',
        expectedValue: 50000,
      },
    });

    // 5. TASK_ESCALATION
    this.register({
      templateId: 'TASK_ESCALATION',
      actionType: AIActionType.CREATE_ACTIVITY,
      triggerCapability: 'CRM_TASK_HYGIENE',
      defaultTitle: 'Overdue Task Escalation Log',
      description: 'Recommend escalating and logging a high-priority outreach activity record on overdue project tasks.',
      riskLevel: 'MEDIUM',
      approvalRequirement: AIActionApprovalRequirement.HUMAN_APPROVAL,
      proposedChanges: {
        subject: 'SLA Escalation Notification',
        type: 'SYSTEM_LOG',
        description: 'Task deadline passed. Escalated to administrative board / trustees.',
      },
      verificationCriteria: {
        targetEntityType: 'activity',
        field: 'type',
        expectedValue: 'SYSTEM_LOG',
      },
    });
  }

  public register(template: AIActionTemplate): void {
    this.templates.set(template.templateId, template);
  }

  public getTemplate(templateId: string): AIActionTemplate | undefined {
    return this.templates.get(templateId);
  }

  public listTemplates(): AIActionTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const ainubisActionTemplateRegistry = new AinubisActionTemplateRegistry();

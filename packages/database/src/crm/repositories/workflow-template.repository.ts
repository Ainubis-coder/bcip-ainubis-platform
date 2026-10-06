/**
 * BCIP Ainubis Workflow Template Repository
 * Phase 2E — Prompt 002E-006 & 4A: Ainubis Workflow Templates Tenancy, Ownership & Reuse
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import {
  type WorkflowTemplate,
  type WorkflowTemplateVersion,
  type WorkflowTemplateUsage,
  WorkflowTemplateStatus,
  TemplateScope,
  type WorkflowTriggerConfig,
  type WorkflowStepConfig,
} from '../workflow-types.ts';

export interface TemplateQueryOptions extends QueryOptions {
  status?: string;
  category?: string;
  templateKey?: string;
  scope?: 'SYSTEM' | 'TENANT' | 'ALL';
}

const TEMPLATE_KEY_ALIASES: Record<string, string[]> = {
  PIPELINE_LEAD_QUALIFICATION: ['PIPELINE_LEAD_QUALIFICATION', 'NEW_LEAD_QUALIFICATION'],
  NEW_LEAD_QUALIFICATION: ['NEW_LEAD_QUALIFICATION', 'PIPELINE_LEAD_QUALIFICATION'],
  PIPELINE_STALE_FOLLOWUP: ['PIPELINE_STALE_FOLLOWUP', 'STALLED_OPPORTUNITY_FOLLOW_UP'],
  STALLED_OPPORTUNITY_FOLLOW_UP: ['STALLED_OPPORTUNITY_FOLLOW_UP', 'PIPELINE_STALE_FOLLOWUP'],
  TASK_OVERDUE_ESCALATION: ['TASK_OVERDUE_ESCALATION', 'OVERDUE_TASK_ESCALATION'],
  OVERDUE_TASK_ESCALATION: ['OVERDUE_TASK_ESCALATION', 'TASK_OVERDUE_ESCALATION'],
};

export class WorkflowTemplateRepository extends BaseCrmRepository<WorkflowTemplate> {
  private versions: Map<string, WorkflowTemplateVersion> = new Map();
  private usages: Map<string, WorkflowTemplateUsage> = new Map();

  constructor() {
    super('crm_ai_workflow_templates');
  }

  /**
   * Find a template by ID respecting tenancy boundaries.
   * SYSTEM templates are accessible by any authorized tenant.
   * TENANT templates are accessible ONLY by the owning tenant.
   */
  public override async findById(
    tenantId: string,
    id: string,
    options?: QueryOptions
  ): Promise<WorkflowTemplate | null> {
    const item = this.items.get(id);
    if (!item) return null;
    if (!options?.includeDeleted && item.deletedAt) return null;

    // SYSTEM templates are accessible to all authorized tenants
    if (item.templateScope === TemplateScope.SYSTEM) {
      return JSON.parse(JSON.stringify(item));
    }

    // TENANT templates are strictly isolated to the owner tenant
    if (item.templateScope === TemplateScope.TENANT && item.ownerTenantId === tenantId) {
      return JSON.parse(JSON.stringify(item));
    }

    // Fallback for legacy un-scoped items
    if (item.tenantId === tenantId) {
      return JSON.parse(JSON.stringify(item));
    }

    return null;
  }

  /**
   * Unscoped template lookup (internal / platform-admin only)
   */
  public getTemplateByIdUnscoped(id: string): WorkflowTemplate | null {
    const item = this.items.get(id);
    if (!item || item.deletedAt) return null;
    return JSON.parse(JSON.stringify(item));
  }

  /**
   * Create a new template.
   * For tenant requests: sets templateScope = TENANT and ownerTenantId = tenantId.
   * For platform-admin requests: allows creating SYSTEM templates (ownerTenantId = null).
   */
  public async createTemplate(
    tenantId: string,
    dto: {
      templateKey: string;
      name: string;
      description: string;
      category: string;
      purpose: string;
      trigger: WorkflowTriggerConfig;
      steps: WorkflowStepConfig[];
      templateScope?: TemplateScope;
      ownerTenantId?: string | null;
      sourceTemplateId?: string | null;
      sourceTemplateVersionId?: string | null;
      sourceTemplateVersion?: number | null;
    },
    createdBy: string,
    isPlatformAdmin: boolean = false
  ): Promise<WorkflowTemplate> {
    const id = this.generateId('wftpl');
    const now = new Date().toISOString();

    const templateScope =
      isPlatformAdmin && dto.templateScope === TemplateScope.SYSTEM
        ? TemplateScope.SYSTEM
        : TemplateScope.TENANT;

    const ownerTenantId = templateScope === TemplateScope.SYSTEM ? null : tenantId;
    const recordTenantId = templateScope === TemplateScope.SYSTEM ? 'SYSTEM' : tenantId;

    const record: WorkflowTemplate = {
      ...dto,
      id,
      tenantId: recordTenantId,
      templateScope,
      ownerTenantId,
      sourceTemplateId: dto.sourceTemplateId || null,
      sourceTemplateVersionId: dto.sourceTemplateVersionId || null,
      sourceTemplateVersion: dto.sourceTemplateVersion || null,
      status: WorkflowTemplateStatus.DRAFT,
      version: 1,
      createdBy,
      updatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, record);
    return { ...record };
  }

  /**
   * Update a template.
   * Tenants cannot edit SYSTEM templates (immutability rule).
   * Tenants cannot edit other tenants' templates.
   */
  public async updateTemplate(
    tenantId: string,
    id: string,
    patch: Partial<Omit<WorkflowTemplate, 'id' | 'createdAt' | 'createdBy'>>,
    isPlatformAdmin: boolean = false
  ): Promise<WorkflowTemplate | null> {
    const existing = this.items.get(id);
    if (!existing || existing.deletedAt) return null;

    // Tenant users cannot modify SYSTEM templates (Prompt 4A.5)
    if (existing.templateScope === TemplateScope.SYSTEM && !isPlatformAdmin) {
      return null;
    }

    // Tenant users cannot modify other tenants' templates (Prompt 4A.10)
    if (existing.templateScope === TemplateScope.TENANT && existing.ownerTenantId !== tenantId) {
      return null;
    }

    const updated: WorkflowTemplate = {
      ...existing,
      ...patch,
      tenantId: existing.tenantId, // prevent tenant hijacking
      templateScope: existing.templateScope, // prevent scope mutation
      ownerTenantId: existing.ownerTenantId, // prevent owner mutation
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);
    return { ...updated };
  }

  /**
   * Soft delete a template.
   * Tenants cannot delete SYSTEM templates.
   */
  public override async softDelete(
    tenantId: string,
    id: string,
    isPlatformAdmin: boolean = false
  ): Promise<boolean> {
    const existing = this.items.get(id);
    if (!existing || existing.deletedAt) return false;

    // Tenant users cannot delete SYSTEM templates (Prompt 4A.5)
    if (existing.templateScope === TemplateScope.SYSTEM && !isPlatformAdmin) {
      return false;
    }

    // Tenant users cannot delete other tenants' templates
    if (existing.templateScope === TemplateScope.TENANT && existing.ownerTenantId !== tenantId) {
      return false;
    }

    existing.deletedAt = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    this.items.set(id, existing);
    return true;
  }

  /**
   * Get template by key with alias resolution.
   * Prioritizes tenant-owned custom template, then falls back to platform SYSTEM template.
   */
  public async getTemplateByKey(tenantId: string, templateKey: string): Promise<WorkflowTemplate | undefined> {
    const targetKeys = TEMPLATE_KEY_ALIASES[templateKey] || [templateKey];

    // 1. Check tenant's own custom template first
    for (const item of this.items.values()) {
      if (
        item.templateScope === TemplateScope.TENANT &&
        item.ownerTenantId === tenantId &&
        targetKeys.includes(item.templateKey) &&
        !item.deletedAt
      ) {
        return { ...item };
      }
    }

    // 2. Check platform SYSTEM templates
    for (const item of this.items.values()) {
      if (
        item.templateScope === TemplateScope.SYSTEM &&
        targetKeys.includes(item.templateKey) &&
        !item.deletedAt
      ) {
        return { ...item };
      }
    }

    return undefined;
  }

  /**
   * Find templates visible to a tenant.
   * Returns:
   * 1. SYSTEM templates reusable by all tenants (unless scope='TENANT')
   * 2. TENANT templates belonging exclusively to requesting tenant (unless scope='SYSTEM')
   * Never returns another tenant's templates.
   */
  public async findMany(
    tenantId: string,
    options?: TemplateQueryOptions
  ): Promise<{ data: WorkflowTemplate[]; total: number }> {
    const results: WorkflowTemplate[] = [];

    for (const item of this.items.values()) {
      if (!options?.includeDeleted && item.deletedAt) continue;

      // Tenancy & Scope isolation check
      if (item.templateScope === TemplateScope.SYSTEM) {
        if (options?.scope === 'TENANT') continue;
      } else if (item.templateScope === TemplateScope.TENANT) {
        if (item.ownerTenantId !== tenantId) continue;
        if (options?.scope === 'SYSTEM') continue;
      } else {
        // Fallback for legacy records
        if (item.tenantId !== tenantId) continue;
      }

      // Filter by status
      if (options?.status && item.status !== options.status) continue;

      // Filter by category
      if (options?.category && item.category !== options.category) continue;

      // Filter by templateKey (with alias resolution)
      if (options?.templateKey) {
        const allowedKeys = TEMPLATE_KEY_ALIASES[options.templateKey] || [options.templateKey];
        if (!allowedKeys.includes(item.templateKey)) continue;
      }

      // Filter by search query
      if (options?.search && options.search.trim().length > 0) {
        const q = options.search.trim().toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.templateKey.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!match) continue;
      }

      results.push(JSON.parse(JSON.stringify(item)));
    }

    const total = results.length;

    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply offset/limit
    const limit = options?.limit !== undefined ? options.limit : 20;
    const offset = options?.offset || 0;
    const paginated = results.slice(offset, offset + limit);

    return { data: paginated, total };
  }

  // Version Management
  public async createVersion(
    tenantId: string,
    version: Omit<WorkflowTemplateVersion, 'id' | 'createdAt'>
  ): Promise<WorkflowTemplateVersion> {
    const id = this.generateId('wftv');
    const record: WorkflowTemplateVersion = {
      ...version,
      id,
      tenantId: version.ownerTenantId || tenantId,
      createdAt: new Date().toISOString(),
    };
    this.versions.set(id, record);
    return { ...record };
  }

  public async findVersions(tenantId: string, templateId: string): Promise<WorkflowTemplateVersion[]> {
    const template = await this.findById(tenantId, templateId);
    if (!template) return [];

    const results: WorkflowTemplateVersion[] = [];
    for (const item of this.versions.values()) {
      if (item.templateId === templateId) {
        results.push({ ...item });
      }
    }
    results.sort((a, b) => b.version - a.version);
    return results;
  }

  // Usage Management (strictly tenant isolated unless platform admin)
  public async createUsage(
    tenantId: string,
    templateId: string,
    workflowId: string,
    instantiatedBy: string,
    templateVersion?: number,
    templateVersionId?: string
  ): Promise<WorkflowTemplateUsage> {
    const id = this.generateId('wftu');
    const record: WorkflowTemplateUsage = {
      id,
      tenantId,
      templateId,
      templateVersion: templateVersion || 1,
      templateVersionId: templateVersionId || `${templateId}_v${templateVersion || 1}`,
      workflowId,
      instantiatedAt: new Date().toISOString(),
      instantiatedBy,
    };
    this.usages.set(id, record);
    return { ...record };
  }

  public async findUsage(
    tenantId: string,
    templateId: string,
    isPlatformAdmin: boolean = false
  ): Promise<WorkflowTemplateUsage[]> {
    const results: WorkflowTemplateUsage[] = [];
    for (const item of this.usages.values()) {
      if (item.templateId === templateId) {
        if (isPlatformAdmin || item.tenantId === tenantId) {
          results.push({ ...item });
        }
      }
    }
    return results;
  }

  public clearAll() {
    this.items.clear();
    this.versions.clear();
    this.usages.clear();
  }

  /**
   * Seed the 6 Initial Governed Templates as canonical platform SYSTEM templates.
   * Prompt 4A.2:
   * NEW_LEAD_QUALIFICATION
   * STALLED_OPPORTUNITY_FOLLOW_UP
   * PROPOSAL_FOLLOW_UP
   * OVERDUE_TASK_ESCALATION
   * CONTRACT_RENEWAL_REMINDER
   * ORGANISATION_HEALTH_INTERVENTION
   *
   * Created ONCE globally with templateScope=SYSTEM and ownerTenantId=null,
   * reusable across all authorized tenants without duplication.
   */
  public async seedDefaultTemplates(tenantIdOrUserId?: string, userIdArg?: string): Promise<void> {
    const userId = userIdArg || tenantIdOrUserId || 'system';

    const systemTemplates = [
      {
        templateKey: 'NEW_LEAD_QUALIFICATION',
        name: 'New Lead Qualification SLA Follow-Up',
        description: 'Identifies newly created CRM leads and guides the human qualification and engagement SLA.',
        category: 'LEAD_QUALIFICATION',
        purpose: 'Ensure response SLAs are met for all fresh inbound property leads.',
        trigger: {
          type: 'CRM_EVENT',
          eventType: 'crm.lead.created',
        },
        steps: [
          {
            id: 'step_1_obs',
            stepKey: 'obs_lead',
            name: 'Observe Lead Record',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'lead' },
            enabled: true,
          },
          {
            id: 'step_2_eval',
            stepKey: 'eval_lead',
            name: 'Evaluate SLA Criteria',
            type: 'EVALUATE' as any,
            order: 2,
            configuration: { criteria: [{ field: 'email', operator: 'not_equals', value: null }] },
            enabled: true,
          },
          {
            id: 'step_3_prop',
            stepKey: 'prop_action',
            name: 'Propose Qualification Task',
            type: 'PROPOSE_ACTION' as any,
            order: 3,
            configuration: { actionTemplateId: 'LEAD_QUALIFICATION_FOLLOWUP', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
      {
        templateKey: 'STALLED_OPPORTUNITY_FOLLOW_UP',
        name: 'Stalled Opportunity Follow-Up',
        description: 'Flags sales opportunities stagnating in stages like PROPOSAL or NEGOTIATION and triggers trustees engagement tasks.',
        category: 'OPPORTUNITY_MANAGEMENT',
        purpose: 'Maintain pipeline hygiene and close inactive corporate deals.',
        trigger: {
          type: 'SCHEDULED_CONDITION',
          conditionKey: 'stalled_opportunity_14d',
        },
        steps: [
          {
            id: 'step_1_obs_opp',
            stepKey: 'obs_opp',
            name: 'Observe Stalled Opportunity',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'opportunity' },
            enabled: true,
          },
          {
            id: 'step_2_prop_stale',
            stepKey: 'prop_stale_task',
            name: 'Propose Follow-Up Task',
            type: 'PROPOSE_ACTION' as any,
            order: 2,
            configuration: { actionTemplateId: 'PIPELINE_STALE_FOLLOWUP', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
      {
        templateKey: 'PROPOSAL_FOLLOW_UP',
        name: 'Trustee Proposal Feedback Cycle',
        description: 'Monitors proposal delivery and triggers follow-up reminders if trustees have not provided feedback within 7 days.',
        category: 'OPPORTUNITY_MANAGEMENT',
        purpose: 'Drive proposals to signed active contracts.',
        trigger: {
          type: 'SCHEDULED_CONDITION',
          conditionKey: 'proposal_stuck_7d',
        },
        steps: [
          {
            id: 'step_1_obs_prop',
            stepKey: 'obs_prop',
            name: 'Observe Proposal Status',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'proposal' },
            enabled: true,
          },
          {
            id: 'step_2_prop_remind',
            stepKey: 'prop_remind_task',
            name: 'Propose Feedback Follow-Up',
            type: 'PROPOSE_ACTION' as any,
            order: 2,
            configuration: { actionTemplateId: 'PROPOSAL_FOLLOWUP', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
      {
        templateKey: 'OVERDUE_TASK_ESCALATION',
        name: 'Critical Task SLA Escalation',
        description: 'Tracks overdue CRM tasks and alerts portfolio managers / executives for controlled escalation.',
        category: 'TASK_ESCALATION',
        purpose: 'Maintain operational accountability.',
        trigger: {
          type: 'SCHEDULED_CONDITION',
          conditionKey: 'task_overdue_3d',
        },
        steps: [
          {
            id: 'step_1_obs_tsk',
            stepKey: 'obs_tsk',
            name: 'Observe Overdue Task',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'task' },
            enabled: true,
          },
          {
            id: 'step_2_prop_esc',
            stepKey: 'prop_esc_task',
            name: 'Propose Critical Task Escalation',
            type: 'PROPOSE_ACTION' as any,
            order: 2,
            configuration: { actionTemplateId: 'TASK_OVERDUE_ESCALATION', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
      {
        templateKey: 'CONTRACT_RENEWAL_REMINDER',
        name: 'Body Corporate Contract Renewal reminder',
        description: 'Scans expiring agreements 60 days before termination and schedules renewal review tasks.',
        category: 'CONTRACT_RENEWAL',
        purpose: 'Avoid contract lapses and service delivery downtime.',
        trigger: {
          type: 'SCHEDULED_CONDITION',
          conditionKey: 'contract_expiring_60d',
        },
        steps: [
          {
            id: 'step_1_obs_ctr',
            stepKey: 'obs_ctr',
            name: 'Observe Expiring Contract',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'contract' },
            enabled: true,
          },
          {
            id: 'step_2_prop_renew',
            stepKey: 'prop_renew_task',
            name: 'Propose Contract Review Task',
            type: 'PROPOSE_ACTION' as any,
            order: 2,
            configuration: { actionTemplateId: 'CONTRACT_RENEWAL_TASK', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
      {
        templateKey: 'ORGANISATION_HEALTH_INTERVENTION',
        name: 'Account Health Deterioration Intervention',
        description: 'Detects deteriorating CRM health markers in key sectional title accounts and proposes trustee reviews.',
        category: 'ORGANISATION_HEALTH',
        purpose: 'Retain key corporate managing agency mandates.',
        trigger: {
          type: 'SCHEDULED_CONDITION',
          conditionKey: 'organisation_health_degraded',
        },
        steps: [
          {
            id: 'step_1_obs_org',
            stepKey: 'obs_org',
            name: 'Observe Account Health',
            type: 'OBSERVE' as any,
            order: 1,
            configuration: { entityType: 'organisation' },
            enabled: true,
          },
          {
            id: 'step_2_prop_audit',
            stepKey: 'prop_audit_task',
            name: 'Propose Health Intervention Review',
            type: 'PROPOSE_ACTION' as any,
            order: 2,
            configuration: { actionTemplateId: 'ORGANISATION_HEALTH_REVIEW', actionType: 'CREATE_TASK' },
            enabled: true,
          },
        ],
      },
    ];

    for (const t of systemTemplates) {
      // Check if SYSTEM template already exists
      let existing: WorkflowTemplate | undefined;
      for (const item of this.items.values()) {
        if (
          item.templateScope === TemplateScope.SYSTEM &&
          (item.templateKey === t.templateKey ||
            TEMPLATE_KEY_ALIASES[t.templateKey]?.includes(item.templateKey)) &&
          !item.deletedAt
        ) {
          existing = item;
          break;
        }
      }

      if (!existing) {
        const id = this.generateId('wftpl');
        const now = new Date().toISOString();
        const record: WorkflowTemplate = {
          id,
          tenantId: 'SYSTEM',
          templateScope: TemplateScope.SYSTEM,
          ownerTenantId: null,
          templateKey: t.templateKey,
          name: t.name,
          description: t.description,
          category: t.category,
          purpose: t.purpose,
          status: WorkflowTemplateStatus.PUBLISHED,
          version: 1,
          trigger: t.trigger as any,
          steps: t.steps as any,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
          publishedAt: now,
        };
        this.items.set(id, record);

        // Seed immutable published version 1
        await this.createVersion('SYSTEM', {
          templateId: id,
          templateScope: TemplateScope.SYSTEM,
          ownerTenantId: null,
          version: 1,
          trigger: t.trigger as any,
          steps: t.steps as any,
          status: WorkflowTemplateStatus.PUBLISHED,
          publishedAt: now,
          createdBy: userId,
        });
      }
    }
  }
}

export const workflowTemplateRepository = new WorkflowTemplateRepository();

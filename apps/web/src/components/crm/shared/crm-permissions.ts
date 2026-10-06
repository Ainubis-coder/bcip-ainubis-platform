/**
 * BCIP CRM Frontend Permission Checks
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Client-side permission helpers respecting backend RBAC policies.
 */

import { SYSTEM_PERMISSIONS, ROLE_PERMISSION_MAP, UserRole } from '@bcip/auth';

/**
 * Normalizes user role string to canonical UserRole enum
 */
export function normalizeUserRole(roleString?: string | null): UserRole {
  if (!roleString) return 'RESIDENT_TENANT';

  const cleaned = roleString.trim();

  // Direct match to UserRole values
  const knownRoles: Record<string, UserRole> = {
    PLATFORM_SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
    MANAGING_AGENT_ADMIN: 'MANAGING_AGENT_ADMIN',
    PORTFOLIO_MANAGER: 'PORTFOLIO_MANAGER',
    SCHEME_TRUSTEE: 'SCHEME_TRUSTEE',
    PROPERTY_OWNER: 'PROPERTY_OWNER',
    RESIDENT_TENANT: 'RESIDENT_TENANT',
    CONTRACTOR_SERVICE: 'CONTRACTOR_SERVICE',
    CONTRACTOR: 'CONTRACTOR_SERVICE',
    AINUBIS_SERVICE_AGENT: 'AINUBIS_SERVICE_AGENT',
    AINUBIS_AGENT: 'AINUBIS_SERVICE_AGENT',

    // Descriptive titles mapping to functional roles
    'Lead Portfolio Manager': 'MANAGING_AGENT_ADMIN',
    'Portfolio Manager': 'PORTFOLIO_MANAGER',
    'Senior Portfolio Manager': 'MANAGING_AGENT_ADMIN',
    'Managing Agent': 'MANAGING_AGENT_ADMIN',
    'Managing Agent Admin': 'MANAGING_AGENT_ADMIN',
    'Super Admin': 'PLATFORM_SUPER_ADMIN',
    'Trustee Chairperson': 'SCHEME_TRUSTEE',
    Trustee: 'SCHEME_TRUSTEE',
    Owner: 'PROPERTY_OWNER',
    Tenant: 'RESIDENT_TENANT',
    Contractor: 'CONTRACTOR_SERVICE',
  };

  return knownRoles[cleaned] || 'RESIDENT_TENANT';
}

/**
 * Checks if a user has a specific permission
 */
export function checkPermission(roleString: string | undefined | null, permission: string): boolean {
  const role = normalizeUserRole(roleString);
  const permissions = ROLE_PERMISSION_MAP[role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if user is permitted to view the CRM sales pipeline
 */
export function canViewPipeline(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_VIEW);
}

/**
 * Checks if user is permitted to create new opportunities
 */
export function canCreateOpportunity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_CREATE);
}

/**
 * Checks if user is permitted to edit opportunity details
 */
export function canEditOpportunity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_EDIT);
}

/**
 * Checks if user is permitted to transition opportunity pipeline stages
 */
export function canTransitionStage(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_STAGE);
}

/**
 * Checks if user is permitted to soft-delete an opportunity
 */
export function canDeleteOpportunity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_OPPORTUNITY_DELETE);
}

/**
 * Checks if user is permitted to view CRM leads
 */
export function canViewLeads(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_LEAD_VIEW);
}

/**
 * Checks if user is permitted to create new CRM leads
 */
export function canCreateLead(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_LEAD_CREATE);
}

/**
 * Checks if user is permitted to edit CRM leads
 */
export function canEditLead(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_LEAD_EDIT);
}

/**
 * Checks if user is permitted to convert leads to opportunities
 */
export function canConvertLead(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_LEAD_CONVERT);
}

/**
 * Checks if user is permitted to soft-delete CRM leads
 */
export function canDeleteLead(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_LEAD_DELETE);
}

/**
 * Checks if user is permitted to view CRM organisations
 */
export function canViewOrganisations(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ORGANISATION_VIEW);
}

/**
 * Checks if user is permitted to create new CRM organisations
 */
export function canCreateOrganisation(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ORGANISATION_CREATE);
}

/**
 * Checks if user is permitted to edit CRM organisations
 */
export function canEditOrganisation(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ORGANISATION_EDIT);
}

/**
 * Checks if user is permitted to soft-delete CRM organisations
 */
export function canDeleteOrganisation(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ORGANISATION_DELETE);
}

/**
 * Checks if user is permitted to view CRM scheme prospects
 */
export function canViewSchemeProspects(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_VIEW);
}

/**
 * Checks if user is permitted to create CRM scheme prospects
 */
export function canCreateSchemeProspect(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_CREATE);
}

/**
 * Checks if user is permitted to edit CRM scheme prospects
 */
export function canEditSchemeProspect(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_EDIT);
}

/**
 * Checks if user is permitted to soft-delete CRM scheme prospects
 */
export function canDeleteSchemeProspect(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_SCHEME_PROSPECT_DELETE);
}

/**
 * Checks if user is permitted to view CRM activities
 */
export function canViewActivities(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ACTIVITY_VIEW);
}

/**
 * Checks if user is permitted to create CRM activities
 */
export function canCreateActivity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ACTIVITY_CREATE);
}

/**
 * Checks if user is permitted to edit CRM activities
 */
export function canEditActivity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ACTIVITY_EDIT);
}

/**
 * Checks if user is permitted to soft-delete CRM activities
 */
export function canDeleteActivity(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_ACTIVITY_DELETE);
}

/**
 * Checks if user is permitted to view CRM tasks
 */
export function canViewTasks(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_TASK_VIEW);
}

/**
 * Checks if user is permitted to create CRM tasks
 */
export function canCreateTask(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_TASK_CREATE);
}

/**
 * Checks if user is permitted to edit CRM tasks
 */
export function canEditTask(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_TASK_EDIT);
}

/**
 * Checks if user is permitted to mark CRM tasks as complete
 */
export function canCompleteTask(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_TASK_COMPLETE);
}

/**
 * Checks if user is permitted to soft-delete CRM tasks
 */
export function canDeleteTask(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_TASK_DELETE);
}

/**
 * Checks if user is permitted to view Ainubis CRM intelligence records
 */
export function canViewAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_VIEW);
}

/**
 * Checks if user is permitted to trigger Ainubis intelligence analysis
 */
export function canGenerateAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_GENERATE);
}

/**
 * Checks if user is permitted to review Ainubis observations
 */
export function canReviewAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_REVIEW);
}

/**
 * Checks if user is permitted to approve/reject Ainubis recommendations
 */
export function canApproveAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_APPROVE);
}

/**
 * Checks if user is permitted to execute approved Ainubis actions
 */
export function canExecuteAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_EXECUTE);
}

/**
 * Checks if user is permitted to dismiss Ainubis observations
 */
export function canDismissAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_DISMISS);
}

/**
 * Checks if user is permitted to configure or trigger Ainubis continuous monitoring
 */
export function canMonitorAI(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_MONITOR);
}

/**
 * Checks if user is permitted to view Ainubis AI actions
 */
export function canViewAIActions(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_ACTION_VIEW);
}

/**
 * Checks if user is permitted to approve Ainubis AI actions
 */
export function canApproveAIActions(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_ACTION_APPROVE);
}

/**
 * Checks if user is permitted to reject Ainubis AI actions
 */
export function canRejectAIActions(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_ACTION_REJECT);
}

/**
 * Checks if user is permitted to execute approved Ainubis AI actions
 */
export function canExecuteAIActions(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_ACTION_EXECUTE);
}

/**
 * Checks if user is permitted to manage or configure Ainubis AI actions
 */
export function canAdminAIActions(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_ACTION_ADMIN);
}

/**
 * Checks if user is permitted to view Ainubis workflows
 */
export function canViewWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_VIEW);
}

/**
 * Checks if user is permitted to create Ainubis workflows
 */
export function canCreateWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_CREATE);
}

/**
 * Checks if user is permitted to edit Ainubis workflows
 */
export function canEditWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_EDIT);
}

/**
 * Checks if user is permitted to activate/pause Ainubis workflows
 */
export function canActivateWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ACTIVATE);
}

/**
 * Checks if user is permitted to manually run Ainubis workflows
 */
export function canRunWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_RUN);
}

/**
 * Checks if user is permitted to approve workflow execution gates
 */
export function canApproveWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_APPROVE);
}

/**
 * Checks if user is permitted to manage workflow administration
 */
export function canAdminWorkflows(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_ADMIN);
}

/**
 * Checks if user is permitted to view Ainubis workflow templates
 */
export function canViewWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_VIEW);
}

/**
 * Checks if user is permitted to create Ainubis workflow templates
 */
export function canCreateWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_CREATE);
}

/**
 * Checks if user is permitted to edit Ainubis workflow templates
 */
export function canEditWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_EDIT);
}

/**
 * Checks if user is permitted to publish Ainubis workflow templates
 */
export function canPublishWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_PUBLISH);
}

/**
 * Checks if user is permitted to archive/delete Ainubis workflow templates
 */
export function canArchiveWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_ARCHIVE);
}

/**
 * Checks if user is permitted to instantiate Ainubis workflow templates into active workflows
 */
export function canInstantiateWorkflowTemplates(roleString?: string | null): boolean {
  return checkPermission(roleString, SYSTEM_PERMISSIONS.CRM_AI_WORKFLOW_TEMPLATE_INSTANTIATE);
}




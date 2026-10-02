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


/**
 * BCIP Schema Foundation: Multi-tenant partitioning structure
 * Detailed SQL/ORM migrations will be generated in Prompt 003 — Database Foundation
 */

export interface TenantEntity {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  updatedAt: string;
}

export interface SchemeEntity {
  id: string;
  tenantId: string;
  name: string;
  registrationNumber: string;
  sectionalTitleSchemeCode: string;
  totalUnits: number;
  financialYearEndMonth: number;
  status: 'active' | 'in_transition' | 'archived';
}

export interface UnitEntity {
  id: string;
  schemeId: string;
  tenantId: string;
  unitNumber: string;
  sectionNumber: string;
  participationQuota: number;
  ownerId?: string;
  tenantResidentId?: string;
}

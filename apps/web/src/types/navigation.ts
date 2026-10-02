export type ModuleId =
  | 'dashboard'
  | 'crm'
  | 'leads'
  | 'organisations'
  | 'scheme_prospects'
  | 'activities'
  | 'schemes'
  | 'properties'
  | 'finance'
  | 'invoices'
  | 'payments'
  | 'maintenance'
  | 'contractors'
  | 'governance'
  | 'documents'
  | 'integrations'
  | 'analytics'
  | 'ainubis'
  | 'alerts'
  | 'recommendations'
  | 'tasks'
  | 'notifications'
  | 'administration'
  | 'design_system';

export interface NavItem {
  id: ModuleId;
  label: string;
  iconName: string;
  badgeCount?: number;
  description: string;
  phase: string;
  isNew?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const ENTERPRISE_NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', iconName: 'dashboard', description: 'Platform operational overview & KPIs', phase: 'Phase 1' },
    ],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    items: [
      { id: 'crm', label: 'CRM', iconName: 'crm', description: 'Customer relationship tracking', phase: 'Phase 2' },
      { id: 'leads', label: 'Leads', iconName: 'leads', description: 'Managing agent pipeline & intake', phase: 'Phase 2' },
      { id: 'organisations', label: 'Organisations', iconName: 'organisations', description: 'Managing agents & multi-tier portfolios', phase: 'Phase 2' },
      { id: 'scheme_prospects', label: 'Scheme Prospects', iconName: 'schemes', description: 'Sectional title & HOA prospect records', phase: 'Phase 2' },
      { id: 'activities', label: 'Activities', iconName: 'activity', description: 'Customer interactions & call logs', phase: 'Phase 2' },
      { id: 'tasks', label: 'Tasks', iconName: 'tasks', description: 'CRM action items & follow-up queue', phase: 'Phase 2' },
    ],
  },
  {
    id: 'property',
    label: 'Property',
    items: [
      { id: 'schemes', label: 'Schemes', iconName: 'schemes', description: 'Body corporate schemes & sectional registers', phase: 'Phase 2' },
      { id: 'properties', label: 'Properties', iconName: 'properties', description: 'Unit registers, sections & exclusive use areas', phase: 'Phase 2' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'finance', label: 'Finance', iconName: 'finance', description: 'Levy accounts, reserve funds & general ledger', phase: 'Phase 3' },
      { id: 'invoices', label: 'Invoices', iconName: 'invoices', description: 'Billing schedules, special levies & debtor rolls', phase: 'Phase 3' },
      { id: 'payments', label: 'Payments', iconName: 'payments', description: 'Debit order runs & bank reconciliations', phase: 'Phase 3' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'maintenance', label: 'Maintenance', iconName: 'maintenance', description: 'Common property work tickets & asset logs', phase: 'Phase 3' },
      { id: 'contractors', label: 'Contractors', iconName: 'contractors', description: 'Vendor directory, compliance & SLAs', phase: 'Phase 3' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      { id: 'governance', label: 'Governance', iconName: 'governance', description: 'AGMs, electronic voting & trustee resolutions', phase: 'Phase 4' },
      { id: 'documents', label: 'Documents', iconName: 'documents', description: 'Sectional title archives, plans & policies', phase: 'Phase 4' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      { id: 'integrations', label: 'Integrations', iconName: 'integrations', description: 'Accounting, banking & smart meter APIs', phase: 'Phase 4' },
      { id: 'analytics', label: 'Analytics', iconName: 'analytics', description: 'Cross-scheme benchmarking & aging curves', phase: 'Phase 4' },
    ],
  },
  {
    id: 'ainubis',
    label: 'Ainubis Intelligence',
    items: [
      { id: 'ainubis', label: 'Ainubis Intelligence', iconName: 'ainubis', description: 'Intelligence engine & cognitive gateway', phase: 'Phase 5' },
      { id: 'alerts', label: 'Alerts', iconName: 'alerts', badgeCount: 3, description: 'Proactive anomaly flags & thresholds', phase: 'Phase 5' },
      { id: 'recommendations', label: 'Recommendations', iconName: 'recommendations', badgeCount: 2, description: 'AI-assisted trustee decision support', phase: 'Phase 5' },
      { id: 'tasks', label: 'Tasks', iconName: 'tasks', badgeCount: 19, description: 'Unified workflow approvals queue', phase: 'Phase 5' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', iconName: 'notifications', description: 'Omnichannel routing & broadcast logs', phase: 'Phase 5' },
      { id: 'administration', label: 'Administration', iconName: 'administration', description: 'Tenants, RBAC & system security audit', phase: 'Phase 1-6' },
      { id: 'design_system', label: 'Design System', iconName: 'palette', description: 'Enterprise tokens & UI catalog', phase: 'Phase 2A' },
    ],
  },
];

/**
 * Development & Prototype Mock Data
 * Explicitly identified as development/demo data for Prompt 001 Foundation Shell.
 * Production multi-tenant data will be populated from PostgreSQL in subsequent prompts.
 */

export const IS_DEMO_DATA_ENVIRONMENT = true;

export interface PortfolioMetric {
  id: string;
  label: string;
  value: string;
  benchmark: string;
  subtext: string;
}

export const DEMO_PORTFOLIO_METRICS: PortfolioMetric[] = [
  {
    id: 'orgs',
    label: 'Managing Organisations',
    value: '4',
    benchmark: 'Demo Tenant Pool',
    subtext: '4 active managing agents across 2 provinces',
  },
  {
    id: 'schemes',
    label: 'Registered Schemes',
    value: '28',
    benchmark: 'Sectional Title Portfolios',
    subtext: '1,420 total residential & commercial units',
  },
  {
    id: 'open_tasks',
    label: 'Open Action Tasks',
    value: '19',
    benchmark: 'Governance & Maintenance',
    subtext: '5 urgent trustee approvals pending',
  },
  {
    id: 'active_alerts',
    label: 'Ainubis Monitored Alerts',
    value: '3',
    benchmark: 'Automated Thresholds',
    subtext: '2 levy variance flags · 1 compliance renewal',
  },
];

export interface DemoSchemeSummary {
  id: string;
  name: string;
  organisation: string;
  units: number;
  financialYearEnd: string;
  status: 'Nominal' | 'Action Required' | 'Review';
}

export const DEMO_SCHEMES_LIST: DemoSchemeSummary[] = [
  {
    id: 'sch-01',
    name: 'Silvercreek Heights Body Corporate',
    organisation: 'Vanguard Property Management',
    units: 64,
    financialYearEnd: '28 Feb',
    status: 'Nominal',
  },
  {
    id: 'sch-02',
    name: 'The Peninsula Sectional Scheme',
    organisation: 'Apex Managing Agents',
    units: 112,
    financialYearEnd: '31 Aug',
    status: 'Action Required',
  },
  {
    id: 'sch-03',
    name: 'Kensington Gardens Body Corporate',
    organisation: 'Vanguard Property Management',
    units: 48,
    financialYearEnd: '30 Nov',
    status: 'Nominal',
  },
  {
    id: 'sch-04',
    name: 'Atlantic Waves Luxury Scheme',
    organisation: 'Highland Strata Partners',
    units: 36,
    financialYearEnd: '31 Dec',
    status: 'Review',
  },
];

export interface DemoTaskItem {
  id: string;
  title: string;
  scheme: string;
  priority: 'High' | 'Normal' | 'Urgent';
  due: string;
  category: 'Maintenance' | 'Governance' | 'Finance';
}

export const DEMO_RECENT_TASKS: DemoTaskItem[] = [
  {
    id: 'tsk-101',
    title: 'Water booster pump replacement sign-off',
    scheme: 'Silvercreek Heights',
    priority: 'Urgent',
    due: 'Today, 16:00',
    category: 'Maintenance',
  },
  {
    id: 'tsk-102',
    title: 'Annual General Meeting pack dissemination',
    scheme: 'The Peninsula Scheme',
    priority: 'High',
    due: '25 Sep 2026',
    category: 'Governance',
  },
  {
    id: 'tsk-103',
    title: 'Section 32 reserve fund budget audit review',
    scheme: 'Kensington Gardens',
    priority: 'Normal',
    due: '28 Sep 2026',
    category: 'Finance',
  },
];

export interface DemoAinubisStatus {
  layerStatus: 'Operational' | 'Standby' | 'Degraded';
  orchestratorVersion: string;
  activeAgents: number;
  lastTelemetryPing: string;
  pendingRecommendations: number;
}

export const DEMO_AINUBIS_STATUS: DemoAinubisStatus = {
  layerStatus: 'Operational',
  orchestratorVersion: 'Ainubis Core v0.1.0-alpha',
  activeAgents: 3,
  lastTelemetryPing: 'Real-time heartbeat synchronized',
  pendingRecommendations: 2,
};

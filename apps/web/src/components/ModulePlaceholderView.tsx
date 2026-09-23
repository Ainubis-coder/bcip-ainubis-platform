import React from 'react';
import { ModuleId } from '../types/navigation';
import { PageHeader } from './PageHeader';
import { Card, Button, Badge } from '@bcip/ui';

interface ModulePlaceholderViewProps {
  moduleId: ModuleId;
  onNavigateBack: () => void;
  onOpenStatusModal: () => void;
}

const MODULE_SPECS: Record<
  ModuleId,
  {
    title: string;
    phase: string;
    promptTarget: string;
    description: string;
    keyCapabilities: string[];
    dataBoundary: string;
  }
> = {
  dashboard: {
    title: 'Platform Overview',
    phase: 'Phase 1',
    promptTarget: 'Prompt 001',
    description: 'Executive overview of multi-tenant sectional title schemes.',
    keyCapabilities: ['Portfolio summary', 'Task aggregation', 'Ainubis status'],
    dataBoundary: 'Read-only portfolio metrics',
  },
  crm: {
    title: 'Customer Relationship Management (CRM)',
    phase: 'Phase 2',
    promptTarget: 'Prompt 005 — CRM & Client Management',
    description: 'Managing agent relationships, client accounts, trustees, and portfolio managers.',
    keyCapabilities: ['Managing-agent accounts', 'Client interaction logs', 'Tenant mapping'],
    dataBoundary: 'Tenant isolation enforced at schema level',
  },
  leads: {
    title: 'Lead Management & Agent Acquisition',
    phase: 'Phase 2',
    promptTarget: 'Prompt 006 — Lead Intelligence',
    description: 'New body corporate acquisition funnel, qualification, and handover pipeline.',
    keyCapabilities: ['Lead intake', 'Sectional title qualification', 'Portfolio handover'],
    dataBoundary: 'Tenant-agnostic intake with partition upon conversion',
  },
  organisations: {
    title: 'Managing Agent Organisations',
    phase: 'Phase 2',
    promptTarget: 'Prompt 007 — Managing Agent Onboarding',
    description: 'Multi-office managing agent firms, corporate entity hierarchies, and staff licensing.',
    keyCapabilities: ['Organisation profiles', 'Staff role delegation', 'Master billing agreements'],
    dataBoundary: 'Primary tenant boundary (TenantEntity)',
  },
  schemes: {
    title: 'Body Corporate Schemes & Strata Management',
    phase: 'Phase 2',
    promptTarget: 'Prompt 008 — Scheme Management',
    description: 'Sectional title registration, CSOS compliance numbers, participation quotas, and rules.',
    keyCapabilities: ['Scheme register', 'Trustee rosters', 'Sectional plans & PQ schedules'],
    dataBoundary: 'Partitioned by tenant_id and scheme_id',
  },
  properties: {
    title: 'Unit Registers & Sections',
    phase: 'Phase 2',
    promptTarget: 'Prompt 009 — Property & Section Registers',
    description: 'Sectional units, exclusive use areas (parking, storerooms), and ownership ledgers.',
    keyCapabilities: ['Section register', 'Ownership history', 'PQ calculations'],
    dataBoundary: 'Child of scheme_id partition',
  },
  finance: {
    title: 'Financial Management & General Ledger',
    phase: 'Phase 3',
    promptTarget: 'Prompt 010 — Financial Engine',
    description: 'Sectional title administrative fund, 10-year reserve fund, and bank integrations.',
    keyCapabilities: ['Admin & reserve ledgers', 'Budget modeling', 'Bank transaction feeds'],
    dataBoundary: 'Strict ledger immutability and fiscal isolation',
  },
  invoices: {
    title: 'Levy Rolls & Billing Automation',
    phase: 'Phase 3',
    promptTarget: 'Prompt 011 — Invoicing & Levies',
    description: 'Monthly levy generation, special levies, interest calculations, and payment notices.',
    keyCapabilities: ['Automated levy runs', 'Special levy schedules', 'Arrears tracking'],
    dataBoundary: 'Encrypted financial records per scheme',
  },
  payments: {
    title: 'Debit Orders & Payment Reconciliation',
    phase: 'Phase 3',
    promptTarget: 'Prompt 012 — Payment Gateways',
    description: 'Direct debit collection runs, payment gateway webhooks, and automated matching.',
    keyCapabilities: ['Debit order batches', 'Payment gateway connectors', 'Auto-reconciliation'],
    dataBoundary: 'PCI-DSS scoped tokenization and tenant isolation',
  },
  maintenance: {
    title: 'Work Orders & Facility Maintenance',
    phase: 'Phase 3',
    promptTarget: 'Prompt 013 — Maintenance Workflows',
    description: 'Common property defect logging, job cards, quote comparisons, and dispatch.',
    keyCapabilities: ['Ticket lifecycle', 'Contractor quote requests', 'Trustee sign-off'],
    dataBoundary: 'Scoped to scheme common property boundaries',
  },
  contractors: {
    title: 'Approved Contractor Directory',
    phase: 'Phase 3',
    promptTarget: 'Prompt 014 — Contractor Management',
    description: 'Vetted vendors, health & safety certifications, insurance policies, and ratings.',
    keyCapabilities: ['Vendor directory', 'Insurance expiry tracking', 'Performance metrics'],
    dataBoundary: 'Platform-wide directory with tenant-specific preferred lists',
  },
  governance: {
    title: 'Statutory Governance & Compliance',
    phase: 'Phase 4',
    promptTarget: 'Prompt 015 — Governance & AGMs',
    description: 'Annual General Meetings, quorum calculation, proxy votes, and resolution archives.',
    keyCapabilities: ['Meeting agendas & packs', 'Electronic proxy voting', 'Resolution audit log'],
    dataBoundary: 'Tamper-evident statutory records per scheme',
  },
  documents: {
    title: 'Document Management & Archives',
    phase: 'Phase 4',
    promptTarget: 'Prompt 016 — Document Intelligence',
    description: 'Sectional plans, conduct rules, financial statements, and insurance policies.',
    keyCapabilities: ['Versioned storage', 'OCR indexing', 'Secure owner portal access'],
    dataBoundary: 'Encrypted object storage partitioned by tenant/scheme',
  },
  integrations: {
    title: 'Enterprise Connectors & APIs',
    phase: 'Phase 4',
    promptTarget: 'Prompt 017 — Third-Party Integrations',
    description: 'ERP connectors (Xero, Sage), smart utility meter APIs, and communication gateways.',
    keyCapabilities: ['ERP bi-directional sync', 'Smart meter ingestion', 'SMS & WhatsApp dispatch'],
    dataBoundary: 'Scoped OAuth credentials per managing agent tenant',
  },
  analytics: {
    title: 'Cross-Scheme Analytics & Benchmarking',
    phase: 'Phase 4',
    promptTarget: 'Prompt 018 — Advanced Analytics',
    description: 'Reserve fund adequacy forecasts, utility consumption trends, and portfolio benchmarking.',
    keyCapabilities: ['Cohort analysis', 'Levy arrears predictive curves', 'Portfolio telemetry'],
    dataBoundary: 'Anonymized cross-tenant benchmarks with tenant-isolated details',
  },
  ainubis: {
    title: 'Ainubis Cognitive Intelligence',
    phase: 'Phase 5',
    promptTarget: 'Prompt 019 — Ainubis Intelligence Activation',
    description: 'Proactive property intelligence, anomaly detection, and autonomous recommendation reasoning.',
    keyCapabilities: ['Consumption variance models', 'Arrears risk scoring', 'Drafting governance notices'],
    dataBoundary: 'PII scrubbing prior to model inference; strict tenant sandboxing',
  },
  alerts: {
    title: 'Ainubis Proactive Anomaly Alerts',
    phase: 'Phase 5',
    promptTarget: 'Prompt 020 — Anomaly Alert Engine',
    description: 'Real-time telemetry spikes, utility leak flags, and critical compliance expirations.',
    keyCapabilities: ['Telemetry threshold monitor', 'Critical variance flags', 'Urgent SMS/Email triggers'],
    dataBoundary: 'Rule engine partitioned per scheme sensor feeds',
  },
  recommendations: {
    title: 'Ainubis Trustee Decision Support',
    phase: 'Phase 5',
    promptTarget: 'Prompt 021 — Recommendation Engine',
    description: 'Explainable AI recommendations for reserve fund allocations, contractor selection, and preventative maintenance.',
    keyCapabilities: ['Evidence-backed proposals', 'Confidence scoring', 'Cost-benefit modeling'],
    dataBoundary: 'Advisory only; never executes without human trustee approval',
  },
  tasks: {
    title: 'Unified Approval & Task Queue',
    phase: 'Phase 5',
    promptTarget: 'Prompt 022 — Workflow Orchestration',
    description: 'Consolidated approval queue across financial disbursements, contractor quotes, and maintenance sign-offs.',
    keyCapabilities: ['Multi-level approvals', 'SLA tracking', 'Audit trails'],
    dataBoundary: 'Role-based authorization scoped by tenant and scheme',
  },
  notifications: {
    title: 'Omnichannel Notification Engine',
    phase: 'Phase 5',
    promptTarget: 'Prompt 023 — Notification Dispatcher',
    description: 'Push, SMS, email, and WhatsApp communications with delivery status and audit logs.',
    keyCapabilities: ['Template engine', 'Channel fallbacks', 'Opt-out compliance'],
    dataBoundary: 'Strict PII isolation per recipient',
  },
  administration: {
    title: 'Platform Administration & Security',
    phase: 'Phase 1-6',
    promptTarget: 'Prompt 024 — System Admin',
    description: 'Tenant management, RBAC configuration, audit logs, and system health telemetry.',
    keyCapabilities: ['User management', 'Security audits', 'Service health monitoring'],
    dataBoundary: 'Platform super-admin and tenant administrator views',
  },
  design_system: {
    title: 'Design System & Component Showcase',
    phase: 'Phase 2A',
    promptTarget: 'Prompt 002A — Enterprise Design System',
    description: 'Live interactive tokens, components, themes, and accessibility primitives.',
    keyCapabilities: ['Tokens review', 'Component library', 'Accessibility verification'],
    dataBoundary: 'UI system showcase for platform developers and auditors',
  },
};

export function ModulePlaceholderView({
  moduleId,
  onNavigateBack,
  onOpenStatusModal,
}: ModulePlaceholderViewProps) {
  const spec = MODULE_SPECS[moduleId] || {
    title: 'Enterprise Module',
    phase: 'Future Phase',
    promptTarget: 'Controlled Prompt Roadmap',
    description: 'This module is scheduled in the phased architecture plan.',
    keyCapabilities: ['Domain modeling', 'UI workflow', 'Data isolation'],
    dataBoundary: 'Tenant partitioned',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={spec.title}
        description={spec.description}
        breadcrumbs={[
          { label: 'BCIP' },
          { label: 'Modules' },
          { label: spec.title },
        ]}
        onNavigate={onNavigateBack}
        statusBadge={<Badge variant="neutral">{spec.phase} Roadmap</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={onNavigateBack}>
            ← Return to Dashboard
          </Button>
        }
      />

      <Card
        title="Module Architecture & Roadmap Specification"
        description={`Target Release: ${spec.promptTarget}`}
        padding="md"
        headerAction={
          <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {spec.phase}
          </span>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-950/60 p-4 rounded border border-slate-800 text-xs text-slate-300">
            <p className="leading-relaxed">{spec.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded bg-slate-950/40 border border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Planned Functional Capabilities
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {spec.keyCapabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded bg-slate-950/40 border border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Data Boundary & Multi-Tenancy
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {spec.dataBoundary}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                Shared package ready: <span className="font-mono text-slate-400">@bcip/*</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Per Phased Scope Control: Placeholder active; business logic deferred to target prompt.</span>
            <Button variant="secondary" size="sm" onClick={onOpenStatusModal}>
              Inspect API & Health
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

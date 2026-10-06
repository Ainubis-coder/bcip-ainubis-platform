/**
 * BCIP CRM Domain Module
 * Phase 002 — Step 002B: CRM Domain Model & Database Schema
 */

export * from './enums.ts';
export * from './types.ts';
export * from './ai-types.ts';
export * from './workflow-types.ts';
export * from './portfolio-types.ts';
export * from './report-types.ts';
export * from './events/crm-events.ts';
export * from './audit/crm-audit.ts';

// Repositories
export * from './repositories/base.repository.ts';
export * from './repositories/organisation.repository.ts';
export * from './repositories/contact.repository.ts';
export * from './repositories/campaign.repository.ts';
export * from './repositories/scheme-prospect.repository.ts';
export * from './repositories/lead.repository.ts';
export * from './repositories/opportunity.repository.ts';
export * from './repositories/activity.repository.ts';
export * from './repositories/task.repository.ts';
export * from './repositories/ai-observation.repository.ts';
export * from './repositories/ai-monitoring-execution.repository.ts';
export * from './repositories/ai-action.repository.ts';
export * from './repositories/proposal.repository.ts';
export * from './repositories/contract.repository.ts';
export * from './repositories/automation-workflow.repository.ts';
export * from './repositories/workflow-run.repository.ts';
export * from './repositories/workflow-template.repository.ts';
export * from './repositories/portfolio-intelligence.repository.ts';
export * from './repositories/executive-report.repository.ts';

// Domain Services
export * from './services/organisation.service.ts';
export * from './services/contact.service.ts';
export * from './services/campaign.service.ts';
export * from './services/scheme-prospect.service.ts';
export * from './services/lead.service.ts';
export * from './services/opportunity.service.ts';
export * from './services/activity.service.ts';
export * from './services/task.service.ts';
export * from './services/proposal.service.ts';
export * from './services/contract.service.ts';
export * from './services/ainubis-context.builder.ts';
export * from './services/ainubis-pipeline-hygiene.service.ts';
export * from './services/ainubis-summary.service.ts';
export * from './services/ainubis-crm-health.service.ts';
export * from './services/ainubis-capability.registry.ts';
export * from './services/ainubis-continuous-monitor.service.ts';
export * from './services/ainubis-action-template.registry.ts';
export * from './services/ainubis-action-verification.service.ts';
export * from './services/ainubis-action-execution.service.ts';
export * from './services/ainubis-workflow-orchestration.service.ts';
export * from './services/ainubis-workflow-validator.service.ts';
export * from './services/ainubis-workflow-analytics.service.ts';
export * from './services/ainubis-portfolio-intelligence.service.ts';
export * from './services/ainubis-executive-reporting.service.ts';

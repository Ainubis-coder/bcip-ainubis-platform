/**
 * BCIP CRM Frontend Module Exports
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 */

export * from './shared/crm-types';
export * from './shared/crm-formatters';
export * from './shared/crm-permissions';
export * from './shared/crm-api';

export * from './pipeline/CrmPipelinePage';
export * from './pipeline/PipelineBoard';
export * from './pipeline/PipelineColumn';
export * from './pipeline/OpportunityCard';
export * from './pipeline/OpportunityStageTransitionDialog';
export * from './pipeline/CreateOpportunityDialog';
export * from './pipeline/OpportunityDetailModal';
export { PipelineSummary as PipelineSummaryWidget } from './pipeline/PipelineSummary';
export * from './pipeline/PipelineFilters';
export * from './pipeline/PipelineSkeleton';
export * from './pipeline/PipelineEmptyState';
export * from './pipeline/PipelineErrorState';

export * from './leads';
export * from './conversion';
export * from './organisations';
export * from './scheme-prospects';

# Changelog

All notable changes to the Body Corporate Intelligence Platform (BCIP) and Ainubis AI Layer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-10-01

### Added
- **Phase 2D CRM Frontend — Prompt 002D-003: CRM Lead Conversion Wizard**
- Implemented production **Lead Conversion Wizard** modal dialog connected to the atomic Phase 2C REST endpoint (`POST /api/v1/leads/:id/convert`):
  - `LeadConversionWizard` (`apps/web/src/components/crm/conversion/LeadConversionWizard.tsx`): Master multi-step modal container orchestrating state transitions, submission, idempotency, and results.
  - `LeadConversionProgress` (`apps/web/src/components/crm/conversion/LeadConversionProgress.tsx`): Accessible 4-step progress tracker with step navigation and completed indicators.
  - `LeadConversionStepReview` (`apps/web/src/components/crm/conversion/LeadConversionStepReview.tsx`): Step 1 reviewing lead title, scheme scope, direct contact info, and data quality readiness.
  - `LeadConversionStepData` (`apps/web/src/components/crm/conversion/LeadConversionStepData.tsx`): Step 2 capturing entity fields for Organisation (name, type, or existing ID), Primary Contact (first name, last name), Scheme Prospect (toggle creation, units), and Sales Opportunity (deal name, ZAR estimated value, expected close date).
  - `LeadConversionStepConfirm` (`apps/web/src/components/crm/conversion/LeadConversionStepConfirm.tsx`): Step 3 displaying an immutable summary of all entities to be created and linked within the authenticated tenant context.
  - `LeadConversionStepSuccess` (`apps/web/src/components/crm/conversion/LeadConversionStepSuccess.tsx`): Step 4 displaying created database records with quick action navigation: "View Opportunity in Pipeline" and "Return to Leads".
  - `LeadConversionError` (`apps/web/src/components/crm/conversion/LeadConversionError.tsx`): Accessible error banner handling 400, 403, 404, 409 conflict, 422 validation, and 500 server errors with retry action.
- Extended CRM Shared Query Layer:
  - `crm-types.ts`: Added `OrganisationType`, `ORGANISATION_TYPE_LABELS`, `ConvertLeadDto`, `ConvertedEntitySummary`, and `ConvertLeadResult`.
  - `crm-api.ts`: Added `convertLead(id: string, dto?: ConvertLeadDto)` with automatic `X-Idempotency-Key` header generation.
- Integrated conversion entry points across Leads UI:
  - `LeadRow.tsx`: Added "Convert" action button for rows when permitted by RBAC and not already converted.
  - `LeadCardMobile.tsx`: Added "Convert" action button for adaptive mobile card view.
  - `LeadDetailModal.tsx`: Added "Convert Lead" button in modal footer and converted status banner with direct pipeline link.
  - `LeadsPage.tsx`: Wired conversion state, modal mounting, list invalidation, and pipeline redirection.
- Authored automated test suite (`tests/crm-conversion.test.ts`) with 8 tests covering RBAC eligibility, live atomic conversion API execution, 409 duplicate conversion prevention, 403 forbidden gates, 422 validation rejections, 404 not found, and operational status queries.

## [0.5.0] - 2026-10-01

### Added
- **Phase 2D CRM Frontend — Prompt 002D-002: CRM Leads Management Table**
- Created production **Leads Management Table (`/leads`)** view connected to the Phase 2C REST API:
  - `LeadsPage` (`apps/web/src/components/crm/leads/LeadsPage.tsx`): Primary view with summary KPI strip (Total Leads, New Prospects, Qualified Fits, Converted), server-side debounced search, filtering, and sorting.
  - `LeadsTable` (`apps/web/src/components/crm/leads/LeadsTable.tsx`): Responsive tabular representation with sortable headers for Title, Status, and Created date.
  - `LeadRow` (`apps/web/src/components/crm/leads/LeadRow.tsx`): High-density desktop row with Zero-Pill metadata formatting for lead title, scheme scope, direct contact info, and acquisition source.
  - `LeadCardMobile` (`apps/web/src/components/crm/leads/LeadCardMobile.tsx`): Compact card layout for viewports under 768px.
  - `LeadFilters` (`apps/web/src/components/crm/leads/LeadFilters.tsx`): Toolbar with debounced search input, status filter dropdown, qualification filter dropdown, and sorting controls.
  - `LeadPagination` (`apps/web/src/components/crm/leads/LeadPagination.tsx`): Slicing indicator with page size selection (10/20/50 rows) and navigation buttons.
  - `LeadsSkeleton`, `LeadsEmptyState`, `LeadsErrorState`: Production UX fallbacks with accessible retry and reset flows.
  - `LeadDetailModal` (`apps/web/src/components/crm/leads/LeadDetailModal.tsx`): Inspection modal displaying commercial attributes, scheme scope, pain points, and timeline horizons.
  - `LeadFormModal` (`apps/web/src/components/crm/leads/LeadFormModal.tsx`): Modal form for capturing new leads and updating existing lead records.
  - `LeadStatusModal` (`apps/web/src/components/crm/leads/LeadStatusModal.tsx`): Status transition modal enforcing the authoritative backend `LeadStatus` enum (`NEW`, `ENRICHED`, `QUALIFIED`, `NURTURE`, `RE_ENGAGEMENT`, `LOST`, `CONVERTED`).
- Extended CRM Client Query Layer in `apps/web/src/components/crm/shared/`:
  - `crm-types.ts`: Added `Lead`, `CreateLeadDto`, `UpdateLeadDto`, `LeadsListResponse`, and configuration mappings for `LeadStatus`, `LeadSource`, `QualificationStatus`, `ExpectedTimeline`, and `DataQualityState`.
  - `crm-permissions.ts`: Added `canViewLeads`, `canCreateLead`, `canEditLead`, `canConvertLead`, and `canDeleteLead`.
  - `crm-api.ts`: Added `listLeads`, `getLead`, `createLead`, `updateLead`, and `deleteLead`.
- Integrated `leads` module into `AppShell.tsx` navigation under Commercial CRM group.
- Authored automated test suite (`tests/crm-leads.test.ts`) with 8 test cases verifying enums, RBAC, live API calls, search, status updates, soft-deletion, and pagination.

### Fixed
- **Node.js 22 Native Strip-Only Compatibility**:
  - Replaced TypeScript parameter properties (`constructor(private repo...)`) across all 10 CRM domain services with explicit class field declarations to fix `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]` during Cloud Run startup (`node server.ts`).
  - Added explicit `.ts` extensions to internal imports in `packages/workflows` to satisfy Node.js native ESM loader requirements.
  - Converted type-only imports across backend packages to `import type` to prevent Node 22 strip-only runtime import errors.

## [0.4.0] - 2026-09-30

### Added
- **Phase 2D CRM Frontend Foundation & Pipeline Kanban — Prompt 002D-001**
- Replaced CRM placeholder with production **CRM Sales Pipeline (`/crm`)** view:
  - `CrmPipelinePage` (`apps/web/src/components/crm/pipeline/CrmPipelinePage.tsx`): Primary view connected directly to the Phase 2C REST API (`/api/v1/opportunities`).
  - `PipelineBoard` (`apps/web/src/components/crm/pipeline/PipelineBoard.tsx`): Responsive 6-column Kanban board with mobile stage quick selector.
  - `PipelineColumn` (`apps/web/src/components/crm/pipeline/PipelineColumn.tsx`): Individual stage column with count badges, ZAR column value totals, and deal cards.
  - `OpportunityCard` (`apps/web/src/components/crm/pipeline/OpportunityCard.tsx`): High-density card with ZAR formatting (`formatZAR`), calibrated probability tracks, target close relative dates, and unboxed metadata (zero-pill discipline).
  - `OpportunityStageTransitionDialog` (`apps/web/src/components/crm/pipeline/OpportunityStageTransitionDialog.tsx`): Modal dialog for progressing deals with selectable target stage, optional audit reason, and API lifecycle submission.
  - `CreateOpportunityDialog` (`apps/web/src/components/crm/pipeline/CreateOpportunityDialog.tsx`): Modal dialog for creating new opportunities into the active tenant.
  - `OpportunityDetailModal` (`apps/web/src/components/crm/pipeline/OpportunityDetailModal.tsx`): Detailed opportunity inspector displaying full commercial attributes and immutable `OpportunityStageHistory` velocity audit records.
  - `PipelineSummary` (`apps/web/src/components/crm/pipeline/PipelineSummary.tsx`): KPI metric strip computing active pipeline deals, total pipeline value (ZAR), closed won revenue, and calibrated win probability from API data.
  - `PipelineFilters` (`apps/web/src/components/crm/pipeline/PipelineFilters.tsx`): Text search by deal name, scheme, or source, plus stage filter dropdown.
  - `PipelineSkeleton`, `PipelineEmptyState`, `PipelineErrorState`: Complete UX fallback handling without leaking stack traces.
- Created reusable CRM query layer and utilities in `apps/web/src/components/crm/shared/`:
  - `crm-api.ts`: Authenticated `CrmApiClient` generating JWT Bearer tokens matching `@bcip/auth` tokenService, tracking correlation request IDs, and wrapping REST operations.
  - `crm-formatters.ts`: `formatZAR`, `formatCompactZAR`, `formatDate`, `formatTargetDays`, `formatProbability`.
  - `crm-permissions.ts`: Client-side RBAC guards mapping UserRole to `crm:opportunity:view`, `crm:opportunity:create`, `crm:opportunity:stage`, `crm:opportunity:delete`.
  - `crm-types.ts`: Strongly typed frontend contracts and stage definitions matching backend models.
- Integrated `/crm` route into `AppShell.tsx` and updated navigation.
- Added comprehensive frontend automated test suite (`tests/crm-frontend.test.ts`) integrated into `tests/run-all.ts`.
- Authored CRM frontend documentation in `docs/crm/FRONTEND.md`.

## [0.3.0] - 2026-09-29

### Added
- **Phase 2 CRM & Sales Engine — Prompt 002B (CRM Domain Model & Database Schema)**
- Created complete CRM domain model in `packages/database/src/crm/`:
  - `enums.ts`: Controlled enums for `LeadStatus`, `LeadSource`, `QualificationStatus`, `ExpectedTimeline`, `OrganisationType`, `OrganisationStatus`, `ContactStatus`, `PreferredContactMethod`, `OpportunityStage`, `ActivityType`, `TaskStatus`, `TaskPriority`, `CampaignType`, `CampaignStatus`, `ProposalStatus`, `ContractStatus`, `DataQualityState`, and `CRMEventType`.
  - `types.ts`: Strongly typed entities, DTOs, and interfaces for `Lead`, `Contact`, `Organisation`, `SchemeProspect`, `Opportunity`, `OpportunityStageHistory`, `Activity`, `CRMTask`, `Campaign`, `Proposal`, `Contract`, `CRMAuditRecord`, and `CRMEvent`.
- Implemented PostgreSQL Relational Migrations:
  - `packages/database/src/migrations/0001_initial_multi_tenant_schema.sql`: Multi-tenant baseline, user management, and operational scheme partition tables.
  - `packages/database/src/migrations/0002_crm_domain_schema.sql`: Full DDL for 13 CRM relational tables (`crm_campaigns`, `crm_organisations`, `crm_contacts`, `crm_scheme_prospects`, `crm_leads`, `crm_opportunities`, `crm_opportunity_stage_history`, `crm_activities`, `crm_tasks`, `crm_proposals`, `crm_contracts`, `crm_audit_log`, `crm_ai_observations`), complete with foreign key cascades, tenant-scoped unique constraints, check constraints, decimal financial columns (`NUMERIC(14,2)`), and composite indexes.
  - Enhanced `MigrationManager` (`packages/database/src/migrations/migration-manager.ts`) to manage versioned migration state, statement execution, and status reporting.
- Developed multi-tenant repository layer with soft-deletion and tenant boundaries in `packages/database/src/crm/repositories/`:
  - `BaseCrmRepository`: Enforces `tenant_id` filtering and hides `deleted_at` records from operational queries.
  - Entity repositories: `OrganisationRepository`, `ContactRepository`, `CampaignRepository`, `SchemeProspectRepository`, `LeadRepository`, `OpportunityRepository`, `ActivityRepository`, `TaskRepository`, `ProposalRepository`, `ContractRepository`.
- Built CRM Domain Services in `packages/database/src/crm/services/`:
  - `LeadService`: Lead qualification, lifecycle management, and atomic `convertLead` transaction (creating linked Organisation, Contact, Scheme Prospect, Opportunity, Activity, and Audit record).
  - `OpportunityService`: Sales pipeline stage progression (`DISCOVERY → SOLUTION_DESIGN → PROPOSAL → CONTRACT → WON / LOST`) with mandatory `OpportunityStageHistory` velocity logging and probability calibration.
  - `ProposalService`: Multi-version quotation management, decimal item calculations, and commercial acceptance triggers.
  - `ContractService`: Master Services Agreement lifecycle management (`DRAFT` to `ACTIVE`), document references, and revenue activation.
  - `ActivityService`, `TaskService`, `OrganisationService`, `ContactService`, `SchemeProspectService`, `CampaignService`.
- Established event-driven integration and audit trail:
  - `CRMEventBus` (`packages/database/src/crm/events/crm-events.ts`): Emits 21 CRM event topics and connects to `@bcip/workflows`.
  - `CRMAuditService` (`packages/database/src/crm/audit/crm-audit.ts`): Centralized, immutable before/after state snapshots.
- Created development seed fixtures in `packages/database/src/seeds/crm.seed.ts` featuring realistic South African property management scenarios.
- Implemented comprehensive automated test suite in `tests/crm.test.ts` verifying all 15 acceptance tests (migration execution, tenant creation, org/contact/lead/scheme-prospect creation, opportunity stage progression, stage history, activities/tasks, proposals, contracts, strict tenant isolation, audit trails, soft deletion, and multi-entity lead conversion).
- Authored complete CRM documentation suite in `docs/crm/` (`README.md`, `DOMAIN_MODEL.md`, `DATABASE_SCHEMA.md`, `ERD.md`, `STATES_AND_LIFECYCLES.md`, `TENANCY_AND_SECURITY.md`, `EVENTS_AND_AUDIT.md`).

### Added
- **Phase 2 Architecture & Design System — Prompt 002A (Enterprise Design System & Design Tokens)**
- Created centralized design tokens under `packages/ui/src/tokens/`:
  - `colors.ts`: Semantic palette (brand, surface, text, border, status, interactive, ainubis) supporting 60-30-10 distribution.
  - `typography.ts`: Enterprise scale pairing Plus Jakarta Sans with JetBrains Mono tabular figures.
  - `spacing.ts`: Centralized space scale (space-0 to space-24) and touch target minimums.
  - `borders.ts`: Restrained border radius scale (radius-none to radius-lg).
  - `shadows.ts`: Single-elevation depth rule with shadow tokens reserved strictly for overlays.
  - `motion.ts`: Latency budgets (150ms micro-interactions, 200ms modals) respecting `prefers-reduced-motion`.
  - `zIndex.ts` and `breakpoints.ts`: Standardized stacking context and viewport breakpoints.
- Implemented Dual-Theme architecture (`darkTheme` and `lightTheme`) with semantic token mapping.
- Added layout primitives in `packages/ui/src/primitives/`: `Box`, `Stack`, `Inline`, `Grid`, `Container`, `Divider`.
- Established enterprise UI component library in `packages/ui/src/components/`:
  - `Button` and `IconButton` with primary, secondary, outline, ghost, danger, and ainubis variants.
  - Form controls: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Label`.
  - Data display: `Badge`, `Avatar`, `Card`, `Panel`, `StatusIndicator`, `Table`, `Pagination`.
  - Overlays: `Modal`, `Dialog`, `Dropdown`, `Tooltip`, `Popover`.
  - Navigation: `Tabs`, `Breadcrumbs`.
  - Feedback: `Alert`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `LoadingState`, `ErrorState`.
- Implemented **Ainubis Visual Foundation**:
  - Clear visual demarcation between `Observation`, `Insight`, `Recommendation`, `Alert`, and `Human Approval Required`.
  - Built `AinubisBadge`, `AinubisCard`, `AinubisBanner` with structured evidence lists and confidence scores.
- Created reusable composite patterns in `packages/ui/src/patterns/`: `DataTablePattern`, `MetricCardPattern`, `FormSectionPattern`.
- Added accessibility foundation (`VisuallyHidden`, `useReducedMotion`, high-contrast `focusVisibleClasses`).
- Built interactive **Design System & Tokens Showcase** view inside the web application (`apps/web/src/components/DesignSystemShowcase.tsx`), accessible from the top bar and sidebar navigation.
- Created complete design system documentation in `docs/design-system/` (`README.md`, `TOKENS.md`, `COMPONENTS.md`, `ACCESSIBILITY.md`, `THEMING.md`).
- Added automated design system test suite (`tests/design-system.test.ts`), integrated into `tests/run-all.ts`.

## [0.1.0] - 2026-09-23

### Added
- **Phase 1 Foundation Bootstrap (Prompt 001)**
- Established modular monorepo directory layout:
  - `apps/web`: React 19 + TypeScript + Tailwind CSS application shell.
  - `apps/api`: Express REST backend with structured logging and request correlation IDs.
  - `apps/worker`: Autonomous background worker queue processing foundation.
- Created domain shared packages:
  - `@bcip/ui`: Accessible design system primitives (Button, Card, Table, Modal, StatusIndicator).
  - `@bcip/database`: PostgreSQL connection pool, migration manager, and tenant partition models.
  - `@bcip/auth`: RBAC roles, permission matrix, and JWT validation service.
  - `@bcip/ai`: Ainubis AI Gateway abstraction, prompt templates, tool registry, and PII guardrails.
  - `@bcip/integrations`: Connector interfaces for accounting, payments, and messaging.
  - `@bcip/workflows`: Trigger-action automation engine.
- Established API endpoints:
  - `GET /health` with service status, uptime, and correlation ID.
  - `GET /api/v1/status` with application name, version, and capabilities.
- Implemented enterprise UI shell with zero-pill metadata, top-bar contract, and module placeholders.
- Built development environment container specification in `infrastructure/docker/docker-compose.yml` (PostgreSQL 16 & Redis 7).
- Authored Architecture Overview (`docs/architecture/README.md`) and Architecture Decision Record (`docs/ADR/ADR-001-project-foundation.md`).
- Added automated test suite covering config validation, API endpoints, worker queue, and web shell.

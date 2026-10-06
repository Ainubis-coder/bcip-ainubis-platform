# Changelog

All notable changes to the Body Corporate Intelligence Platform (BCIP) and Ainubis AI Layer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-06

### Added
- **Phase 3 Accounts Receivable, Customer Statements & Aging Intelligence (Prompt 003-006)**:
  - **Deterministic AR Aging Service**: Implemented server-authoritative 6-bucket aging (`CURRENT`, `DAYS_1_30`, `DAYS_31_60`, `DAYS_61_90`, `DAYS_91_120`, `DAYS_121_PLUS`) with integer minor-unit arithmetic in `ArAgingService`.
  - **Customer AR Balance Aggregation**: Provided multi-bucket customer balance summaries, total outstanding, and overdue amounts with multi-tenant isolation.
  - **Chronological Customer Statements**: Built deterministic statement generator supporting `fromDate`/`toDate`, opening/closing balances, running debit/credit ledger, and complete source traceability (`sourceType`, `sourceId`).
  - **Collection Priority & Action Intelligence**: Created explainable, non-autonomous prioritization scoring (0–100) and actionable recommendation rules (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `NORMAL`) with factual rationales.
  - **Commercial Ledger Reconciliation**: Introduced four-way diagnostic cross-entity audit between Invoices, Receivables, Payments, and Customer Balances with zero autonomous mutation.
  - **Frontend Workspace Integration**: Extended `CommercialBillingWorkspace` with dedicated views for AR Aging, Customer Statements, Collection Priority, and Reconciliation.
  - **Comprehensive QA Test Suite**: Added 40 automated test scenarios in `tests/ar-aging.test.ts` verifying exact boundary dates, customer balances, statement traceability, collection priority, reconciliation, multi-tenant isolation, and RBAC.

## [1.2.1] - 2026-10-06


### Fixed & Hardened
- **Phase 3 Billing Runtime Hardening & Final Acceptance Gate (Prompt 003-005-H)**:
  - **Node.js 22 Runtime Compatibility**: Refactored billing domain enums (`CustomerStatus`, `BillingFrequency`, `InvoiceStatus`) to `as const` object constants and union types for compatibility with Node.js 22 native type-stripping mode.
  - **Type-Only Import Remediation**: Audited all billing repositories, services, and routes to enforce `import type` for erased TypeScript interfaces (`BaseBillingEntity`, `Receivable`, `PaymentRecord`, `PaymentAllocation`, etc.).
  - **Independent Service Bootstrapping**: Verified zero-dependency runtime execution for standalone API (`PORT=3999 node server.ts`) and background worker (`STANDALONE_WORKER=true node dist/worker/index.js`).
  - **Live Endpoint Verification**: Validated HTTP 200 responses on `/health` and authenticated endpoints (`/customers`, `/invoices`, `/receivables`, `/payments`, `/payment-allocations`).
  - **Zero-Error Type & CI Gate**: Confirmed `tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` pass completely.

## [1.2.0] - 2026-10-06

### Added
- **Phase 3 Receivables, Payments & Payment Allocation Foundation (Prompt 003-005)**:
  - **Receivables & Payments Engine**: Built the `ReceivableService` executing safe minor-unit monetary calculations for payments, receivables, and matching allocations.
  - **Automatic Receivable Creation**: Integrated automatic idempotent receivable opening on invoice issuance, and void triggers on void actions.
  - **Traceable Allocations & Reversals**: Developed secure allocation mappings and reversal tracking that preserves ledger history using event audits instead of hard deletion.
  - **Frontend AR Workspace**: Extended `CommercialBillingWorkspace` with Accounts Receivable views, stats dashboards, payment recording and allocation wizards, and reversal controls.
  - **Automated Integration Testing**: Added robust API and service layer integration tests in `tests/receivables.test.ts`.

## [1.1.0] - 2026-10-05

### Added
- **Phase 3 Invoice Delivery & Customer Communication Foundation (Prompt 003-004)**:
  - **Governed Communication Delivery Service**: Built the `InvoiceDeliveryService` core supporting dispatch scheduling, template resolution, retry logic, and attempt tracking.
  - **Abstract Provider Architecture**: Implemented custom `MockEmailDeliveryProvider` simulation for success, temporary, and permanent SMTP failure paths without external mail coupling.
  - **Variable Mapping & Sandboxed rendering**: Developed a secure placeholder resolution engine for mapping customer details and monetary calculations safely.
  - **Frontend Communication Center**: Extended `CommercialBillingWorkspace` detail panels with document preparation, recipient verification, template selection, and retry trace tables.
  - **Comprehensive QA Testing**: Added `tests/invoice-deliveries.test.ts` verifying variables, state gates, idempotency key checks, multi-tenant isolation, and RBAC rules.

- **Phase 3 Invoice Document Generation & Delivery Foundation (Prompt 003-003)**:
  - **Invoice Document Generation Service**: Implemented governed document generation for APPROVED and ISSUED invoices with versioning, superseding of older versions, and SHA-256 content checksum integrity.
  - **Storage & Delivery Abstraction**: Introduced storage reference management and delivery status tracking (`NOT_SENT`, `QUEUED`, `SENT`, `FAILED`) without coupling to external email providers.
  - **Security & RBAC**: Enforced `billing:invoice:document:view` and `billing:invoice:document:generate` permissions with strict multi-tenant isolation and idempotency key support.
  - **Comprehensive QA Testing**: Added `tests/invoice-documents.test.ts` covering document generation rules, versioning, audit logging, and cross-tenant security.

- **Phase 3 Commercial Operations Billing Workspace & Invoice Management (Prompt 003-002)**:
  - **Commercial Billing Workspace (`/billing`)**: Created production-ready application workspace for managing billing customers, profiles, tax configurations, and invoices.
  - **Invoice Creation & Line Item Management**: Implemented guided creation wizard and line item editor with server-authoritative calculation preview.
  - **Governed Lifecycle & Immutability**: Supported DRAFT → REVIEW_REQUIRED → APPROVED → ISSUED → VOIDED state transitions with strict issued-invoice immutability and mandatory void reason audit tracking.
  - **CRM Relationship Navigation**: Enabled direct cross-navigation between Billing Customers and CRM Organisations.
  - **Comprehensive QA Testing**: Added `tests/billing-workspace.test.ts` covering dashboard isolation, customer CRUD, invoice lifecycle, and RBAC enforcement.

## [1.0.0] - 2026-10-02

### Added
- **Phase 2E Ainubis Continuous CRM Intelligence & Automated Monitoring (Prompt 002E-003)**:
  - **Continuous Monitoring Service**: Implemented `AinubisContinuousMonitorService` providing scheduled and event-driven automated surveillance across pipeline hygiene, lead qualification, organisation account health, scheme prospects, and operational tasks.
  - **Idempotent Deduplication & Reopening**: Added deterministic condition key mapping (`conditionKey`) and auto-resolution logic (`RESOLVED` state) when defective CRM conditions are resolved.
  - **Failure & Tenant Isolation**: Ensured multi-tenant execution safety with tenant-scoped monitoring and robust failure isolation (failure in Tenant B does not disrupt Tenant A or C).
  - **Central Capability Registry**: Created `AinubisCapabilityRegistry` cataloguing all intelligence capabilities with metadata.
  - **Monitoring Execution Repository**: Added `AIMonitoringExecutionRepository` tracking automated runs, duration, and metrics.
  - **REST API Endpoints (`/api/v1/ai/monitoring/*`)**: Exposed status, capabilities catalogue, execution history, and manual trigger controls with RBAC security gates (`crm:ai:monitor`).
  - **Automated QA & Security Testing**: Authoritative test suite in `tests/ainubis-continuous-monitoring.test.ts` verifying all requirements.

- **Phase 2E Ainubis CRM Intelligence Foundation & Governance (Prompt 002E-001)**:
  - **Intelligence Domain Taxonomy**: Exported complete set of types, enums, and structures (`IntelligenceType`, `IntelligenceStatus`, `ConfidenceLevel`, `ApprovalRequirement`, `AICapability`, `EvidenceReference`, and `AIObservationRecord`).
  - **AIObservationRepository**: Implemented high-performance in-memory repository to store, search, and page AI observations and recommendations, maintaining absolute tenant isolation.
  - **Context Assembly & Builder**: Created `AinubisContextBuilder` to safely gather tenant-isolated CRM records, activities, tasks, proposals, and metadata, applying sensitive data PII masking (e.g. credit card redaction) via the `@bcip/ai` policy engine.
  - **First Active Capability - Pipeline Hygiene**: Added `AinubisPipelineHygieneService` (`CRM_PIPELINE_HYGIENE`) to examine sales opportunities and deterministically produce evidence-grounded observations and alerts (e.g., stale deals, overdue follow-up tasks, missing close dates/values).
  - **REST API Routes (`/api/v1/ai/observations`)**: Implemented REST API layer with search, capability/status filtering, paging, and human-in-the-loop audit gates (`POST /:id/review`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/dismiss`).
  - **Real-Time Event Dispatching**: Mounted automated events (`ai.observation.created`, `ai.observation.reviewed`, `ai.recommendation.approved`, `ai.recommendation.rejected`, `ai.recommendation.dismissed`) on the internal CRM event bus.
  - **Background Worker Job**: Registered `ai.ainubis_analysis` handler in the worker runtime for pipeline hygiene jobs.
  - **Frontend Intelligence Workspace (`/crm/ainubis` or `#ainubis`)**: Created clean, responsive, and permission-aware workspace:
    - `AinubisIntelligencePage.tsx`: Primary master view displaying summaries, metric cards, debounced search, filtering, detail inspector modal, and manual analysis trigger.
    - `AinubisObservationCard.tsx` & `AinubisRecommendationCard.tsx`: Tailored visualization with confidence levels and actionable signoffs.
    - `AinubisEvidenceList.tsx`: Drill-down expandable evidence trace lineage components.
    - Skeletons, empty states, and permission checks.
  - **Automated QA & Security Testing**: Authored robust test suite in `tests/ainubis-foundation.test.ts` with comprehensive assertions confirming correct behavior across all 18 requirements in Section 34 of Prompt 002E-001.

## [0.9.0] - 2026-10-02

### Consolidated & Verified
- **Phase 2D CRM Frontend Consolidation & Final QA (Prompt 002D-006)**:
  - Consolidated and verified all 7 core CRM frontend modules:
    1. Pipeline Kanban Workspace (`/crm` or `#crm`)
    2. Leads Management Workspace (`/crm/leads` or `#leads`)
    3. Lead Conversion Wizard (`POST /api/v1/leads/:id/convert`)
    4. Organisations Management Workspace (`/crm/organisations` or `#organisations`)
    5. Scheme Prospects Workspace (`/crm/scheme-prospects` or `#scheme_prospects`)
    6. Activities Management Workspace (`/crm/activities` or `#activities`)
    7. Tasks & Action Items Workspace (`/crm/tasks` or `#tasks`)
  - Cross-module relationship navigation: Enabled direct cross-entity links in `OpportunityDetailModal`, `LeadDetailModal`, `OrganisationDetailModal`, `SchemeProspectDetailModal`, `ActivityDetailModal`, and `TaskDetailModal`.
  - Security & Tenant Isolation Audit: Verified that all API calls pass JWT tokens with user claims and `X-Tenant-ID` headers. Confirmed 0 production hard-coded tenant ID dependencies.
  - Form Consistency & Accessibility QA: Verified field-level error validation, loading skeletons, accessible zero-item states, keyboard focus trapping, and screen-reader labels across all CRM dialogs and tables.
  - Responsive Viewport Testing: Verified responsive table rendering and compact card views across 1440px+, 1024px, 768px, 390px, and 360px viewport widths.
  - Final Quality Gates: Executed 14/14 automated test suites (100% pass rate), verified `tsc --noEmit` (0 errors), `npm run build` (production Vite, Express server, Worker), `lint_applet` (0 errors), and `/health` HTTP 200 OK status.

## [0.8.0] - 2026-10-02

### Added
- **Phase 2D CRM Frontend — Prompt 002D-005: Activities & Tasks**
- Created production **Activities Management Workspace (`/crm/activities` or `#activities`)**:
  - `ActivitiesPage` (`apps/web/src/components/crm/activities/ActivitiesPage.tsx`): Primary workspace with KPI summary strip (Total Interactions, Phone Calls, Meetings, Internal Notes), server-side debounced search (300ms), activity type filter, pagination, and sorting.
  - `ActivitiesTable`, `ActivityRow`, `ActivityCardMobile`, `ActivityFilters`, `ActivityPagination`: Responsive tabular and mobile card components with Zero-Pill metadata formatting.
  - `ActivityDetailModal` (`apps/web/src/components/crm/activities/ActivityDetailModal.tsx`): Detail inspector with linked entity navigation (Leads, Opportunities, Organisations).
  - `ActivityFormModal` (`apps/web/src/components/crm/activities/ActivityFormModal.tsx`): Modal form for logging customer interactions (calls, emails, meetings, demos, notes).
- Created production **Tasks Management Workspace (`/crm/tasks` or `#tasks`)**:
  - `TasksPage` (`apps/web/src/components/crm/tasks/TasksPage.tsx`): Primary workspace with KPI summary strip (Open, In Progress, Completed, Overdue), server-side debounced search (300ms), status filter, priority filter, pagination, and quick complete trigger.
  - `TasksTable`, `TaskRow`, `TaskCardMobile`, `TaskFilters`, `TaskPagination`: Responsive tabular and mobile card components with check completion action, priority badges, and overdue highlighting.
  - `TaskDetailModal` (`apps/web/src/components/crm/tasks/TaskDetailModal.tsx`): Inspector displaying task description, due dates, assigned users, linked entity links, and lifecycle completion trigger.
  - `TaskFormModal` (`apps/web/src/components/crm/tasks/TaskFormModal.tsx`): Modal form for creating and editing CRM action items.
- Extended CRM Shared Query Layer in `apps/web/src/components/crm/shared/`:
  - `crm-types.ts`: Added `ActivityType`, `ACTIVITY_TYPE_CONFIG`, `Activity`, `CreateActivityDto`, `UpdateActivityDto`, `ActivitiesListResponse`, `TaskStatus`, `TASK_STATUS_CONFIG`, `TaskPriority`, `TASK_PRIORITY_CONFIG`, `CRMTask`, `CreateCRMTaskDto`, `UpdateCRMTaskDto`, `TasksListResponse`.
  - `crm-permissions.ts`: Added `canViewActivities`, `canCreateActivity`, `canEditActivity`, `canDeleteActivity`, `canViewTasks`, `canCreateTask`, `canEditTask`, `canCompleteTask`, `canDeleteTask`.
  - `crm-api.ts`: Added `listActivities`, `getActivity`, `createActivity`, `updateActivity`, `deleteActivity`, `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `completeTask`.
- Integrated navigation into `AppShell.tsx` and `types/navigation.ts` under the Relationships group.
- Authored automated test suite (`tests/crm-activities-tasks.test.ts`) with 9 test cases verifying RBAC permissions, live REST API creation/query/updates, task completion endpoint (`POST /api/v1/tasks/:id/complete`), search, filtering, 403 authorization gates, 422 validation rejections, and soft deletion.

## [0.7.0] - 2026-10-02

### Added
- **Phase 2D CRM Frontend — Prompt 002D-004: Organisations & Scheme Prospects**
- Created production **Organisations Management View (`/crm/organisations` or `#organisations`)**:
  - `OrganisationsPage` (`apps/web/src/components/crm/organisations/OrganisationsPage.tsx`): Primary view with summary KPI strip (Total Organisations, Managing Agents, Body Corporates, Active Clients), server-side debounced search (300ms), filtering by type/status, pagination, and sorting.
  - `OrganisationsTable` (`apps/web/src/components/crm/organisations/OrganisationsTable.tsx`): Responsive desktop table with sortable column headers.
  - `OrganisationRow` (`apps/web/src/components/crm/organisations/OrganisationRow.tsx`): High-density row with Zero-Pill metadata formatting.
  - `OrganisationCardMobile` (`apps/web/src/components/crm/organisations/OrganisationCardMobile.tsx`): Compact card layout for viewports < 768px.
  - `OrganisationFilters` (`apps/web/src/components/crm/organisations/OrganisationFilters.tsx`): Filter toolbar with debounced search input, type filter, status filter, and sorting.
  - `OrganisationPagination` (`apps/web/src/components/crm/organisations/OrganisationPagination.tsx`): Range indicator and page size selector (10/20/50 rows).
  - `OrganisationDetailModal` (`apps/web/src/components/crm/organisations/OrganisationDetailModal.tsx`): Multi-tab inspector displaying Overview, related Contacts, related Scheme Prospects, and related Sales Opportunities.
  - `OrganisationFormModal` (`apps/web/src/components/crm/organisations/OrganisationFormModal.tsx`): Modal form for creating and editing commercial organisations.
- Created production **Scheme Prospects Management View (`/crm/scheme-prospects` or `#scheme_prospects`)**:
  - `SchemeProspectsPage` (`apps/web/src/components/crm/scheme-prospects/SchemeProspectsPage.tsx`): Primary view for sectional-title body corporate and HOA prospect records with summary metrics (Total Schemes, Estimated Units, Agency Portfolios, Self-Managed).
  - `SchemeProspectsTable`, `SchemeProspectRow`, `SchemeProspectCardMobile`, `SchemeProspectFilters`, `SchemeProspectPagination`: Responsive tabular & card view components.
  - `SchemeProspectDetailModal` (`apps/web/src/components/crm/scheme-prospects/SchemeProspectDetailModal.tsx`): Detailed inspector displaying unit counts, sectional title scheme codes, location, installed property & accounting software, requirements, pain points, and linked organisation navigation.
  - `SchemeProspectFormModal` (`apps/web/src/components/crm/scheme-prospects/SchemeProspectFormModal.tsx`): Modal form for creating and editing scheme prospect records.
- Extended CRM Query Layer in `apps/web/src/components/crm/shared/`:
  - `crm-types.ts`: Added `OrganisationStatus`, `ORGANISATION_STATUS_CONFIG`, `CRMAddress`, `Organisation`, `CreateOrganisationDto`, `UpdateOrganisationDto`, `OrganisationsListResponse`, `Contact`, `SchemeProspect`, `CreateSchemeProspectDto`, `UpdateSchemeProspectDto`, `SchemeProspectsListResponse`.
  - `crm-permissions.ts`: Added `canViewOrganisations`, `canCreateOrganisation`, `canEditOrganisation`, `canDeleteOrganisation`, `canViewSchemeProspects`, `canCreateSchemeProspect`, `canEditSchemeProspect`, `canDeleteSchemeProspect`.
  - `crm-api.ts`: Added `listOrganisations`, `getOrganisation`, `createOrganisation`, `updateOrganisation`, `deleteOrganisation`, `getOrganisationContacts`, `getOrganisationOpportunities`, `getOrganisationSchemeProspects`, `listSchemeProspects`, `getSchemeProspect`, `createSchemeProspect`, `updateSchemeProspect`, `deleteSchemeProspect`.
- Integrated navigation into `AppShell.tsx` and `types/navigation.ts` under the Relationships group.
- Authored automated test suite (`tests/crm-organisations.test.ts`) with 8 test cases verifying RBAC permissions, live REST API creation/query/updates, sub-resource relationships, search, filtering, 403 authorization gates, 422 validation rejections, and soft deletion.

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

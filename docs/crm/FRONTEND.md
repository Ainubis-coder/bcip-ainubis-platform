# BCIP CRM Frontend Architecture & Pipeline Kanban Reference

**Phase:** Phase 2D — CRM Frontend Foundation & Pipeline Kanban  
**Prompt:** 002D-001  
**Route:** `/crm` (`#crm`)  
**Package:** `apps/web/src/components/crm/`

---

## 1. Overview

The BCIP CRM Frontend Layer replaces the previous CRM placeholder with an enterprise, multi-tenant Sales Pipeline Kanban interface. It directly interfaces with the Phase 2C CRM REST API (`/api/v1/opportunities`) without mock substitutes, enforcing strict South African Rand (ZAR) financial precision, backend tenant isolation, RBAC permissions, and the Phase 2A Design System.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              /crm PIPELINE VIEW                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Header: CRM Pipeline (Refresh | + New Opportunity)                           │
│ Summary Strip: Active Deals | Active Pipeline Value | Won Revenue | Win %    │
│ Filter Bar: Search by name/scheme | Stage Filter Dropdown | Reset           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Kanban Board (6 Responsive Lifecycle Columns):                               │
│ [Discovery] [Solution Design] [Proposal] [Contract] [Won] [Lost]             │
│                                                                              │
│ Opportunity Cards:                                                           │
│ • Deal Title & Entity Scope (Managing Agent / Direct Scheme)                 │
│ • ZAR Amount (e.g. R 144,000.00) & Calibrated Probability Bar                │
│ • Target Close Date & Overdue Badge                                          │
│ • Next Action Snippet & Velocity Indicator                                   │
│ • Actions: Move Stage Dialog | View Details & Audit History | Soft Delete    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

All CRM frontend components reside under `apps/web/src/components/crm/`:

```text
apps/web/src/components/crm/
│
├── shared/
│   ├── crm-types.ts                      # Domain types, stage configurations, API envelopes
│   ├── crm-formatters.ts                 # ZAR currency formatting, dates, probability helpers
│   ├── crm-permissions.ts                # Client-side RBAC guards mapping UserRole to permissions
│   └── crm-api.ts                        # Authenticated query client with tenant & request tracking
│
├── pipeline/
│   ├── CrmPipelinePage.tsx               # Master /crm route page component
│   ├── PipelineBoard.tsx                 # Responsive 6-column Kanban board container
│   ├── PipelineColumn.tsx                # Stage column with count, total value & deal cards
│   ├── OpportunityCard.tsx               # High-density deal card adhering to Zero-Pill discipline
│   ├── OpportunityStageTransitionDialog.tsx # Modal dialog for stage progression with audit reasons
│   ├── CreateOpportunityDialog.tsx       # Modal form for creating deals into the active tenant
│   ├── OpportunityDetailModal.tsx        # Details view with immutable stage history audit log
│   ├── PipelineSummary.tsx               # Top-level KPI strip with ZAR figures
│   ├── PipelineFilters.tsx               # Text search and stage dropdown controls
│   ├── PipelineSkeleton.tsx              # Shimmer loading state for smooth rendering
│   ├── PipelineEmptyState.tsx            # Enterprise zero-deal empty state with create action
│   └── PipelineErrorState.tsx            # Sanitized error state avoiding stack traces
│
└── index.ts                              # Clean module exports
```

---

## 3. Authenticated CRM API Query Layer

The frontend query layer is encapsulated in `CrmApiClient` (`apps/web/src/components/crm/shared/crm-api.ts`).

### Authentication & Tenant Boundary
Every request automatically:
1. Generates an authenticated JWT Bearer token containing the current `userId`, `tenantId`, and normalized `role`.
2. Emits an immutable correlation header `X-Request-Id: bcip_req_<timestamp>_<random>`.
3. Handles standard API envelopes:
   ```json
   {
     "success": true,
     "data": [...],
     "meta": { "requestId": "...", "timestamp": "..." }
   }
   ```
4. Throws structured `CrmApiError` instances containing HTTP status codes and API error messages without leaking database internals.

### Supported API Operations
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/opportunities` | Paginated opportunity list with search and stage filters |
| `GET` | `/api/v1/opportunities/pipeline` | Aggregated stage summaries, totals, and weighted values |
| `GET` | `/api/v1/opportunities/:id` | Single opportunity details |
| `POST` | `/api/v1/opportunities` | Creates deal with idempotency tracking |
| `PATCH` | `/api/v1/opportunities/:id` | Modifies opportunity attributes |
| `POST` | `/api/v1/opportunities/:id/stage` | Transitions lifecycle stage with mandatory/optional audit reason |
| `GET` | `/api/v1/opportunities/:id/history` | Retrieves immutable stage transition velocity records |
| `DELETE`| `/api/v1/opportunities/:id` | Soft-deletes opportunity from operational view |

---

## 4. Pipeline Stages & Governance

The Kanban board maps directly to the backend `OpportunityStage` lifecycle:

| Stage Key | UI Label | Default Prob | Visual Accent | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DISCOVERY` | **Discovery** | 20% | Sky (`#38bdf8`) | Portfolio scoping, lead qualification |
| `SOLUTION_DESIGN` | **Solution Design** | 40% | Indigo (`#818cf8`) | Unit sizing, accounting system mapping |
| `PROPOSAL` | **Proposal** | 60% | Amber (`#fbbf24`) | Formal commercial quote & SLA issue |
| `CONTRACT` | **Contract** | 80% | Purple (`#c084fc`) | Master Services Agreement legal sign-off |
| `WON` | **Won** | 100% | Emerald (`#34d399`)| Executed agreement; scheme onboarding |
| `LOST` | **Lost** | 0% | Rose (`#fb7185`) | Deal archived with documented loss reason |

### Stage Transition Flow
Stage transitions do not mutate stage directly; they call the backend lifecycle endpoint:
```text
Opportunity Card → "Move Stage" → Dialog → Select New Stage → Enter Reason → Confirm
   ↓
POST /api/v1/opportunities/:id/stage
   ↓
Backend validates transition, appends OpportunityStageHistory, emits CRM event
   ↓
Frontend silently refetches active pipeline and refreshes cards
```

---

## 5. Role-Based Access Control (RBAC)

The frontend respects backend RBAC permissions (`@bcip/auth`):

| Role | View Pipeline | Create Deal | Move Stage | Soft Delete |
| :--- | :---: | :---: | :---: | :---: |
| `PLATFORM_SUPER_ADMIN` | ✅ | ✅ | ✅ | ✅ |
| `MANAGING_AGENT_ADMIN` | ✅ | ✅ | ✅ | ✅ |
| `PORTFOLIO_MANAGER` | ✅ | ✅ | ✅ | ❌ |
| `SCHEME_TRUSTEE` | ❌ | ❌ | ❌ | ❌ |
| `PROPERTY_OWNER` | ❌ | ❌ | ❌ | ❌ |
| `CONTRACTOR_SERVICE` | ❌ | ❌ | ❌ | ❌ |

- Users without `crm:opportunity:view` receive a sanitized **Access Denied (403)** error screen.
- Users without `crm:opportunity:create` do not see "New Opportunity" or quick-add buttons.
- Users without `crm:opportunity:stage` do not see "Move Stage" actions.
- Users without `crm:opportunity:delete` do not see delete icons.

---

## 6. Financial Precision & Zero-Pill Aesthetics

- All financial amounts are formatted in South African Rand using `formatZAR`:
  - `R 144,000.00`
  - High-density cards use tabular monospace figures (`font-mono`) to prevent numeric jitter.
- **Zero-Pill Discipline**: Metadata is rendered as clean unboxed text (`·`, `/`) with subtle muted foregrounds rather than colored static capsule pills.
- **Ainubis Visual Foundation**: Stage and status badges follow the 5-state token taxonomy. Ainubis operates strictly observationally without mock AI generation.

---

## 7. Automated Testing

The CRM Frontend test suite is located in `tests/crm-frontend.test.ts` and integrated into `tests/run-all.ts`:

- **Formatting Tests**: Verifies ZAR decimals, negatives, compact formats, dates, and probabilities.
- **RBAC Matrix Tests**: Verifies permission gates across roles.
- **Token Tests**: Verifies client JWT generation and verification against `@bcip/auth`.
- **API Client Tests**: Executes live CRUD, pipeline summaries, stage transitions, and history queries against Express.
---

## 8. Leads Management Table (Phase 2D-002)

### 8.1 Route & Overview

- **Route:** `/leads` (Navigation ID: `leads`, accessible from Enterprise Navigation group "Commercial CRM")
- **Package:** `apps/web/src/components/crm/leads/`

The Leads Management Table provides an operational interface for viewing, searching, filtering, sorting, paginating, and qualifying inbound and outreach prospects before opportunity conversion.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              /leads MANAGEMENT VIEW                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Header: Leads Management (Refresh | + New Lead)                              │
│ KPI Strip: Total Leads | New Prospects | Qualified Fits | Converted          │
│ Filter Bar: Server Search (Debounced) | Status Dropdown | Qual Dropdown | Sort│
├──────────────────────────────────────────────────────────────────────────────┤
│ Tabular View (Desktop) / Adaptive Card List (Mobile):                        │
│ [Lead & Scope] [Contact Details] [Source] [Status] [Qualification] [Created] │
│ • Title & Sectional Scheme / Managing Agent Scope                            │
│ • Monospace Direct Contact (Email & Phone)                                   │
│ • Lead Source Channel & Campaign Attribution                                 │
│ • Authoritative LeadStatus Enum (NEW, ENRICHED, QUALIFIED, NURTURE, etc.)   │
│ • Qualification Assessment & Timeline Horizon                                │
│ • Actions: View Modal | Change Status Modal | Edit Form | Soft Delete        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Pagination: Showing X to Y of Z leads | Rows per page (10/20/50) | Controls │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Component Structure

```text
apps/web/src/components/crm/leads/
├── LeadsPage.tsx             # Master /leads route container with KPI strip and modals
├── LeadsTable.tsx            # Responsive desktop table with sortable column headers
├── LeadRow.tsx               # Desktop table row with Zero-Pill metadata formatting
├── LeadCardMobile.tsx        # High-density card representation for viewports < 768px
├── LeadFilters.tsx           # Toolbar with debounced search, status/qual filters, sort
├── LeadPagination.tsx        # Pagination bar with range indicator and page size selector
├── LeadsSkeleton.tsx         # Shimmer loading state during async data fetches
├── LeadsEmptyState.tsx       # Zero-lead state with clear filters or create action
├── LeadsErrorState.tsx       # 403 Forbidden / API error state with retry button
├── LeadDetailModal.tsx       # Deep inspection modal for lead scope, pain points & notes
├── LeadFormModal.tsx         # Enterprise modal form for creating and editing leads
├── LeadStatusModal.tsx       # Status transition modal enforcing backend LeadStatus enum
└── index.ts                  # Barrel exports for the leads module
```

### 8.3 REST API Endpoints

The Leads table connects directly to the Phase 2C REST API:
- `GET /api/v1/leads`: Paginated list supporting `page`, `pageSize`, `search`, `status`, `qualificationStatus`, `sortBy`, `sortOrder`.
- `GET /api/v1/leads/:id`: Fetch single lead details.
- `POST /api/v1/leads`: Create lead with idempotency header (`X-Idempotency-Key`).
- `PATCH /api/v1/leads/:id`: Update lead attributes or transition lifecycle status.
- `DELETE /api/v1/leads/:id`: Soft-delete lead record (preserved in compliance audit trail).

### 8.4 Authoritative Status & Controlled Enums

Lead lifecycle strictly uses the database enum without free-text or unofficial synonyms:
- `NEW`: Fresh lead captured from inbound or direct outreach.
- `ENRICHED`: Scheme metadata, unit sizing, and managing agent verified.
- `QUALIFIED`: Decision-maker fit verified and ready for commercial opportunity creation.
- `NURTURE`: Automated educational nurture sequence.
- `RE_ENGAGEMENT`: Re-contacting previously stalled prospect.
- `LOST`: Disqualified or non-viable lead archived from active outreach.
- `CONVERTED`: Converted to an Organisation, Contact, Prospect, and Opportunity.

### 8.5 Automated Test Coverage

The Leads test suite is located in `tests/crm-leads.test.ts` and runs under `npm test`:
- **Enum Conformance**: Confirms all 7 `LeadStatus` values and color tokens.
- **RBAC Matrix**: Verifies view, create, edit, convert, and delete permissions.
- **API Operations**: Live lead creation, search filtering, status transitions, and soft deletion.
- **Security Boundaries**: Confirms `SCHEME_TRUSTEE` receives `403 FORBIDDEN`.
- **Pagination Math**: Validates slicing, range math, and total page calculations.

---

## 9. Lead Conversion Wizard (Phase 2D-003)

### 9.1 Overview & Architecture

The Lead Conversion Wizard enables authorised CRM users (`MANAGING_AGENT_ADMIN`, `PORTFOLIO_MANAGER`, `PLATFORM_SUPER_ADMIN`) to convert a qualified lead into full commercial CRM accounts through the existing atomic Phase 2C Lead Conversion REST API (`POST /api/v1/leads/:id/convert`).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        LEAD CONVERSION WIZARD                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Progress Bar: [1. Review Lead] -> [2. Entity Data] -> [3. Confirm] -> [4. Result]
├──────────────────────────────────────────────────────────────────────────────┤
│ Step 1: Review Lead                                                          │
│ • Prospect Identity & Acquisition Source Channel                             │
│ • Sectional Scheme / Property Scope & Estimated Units                        │
│ • Direct Contact Monospace Information (Email & Phone)                       │
│ • Data Quality Readiness Check & Conversion State Notice                     │
│                                                                              │
│ Step 2: Configure Conversion Entity Data                                     │
│ • 1. Organisation: Name (Pre-filled), Type (Managing Agent / Body Corporate) │
│ • 2. Primary Contact: First Name & Last Name (Pre-filled), Contact Info      │
│ • 3. Scheme Prospect: Toggle creation, scheme name, unit sizing              │
│ • 4. Commercial Opportunity: Name, ZAR estimated value, Target Close Date    │
│                                                                              │
│ Step 3: Transaction Review & Confirmation                                    │
│ • Structured summary of all entities created/linked in authenticated tenant  │
│ • Explicit notice of atomic transaction and lead transition to CONVERTED     │
│ • Double-click prevention & Idempotency key (X-Idempotency-Key) generation   │
│                                                                              │
│ Step 4: Conversion Result & Navigation                                       │
│ • Success confirmation with generated database IDs                           │
│ • Quick navigation: "View Opportunity in Pipeline" or "Return to Leads"      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Component Structure

All conversion components reside under `apps/web/src/components/crm/conversion/`:

```text
apps/web/src/components/crm/conversion/
├── LeadConversionWizard.tsx        # Master multi-step modal container and submission handler
├── LeadConversionProgress.tsx      # Accessible 4-step progress tracker with step navigation
├── LeadConversionStepReview.tsx    # Step 1: Lead scope inspection and readiness check
├── LeadConversionStepData.tsx      # Step 2: Organisation, Contact, Prospect & Deal configuration
├── LeadConversionStepConfirm.tsx   # Step 3: Immutable atomic transaction review and confirmation
├── LeadConversionStepSuccess.tsx   # Step 4: Success card with entity summaries and quick links
├── LeadConversionError.tsx         # Unified error display for 400, 403, 404, 409, 422, 500
└── index.ts                        # Barrel exports for the conversion module
```

### 9.3 Backend REST API Contract

The wizard interacts with the backend atomic conversion route:
- **Route:** `POST /api/v1/leads/:id/convert`
- **Headers:**
  - `Authorization: Bearer <jwt>`
  - `X-Idempotency-Key: lead_convert_<leadId>_<timestamp>`
  - `Content-Type: application/json`
- **Request DTO (`ConvertLeadDto`):**
  ```json
  {
    "organisationName": "Atlantic Seaboard Portfolios (Pty) Ltd",
    "organisationType": "MANAGING_AGENT",
    "existingOrganisationId": null,
    "contactFirstName": "David",
    "contactLastName": "van Zyl",
    "existingContactId": null,
    "opportunityName": "Atlantic Seaboard Portfolios — Enterprise Platform Adoption",
    "estimatedValue": 42600.00,
    "expectedCloseDate": "2026-11-30",
    "createSchemeProspect": true
  }
  ```
- **Response DTO (`ConvertLeadResult`):**
  ```json
  {
    "success": true,
    "data": {
      "lead": { "id": "lead_...", "status": "CONVERTED", "convertedAt": "...", "convertedOpportunityId": "opp_..." },
      "organisation": { "id": "org_...", "name": "...", "status": "PROSPECT" },
      "contact": { "id": "cnt_...", "displayName": "..." },
      "schemeProspect": { "id": "sp_...", "name": "...", "estimatedUnitCount": 142 },
      "opportunity": { "id": "opp_...", "name": "...", "stage": "DISCOVERY", "estimatedValue": 42600, "probability": 25 }
    }
  }
  ```

### 9.4 Entry Points & RBAC Rules

1. **Leads Table (`LeadRow` & `LeadCardMobile`)**:
   - Authorized roles (`MANAGING_AGENT_ADMIN`, `PORTFOLIO_MANAGER`, `PLATFORM_SUPER_ADMIN`) see the green "Convert" button.
   - Restricted roles (`SCHEME_TRUSTEE`, `PROPERTY_OWNER`, `CONTRACTOR_SERVICE`) do not see conversion actions.
   - Already converted leads (`status === 'CONVERTED'`) display a disabled / converted status rather than the action.
2. **Lead Detail Modal (`LeadDetailModal`)**:
   - Header/footer includes "Convert Lead" button when eligible.
   - If already converted, displays a converted banner with direct link: "View Pipeline Opportunity".

### 9.5 Automated Test Coverage

The conversion test suite is located in `tests/crm-conversion.test.ts` and runs under `npm test`:
- **Eligibility**: Confirms `canConvertLead` passes for Managing Agent and Portfolio Managers, and fails for Trustees/Owners.
- **Atomic Execution**: Calls live REST API to convert a lead and asserts that all 5 entities are created and returned.
- **Idempotency Guard**: Asserts HTTP 409 CONFLICT when attempting to re-convert an already-converted lead.
- **Security Boundaries**: Asserts HTTP 403 FORBIDDEN for unauthorized roles.
- **Validation**: Asserts HTTP 422 VALIDATION_ERROR on invalid parameters (e.g. negative financial value).
- **Not Found Handling**: Asserts HTTP 404 NOT_FOUND on nonexistent lead IDs.
- **Status Persistence**: Confirms lead status is permanently `CONVERTED` in subsequent operational queries.

---

## 10. Organisations & Scheme Prospects (Phase 2D-004)

### 10.1 Overview & Component Architecture

The Organisations and Scheme Prospects management views provide enterprise views for commercial client accounts, managing agencies, and body corporate/HOA scheme records connected to the Phase 2C REST API endpoints.

```text
apps/web/src/components/crm/
├── organisations/
│   ├── OrganisationsPage.tsx       # Master page container with KPI summary and modals
│   ├── OrganisationsTable.tsx      # Responsive table with sortable columns
│   ├── OrganisationRow.tsx         # High-density row with Zero-Pill formatting
│   ├── OrganisationCardMobile.tsx  # Compact mobile card view
│   ├── OrganisationFilters.tsx     # Toolbar with debounced search, type/status filter
│   ├── OrganisationPagination.tsx  # Slicing indicator and page size selector
│   ├── OrganisationDetailModal.tsx # Multi-tab inspection modal (Overview, Contacts, Schemes, Opps)
│   ├── OrganisationFormModal.tsx   # Modal form for creating and editing organisations
│   ├── OrganisationsSkeleton.tsx   # Shimmer loading state
│   ├── OrganisationsEmptyState.tsx # Accessible zero-organisation state
│   ├── OrganisationsErrorState.tsx # Accessible error state with retry
│   └── index.ts                    # Barrel exports
│
└── scheme-prospects/
    ├── SchemeProspectsPage.tsx       # Master page for sectional title scheme prospects
    ├── SchemeProspectsTable.tsx      # Table view with unit count & managing agent columns
    ├── SchemeProspectRow.tsx         # High-density row with Zero-Pill metadata
    ├── SchemeProspectCardMobile.tsx  # Mobile view for scheme prospects
    ├── SchemeProspectFilters.tsx     # Debounced search and sorting controls
    ├── SchemeProspectPagination.tsx  # Page controls
    ├── SchemeProspectDetailModal.tsx # Detail inspector for units, location, installed software
    ├── SchemeProspectFormModal.tsx   # Modal form for creating and editing scheme prospects
    ├── SchemeProspectsSkeleton.tsx   # Shimmer loading state
    ├── SchemeProspectsEmptyState.tsx # Accessible empty state
    ├── SchemeProspectsErrorState.tsx # Accessible error state
    └── index.ts                      # Barrel exports
```

### 10.2 REST API Endpoints

The views connect directly to the Phase 2C REST API:
- `GET /api/v1/organisations`: List organisations supporting `page`, `pageSize`, `search`, `status`, `organisationType`, `sortBy`, `sortOrder`.
- `GET /api/v1/organisations/:id`: Fetch single organisation details.
- `POST /api/v1/organisations`: Create new organisation with `X-Idempotency-Key`.
- `PATCH /api/v1/organisations/:id`: Update organisation record.
- `DELETE /api/v1/organisations/:id`: Soft-delete organisation.
- `GET /api/v1/organisations/:id/contacts`: Fetch related contacts for an organisation.
- `GET /api/v1/organisations/:id/scheme-prospects`: Fetch related scheme prospects for an organisation.
- `GET /api/v1/organisations/:id/opportunities`: Fetch related sales opportunities for an organisation.
- `GET /api/v1/scheme-prospects`: List scheme prospects supporting `page`, `pageSize`, `search`, `organisationId`, `leadId`, `sortBy`, `sortOrder`.
- `GET /api/v1/scheme-prospects/:id`: Fetch single scheme prospect record.
- `POST /api/v1/scheme-prospects`: Create new scheme prospect with `X-Idempotency-Key`.
- `PATCH /api/v1/scheme-prospects/:id`: Update scheme prospect record.
- `DELETE /api/v1/scheme-prospects/:id`: Soft-delete scheme prospect.

### 10.3 Cross-Entity Relationship Navigation

- **Organisation → Contacts / Schemes / Opportunities**: The `OrganisationDetailModal` features tabbed sub-resource views with direct navigation links ("View Scheme →", "View in Pipeline →").
- **Scheme Prospect → Organisation**: The `SchemeProspectDetailModal` displays linked organisation profiles with direct navigation ("View Org →").
- **Lead Conversion Synergy**: Entities generated via the Lead Conversion Wizard are immediately queryable and navigable in both Organisations and Scheme Prospects views.

### 10.4 Automated Test Coverage

The test suite is located in `tests/crm-organisations.test.ts` and runs under `npm test`:
- **RBAC Matrix**: Verifies view, create, edit, and delete permissions for `MANAGING_AGENT_ADMIN`, `PORTFOLIO_MANAGER`, and blocks `SCHEME_TRUSTEE` (403).
- **Organisation Operations**: Creation, single-record query, status update, search filtering, and soft-deletion.
- **Scheme Prospect Operations**: Creation, unit count updates, list pagination, and soft-deletion.
- **Sub-Resource Relationships**: Verifies `GET /api/v1/organisations/:id/scheme-prospects`.
- **Validation**: Asserts HTTP 422 `VALIDATION_ERROR` on bad payloads.

---

## 11. Activities & Tasks (Phase 2D-005)

### 11.1 Overview & Component Architecture

The Activities and Tasks management views provide dedicated CRM workspaces for customer touchpoint logging, interaction auditing, follow-up task tracking, priority management, and completion workflows connected to Phase 2C REST API endpoints.

```text
apps/web/src/components/crm/
├── activities/
│   ├── ActivitiesPage.tsx       # Master activities workspace with KPI strip & modals
│   ├── ActivitiesTable.tsx      # Responsive desktop table with sortable columns
│   ├── ActivityRow.tsx          # High-density row with Zero-Pill metadata formatting
│   ├── ActivityCardMobile.tsx   # Compact mobile card view
│   ├── ActivityFilters.tsx      # Toolbar with debounced search, activityType dropdown
│   ├── ActivityPagination.tsx   # Slicing indicator and page size selector
│   ├── ActivityDetailModal.tsx  # Detail inspector with linked entity navigation
│   ├── ActivityFormModal.tsx    # Modal form for logging and editing activities
│   ├── ActivitiesSkeleton.tsx   # Shimmer loading state
│   ├── ActivitiesEmptyState.tsx # Accessible zero-activity state
│   ├── ActivitiesErrorState.tsx # Accessible error state with retry
│   └── index.ts                 # Barrel exports
│
└── tasks/
    ├── TasksPage.tsx            # Master tasks workspace with KPI strip & quick complete
    ├── TasksTable.tsx           # Table view with check completion column & priority badges
    ├── TaskRow.tsx              # High-density row with Zero-Pill priority/status tokens
    ├── TaskCardMobile.tsx       # Mobile view for task action items
    ├── TaskFilters.tsx          # Debounced search, status filter, priority filter
    ├── TaskPagination.tsx       # Page controls
    ├── TaskDetailModal.tsx      # Inspector displaying description, due date, lifecycle actions
    ├── TaskFormModal.tsx        # Modal form for creating and editing CRM tasks
    ├── TasksSkeleton.tsx        # Shimmer loading state
    ├── TasksEmptyState.tsx      # Accessible empty state
    ├── TasksErrorState.tsx      # Accessible error state
    └── index.ts                 # Barrel exports
```

### 11.2 REST API Endpoints

The views connect directly to the Phase 2C REST API:
- `GET /api/v1/activities`: List activities supporting `page`, `pageSize`, `search`, `activityType`, `leadId`, `opportunityId`, `organisationId`, `sortBy`, `sortOrder`.
- `GET /api/v1/activities/:id`: Fetch single activity details.
- `POST /api/v1/activities`: Create new activity log with `X-Idempotency-Key`.
- `PATCH /api/v1/activities/:id`: Update activity record.
- `DELETE /api/v1/activities/:id`: Soft-delete activity.
- `GET /api/v1/tasks`: List tasks supporting `page`, `pageSize`, `search`, `status`, `priority`, `assignedTo`, `leadId`, `opportunityId`, `sortBy`, `sortOrder`.
- `GET /api/v1/tasks/:id`: Fetch single task record.
- `POST /api/v1/tasks`: Create new task with `X-Idempotency-Key`.
- `PATCH /api/v1/tasks/:id`: Update task record.
- `POST /api/v1/tasks/:id/complete`: Execute lifecycle transition marking task as `COMPLETED`.
- `DELETE /api/v1/tasks/:id`: Soft-delete task.

### 11.3 Automated Test Coverage

The test suite is located in `tests/crm-activities-tasks.test.ts` and runs under `npm test`:
- **RBAC Matrix**: Verifies view, create, edit, complete, and delete permissions for `MANAGING_AGENT_ADMIN`, `PORTFOLIO_MANAGER`, and blocks `SCHEME_TRUSTEE` (403).
- **Activity Operations**: Creation, single-record query, description updates, search filtering, and soft-deletion.
- **Task Operations**: Creation, priority updates, list pagination, and soft-deletion.
- **Task Completion Lifecycle**: Verifies `POST /api/v1/tasks/:id/complete` transition to `COMPLETED` state.
- **Validation**: Asserts HTTP 422 `VALIDATION_ERROR` on bad payloads.

---

## 12. CRM Frontend Consolidation & Final QA (Phase 2D-006)

### 12.1 Consolidated Architecture & Module Map

Phase 2D provides a complete, unified enterprise CRM frontend connecting all commercial sales and managing agency account workflows directly to the Phase 2C REST API:

```text
BCIP CRM App Shell (AppShell.tsx)
├── Relationships Group
│   ├── Pipeline Workspace (#crm / CrmPipelinePage)
│   ├── Leads Management (#leads / LeadsPage)
│   ├── Lead Conversion Wizard (#leads / LeadConversionWizard)
│   ├── Organisations (#organisations / OrganisationsPage)
│   ├── Scheme Prospects (#scheme_prospects / SchemeProspectsPage)
│   ├── Activities Workspace (#activities / ActivitiesPage)
│   └── Tasks Workspace (#tasks / TasksPage)
```

### 12.2 Cross-Module Relationship Navigation Matrix

- **Lead → Converted Entities:** When a lead is converted via the `LeadConversionWizard`, the atomic REST endpoint generates an Organisation, Contact, Scheme Prospect, Opportunity, and Activity log.
- **Opportunity → Linked Entities:** `OpportunityDetailModal` links directly to linked Organisation profiles, origin Leads, and Scheme Prospects.
- **Organisation → Sub-Resources:** `OrganisationDetailModal` features tabbed views querying related Contacts (`GET /organisations/:id/contacts`), Scheme Prospects (`GET /organisations/:id/scheme-prospects`), and Pipeline Opportunities (`GET /organisations/:id/opportunities`).
- **Scheme Prospect → Organisation:** `SchemeProspectDetailModal` queries and links to the managing agency organisation.
- **Activities & Tasks → Context Entities:** `ActivityDetailModal` and `TaskDetailModal` provide direct links to linked Leads, Opportunities, and Organisations.

### 12.3 Security, Tenant Isolation & RBAC

- **Authentication:** All client requests pass JWT Bearer tokens signed with user identity (`sub`), user role (`role`), and tenant context (`tenantId`).
- **Tenant Isolation:** Enforced strictly via `X-Tenant-ID` headers and JWT token claims verified by backend `tenantMiddleware`. No hard-coded tenant IDs exist in production views.
- **RBAC Matrix:** Centralized in `crm-permissions.ts`. Viewing, creating, editing, converting, completing, and soft-deleting CRM entities are guarded by system permissions (`CRM_LEAD_VIEW`, `CRM_LEAD_CONVERT`, `CRM_TASK_COMPLETE`, etc.).

### 12.4 Verification & Test Execution Summary

```text
Full test suites: 14/14 test suites PASSED
Total tests executed: 100% pass rate
TypeScript compilation: PASS (tsc --noEmit: 0 errors)
Production build: PASS (npm run build: Vite web app, Express API server, Worker bundles succeeded)
Linter check: PASS (lint_applet: 0 errors)
Health Check: PASS (HTTP 200 OK /health)
Node 22 Runtime: Compatible
```






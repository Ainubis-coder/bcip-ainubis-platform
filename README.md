# BCIP — Body Corporate Intelligence Platform

> **v1.3.0 — Production-Grade Multi-Tenant Property Intelligence & Operations SaaS**
> 
> Sectional-title, body-corporate, and property-management ecosystem intelligence platform — powered by the **Ainubis** AI orchestration layer.
> 
> **Status**: 80+ REST API endpoints live · 7 core CRM workspaces · Ainubis intelligence engine · Commercial billing & AR module · Multi-tenant RBAC · 150+ granular permissions.

---

## 1. What is BCIP?

**BCIP (Body Corporate Intelligence Platform)** is a production-grade, multi-tenant SaaS platform engineered specifically for the sectional-title, strata, and body corporate property management sector.

BCIP eliminates the fragmented spreadsheet and legacy software workflows used by managing agents and trustees, centralizing:

* **Scheme & Unit Registers**: Sectional title boundaries, participation quota (PQ) schedules, and ownership rosters.
* **Financial Management & Levies**: Automated levy rolls, special levies, 10-year reserve fund compliance, and accounting ERP sync.
* **Maintenance & Work Orders**: Common property tickets, emergency dispatching, and contractor quote approvals.
* **Statutory Governance**: AGMs, electronic proxy voting, conduct rules, and meeting minutes archival.
* **Trustee Decision Support**: Transparent operational dashboards and compliance tracking.
* **Commercial Sales Engine**: Multi-tenant CRM pipeline, lead qualification, proposal & contract management.
* **Accounts Receivable & Billing**: Invoice lifecycle, payment reconciliation, AR aging, customer statements.

---

## 2. What is Ainubis?

**Ainubis** is BCIP's intelligent AI orchestration and cognitive decision-support layer.

Rather than functioning as a cosmetic chatbot, Ainubis operates as an intelligent operating system across platform data:

* **Continuous Monitoring**: Identifies anomalies in utility consumption, levy arrears, maintenance failure frequencies, and sales pipeline health.
* **Pattern Recognition**: Predicts reserve fund depletion, highlights preventative maintenance schedules, and forecasts deal closure probability.
* **Governance & Workflow Automation**: Generates statutory compliance reminders, drafts AGM packs, verifies contractor credentials, and orchestrates multi-step AI workflows under human approval gates.
* **Evidence-Grounded Intelligence**: All recommendations grounded in traceability lineage, with explicit confidence levels and context assembly.
* **Strict Guardrails & Privacy**: Implements tenant isolation, automatic PII masking (bank accounts, national IDs), and immutable audit trails compliant with POPIA/GDPR.

### Core Ainubis Capabilities (v1.3.0)

| Capability | Status | Purpose |
|-----------|--------|---------|
| **CRM_PIPELINE_HYGIENE** | ✅ Live | Audit pipeline gaps, stalled opportunities (>14 days), overdue tasks, incomplete forecast values |
| **CRM_DATA_QUALITY** | ✅ Live | Detect contact omissions, unverified fields, data staleness (>180 days) |
| **CRM_LEAD_QUALIFICATION** | ✅ Live | Assess conversion preparedness and deal closure risks |
| **CRM_CONTINUOUS_MONITORING** | ✅ Live | Scheduled and event-driven automated CRM surveillance |
| **CRM_PORTFOLIO_INTELLIGENCE** | ✅ Live | Cross-tenant portfolio analytics, risk signals, trend detection |
| **BILLING_AR_AGING** | ✅ Live | 6-bucket AR aging, collection priority scoring (0–100), customer balance aggregation |
| **BILLING_RECONCILIATION** | ✅ Live | Four-way invoice/receivable/payment/customer balance audit |
| **AI_WORKFLOW_ORCHESTRATION** | ✅ Live | Multi-step trigger-action automation with human approval gates |
| **EXECUTIVE_REPORTING** | ✅ Live | Time-period executive summaries with version history & publication gates |

---

## 3. Repository Architecture

```text
bcip-ainubis-platform/
│
├── apps/
│   ├── web/               # React 19 SPA frontend application (7 CRM modules, shell)
│   ├── api/               # Express backend REST API (/health, /api/v1/*)
│   └── worker/            # Background worker runtime & job queue engine
│
├── packages/
│   ├── ui/                # Shared enterprise design system primitives & tokens
│   ├── database/          # PostgreSQL connection, migration manager, schema models
│   ├── auth/              # RBAC roles (9), permission maps (150+), JWT token service
│   ├── ai/                # Ainubis AI Gateway, prompt management, tools, guardrails
│   ├── integrations/      # Connectors for accounting, payments, messaging
│   └── workflows/         # Trigger-action workflow automation engine
│
├── docs/
│   ├── architecture/      # High-level system architecture and data flows
│   ├── design-system/     # Design tokens, components, accessibility & theming
│   ├── application-shell/ # Enterprise shell architecture, navigation & responsive docs
│   ├── crm/               # CRM domain model, database schema, ERD, lifecycle docs
│   ├── billing/           # Billing domain, invoice lifecycle, AR operations docs
│   ├── ainubis/           # AI intelligence model, evidence grounding, capabilities
│   ├── ADR/               # Architecture Decision Records (ADR-001, ADR-002)
│   ├── specification/     # Detailed domain specifications and role definitions
│   └── api/               # Version 1 API documentation and contract specifications
│
├── diagrams/              # Architecture diagrams (Mermaid format)
├── schemas/               # Database schema SQL migration previews
├── tests/                 # Automated test suite (30+ test modules)
├── infrastructure/        # Docker Compose configuration for PostgreSQL & Redis
├── .github/               # CI/CD workflows (GitHub Actions)
├── .env.example           # Canonical environment configuration blueprint
├── package.json           # Workspace package manifests & scripts
├── CHANGELOG.md           # Detailed version history (v0.1.0–v1.3.0)
└── tsconfig.json          # Root TypeScript configuration with path aliases
```

---

## 4. Development Setup

### 4.1 Prerequisites

* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **Docker & Docker Compose** (for local PostgreSQL 16 and Redis 7)

### 4.2 Repository Installation

```bash
# Clone the repository
git clone https://github.com/Ainubis-coder/bcip-ainubis-platform.git
cd bcip-ainubis-platform

# Install all workspace dependencies
npm install
```

### 4.3 Environment Configuration

Copy the documented `.env.example` blueprint to create your local `.env`:

```bash
cp .env.example .env
```

Key configuration categories include:

* `DATABASE_URL`: PostgreSQL connection string (postgres://user:pass@localhost:5432/bcip)
* `REDIS_URL`: Redis host and credentials (redis://localhost:6379)
* `AUTH_JWT_SECRET`: Signing secret for JWT token verification (min 32 chars)
* `GEMINI_API_KEY`: Google Gemini API key for Ainubis AI Gateway
* `LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warn`, `error`)
* `STANDALONE_API`: Set to `true` to run API independently
* `STANDALONE_WORKER`: Set to `true` to run worker independently

### 4.4 Database Startup (PostgreSQL) & Redis

Launch the local PostgreSQL 16 and Redis 7 containers via Docker Compose:

```bash
# Start PostgreSQL and Redis in the background
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Check health of database and redis
docker compose -f infrastructure/docker/docker-compose.yml ps

# View logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f
```

### 4.5 Development Startup

Start the full-stack platform (React SPA + Express API + Worker):

```bash
# Runs full-stack server integrating Express API & Vite dev middleware
npm run dev
```

To run individual subsystems independently:

```bash
# Run standalone API server (port 3001)
STANDALONE_API=true npm run dev:api

# Run standalone Background Worker
STANDALONE_WORKER=true npm run dev:worker

# Run frontend-only dev server (port 5173)
cd apps/web && npm run dev
```

### 4.6 Testing

Run the automated test suite verifying API endpoints, domain services, worker execution, and web shell:

```bash
npm test
```

Runs 30+ test modules including:
- API health, status, CRM (leads, opportunities, organisations)
- Ainubis (foundation, continuous monitoring, actions, workflows)
- Billing (customers, invoices, receivables, payments, AR aging)
- Frontend (design system, CRM UI, conversions)
- Infrastructure & worker queue

### 4.7 Linting & Type Checking

Verify code cleanliness and TypeScript strict mode adherence:

```bash
# Strict TypeScript type check (no-emit)
npm run lint

# Fix linting issues
npx eslint --fix
```

### 4.8 Production Build

Compile all client, API, and worker assets for production deployment:

```bash
npm run build

# Output locations:
# - Frontend: dist/
# - API: dist/api/server.js
# - Worker: dist/worker/index.js
```

Start production build:

```bash
# Full stack
npm run start

# Or individually:
STANDALONE_API=true node dist/api/server.js
STANDALONE_WORKER=true node dist/worker/index.js
```

---

## 5. API Endpoints & Core Modules

### Health & Diagnostics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | `GET` | Service liveness, process uptime, version, correlation ID |
| `/api/v1/status` | `GET` | Application metadata, environment, subsystem capabilities |

### CRM Core (80+ Endpoints)

#### Leads Management
```
GET    /api/v1/leads                        # List leads (paginated, searchable)
POST   /api/v1/leads                        # Create lead
GET    /api/v1/leads/:id                    # Get lead by ID
PATCH  /api/v1/leads/:id                    # Update lead
DELETE /api/v1/leads/:id                    # Soft-delete lead
POST   /api/v1/leads/:id/convert            # Atomic lead-to-opportunity conversion
```

#### Organisations & Contacts
```
GET    /api/v1/organisations                # List organisations (paginated, searchable)
POST   /api/v1/organisations                # Create organisation
GET    /api/v1/organisations/:id            # Get organisation
PATCH  /api/v1/organisations/:id            # Update organisation
DELETE /api/v1/organisations/:id            # Soft-delete organisation
GET    /api/v1/organisations/:id/contacts   # List related contacts
GET    /api/v1/organisations/:id/opportunities

GET    /api/v1/contacts                     # List contacts
POST   /api/v1/contacts                     # Create contact
GET    /api/v1/contacts/:id                 # Get contact
PATCH  /api/v1/contacts/:id                 # Update contact
DELETE /api/v1/contacts/:id                 # Soft-delete contact
```

#### Sales Pipeline
```
GET    /api/v1/opportunities                # List opportunities (searchable, stage-filterable)
POST   /api/v1/opportunities                # Create opportunity
GET    /api/v1/opportunities/:id            # Get opportunity
PATCH  /api/v1/opportunities/:id            # Update opportunity
DELETE /api/v1/opportunities/:id            # Soft-delete opportunity
POST   /api/v1/opportunities/:id/stage      # Transition stage (with reason audit)
GET    /api/v1/opportunities/:id/history    # Get stage transition history
GET    /api/v1/opportunities/pipeline       # Pipeline summary (KPIs by stage)
```

#### Activities & Tasks
```
GET    /api/v1/activities                   # List activities (paginated)
POST   /api/v1/activities                   # Log activity (call, email, meeting, note)
GET    /api/v1/activities/:id               # Get activity
PATCH  /api/v1/activities/:id               # Update activity
DELETE /api/v1/activities/:id               # Soft-delete activity

GET    /api/v1/tasks                        # List tasks (paginated, status-filterable)
POST   /api/v1/tasks                        # Create task
GET    /api/v1/tasks/:id                    # Get task
PATCH  /api/v1/tasks/:id                    # Update task
POST   /api/v1/tasks/:id/complete           # Mark task complete
DELETE /api/v1/tasks/:id                    # Soft-delete task
```

#### Commercial Deals
```
GET    /api/v1/proposals                    # List proposals
POST   /api/v1/proposals                    # Create proposal (quotation)
GET    /api/v1/proposals/:id                # Get proposal
PATCH  /api/v1/proposals/:id                # Update proposal
POST   /api/v1/proposals/:id/send           # Send proposal to prospect
POST   /api/v1/proposals/:id/accept         # Mark proposal accepted

GET    /api/v1/contracts                    # List contracts
POST   /api/v1/contracts                    # Create contract
GET    /api/v1/contracts/:id                # Get contract
PATCH  /api/v1/contracts/:id                # Update contract
POST   /api/v1/contracts/:id/sign           # Sign contract
POST   /api/v1/contracts/:id/activate       # Activate contract (revenue recognition)
```

#### Scheme Prospects & Campaigns
```
GET    /api/v1/scheme-prospects             # List scheme prospects
POST   /api/v1/scheme-prospects             # Create prospect (new scheme opportunity)
GET    /api/v1/scheme-prospects/:id         # Get scheme prospect
PATCH  /api/v1/scheme-prospects/:id         # Update prospect
DELETE /api/v1/scheme-prospects/:id

GET    /api/v1/campaigns                    # List campaigns
POST   /api/v1/campaigns                    # Create campaign
PATCH  /api/v1/campaigns/:id                # Update campaign
```

### Ainubis AI Intelligence (30+ Endpoints)

#### Observations & Recommendations
```
GET    /api/v1/ai/observations              # List observations (capability/status filtered)
GET    /api/v1/ai/observations/:id          # Get observation detail
POST   /api/v1/ai/observations/:id/review   # Mark observation reviewed (human-in-the-loop)
POST   /api/v1/ai/observations/:id/approve  # Approve recommendation for action
POST   /api/v1/ai/observations/:id/reject   # Reject with reason
POST   /api/v1/ai/observations/:id/dismiss  # Dismiss observation
POST   /api/v1/ai/observations/analyze      # Trigger capability analysis
GET    /api/v1/ai/summary                   # Executive dashboard summary
GET    /api/v1/ai/context/:entityType/:entityId  # Contextual intelligence for entity
```

#### AI Actions
```
GET    /api/v1/ai/actions                   # List proposed actions (paginated)
GET    /api/v1/ai/actions/:id               # Get action detail
POST   /api/v1/ai/actions                   # Propose new AI action
POST   /api/v1/ai/actions/:id/review        # Request review (state gate)
POST   /api/v1/ai/actions/:id/approve       # Approve action execution
POST   /api/v1/ai/actions/:id/reject        # Reject action
POST   /api/v1/ai/actions/:id/execute       # Execute approved action (idempotent)
GET    /api/v1/ai/actions/:id/evidence      # Get evidence lineage
GET    /api/v1/ai/actions/:id/execution     # Get execution logs
GET    /api/v1/ai/actions/:id/verification  # Get verification results
```

#### AI Workflows
```
GET    /api/v1/ai/workflows                 # List workflows
POST   /api/v1/ai/workflows                 # Create workflow (trigger-action chain)
GET    /api/v1/ai/workflows/:id             # Get workflow definition
PUT    /api/v1/ai/workflows/:id             # Update workflow
POST   /api/v1/ai/workflows/:id/activate    # Activate workflow
POST   /api/v1/ai/workflows/:id/pause       # Pause workflow
POST   /api/v1/ai/workflows/:id/disable     # Disable workflow
POST   /api/v1/ai/workflows/:id/archive     # Archive workflow
POST   /api/v1/ai/workflows/:id/run         # Trigger workflow execution

GET    /api/v1/ai/workflow-runs/:id         # Get workflow run detail
POST   /api/v1/ai/workflow-runs/:id/cancel  # Cancel in-progress run
POST   /api/v1/ai/workflow-runs/:id/retry   # Retry failed run
GET    /api/v1/ai/workflow-runs/:id/timeline  # Get step-by-step timeline
GET    /api/v1/ai/workflow-runs/:id/outcome   # Get final outcome & results
GET    /api/v1/ai/workflow-runs/:id/approvals # Get approval gates (if human-in-loop)
```

#### Workflow Templates
```
GET    /api/v1/ai/workflow-templates        # List templates (paginated, scope-filterable)
GET    /api/v1/ai/workflow-templates/:id    # Get template definition
POST   /api/v1/ai/workflow-templates        # Create template
PUT    /api/v1/ai/workflow-templates/:id    # Update template
POST   /api/v1/ai/workflow-templates/:id/validate  # Validate template syntax
POST   /api/v1/ai/workflow-templates/:id/publish   # Publish template
POST   /api/v1/ai/workflow-templates/:id/deprecate # Deprecate template
POST   /api/v1/ai/workflow-templates/:id/archive   # Archive template
POST   /api/v1/ai/workflow-templates/:id/clone     # Clone template
POST   /api/v1/ai/workflow-templates/:id/instantiate  # Instantiate template as workflow
GET    /api/v1/ai/workflow-templates/:id/versions  # Get version history
```

#### Portfolio Intelligence
```
GET    /api/v1/ai/portfolio/snapshot        # Current portfolio metrics snapshot
GET    /api/v1/ai/portfolio/metrics         # Time-series portfolio metrics
GET    /api/v1/ai/portfolio/signals         # Risk signals & anomalies
GET    /api/v1/ai/portfolio/risks           # Risk assessment report
GET    /api/v1/ai/portfolio/trends          # Trend analysis & forecasts
GET    /api/v1/ai/portfolio/insights        # Executive insights
GET    /api/v1/ai/portfolio/priorities      # Action priority ranking
GET    /api/v1/ai/portfolio/health          # Portfolio health score
POST   /api/v1/ai/portfolio/analyze         # Trigger portfolio analysis
```

#### Executive Reporting
```
GET    /api/v1/ai/reports                   # List reports
GET    /api/v1/ai/reports/:id               # Get report detail
POST   /api/v1/ai/reports/generate          # Generate new report
GET    /api/v1/ai/reports/:id/versions      # Get report version history
POST   /api/v1/ai/reports/:id/review        # Request review
POST   /api/v1/ai/reports/:id/approve       # Approve report
POST   /api/v1/ai/reports/:id/reject        # Reject with feedback
POST   /api/v1/ai/reports/:id/publish       # Publish report
POST   /api/v1/ai/reports/:id/archive       # Archive report
GET    /api/v1/ai/reports/:id/evidence      # Get evidence lineage
POST   /api/v1/ai/reports/:id/export        # Export report (PDF/Excel)
```

### Billing & Accounts Receivable (25+ Endpoints)

#### Customers & Profiles
```
GET    /api/v1/billing/customers            # List billing customers
POST   /api/v1/billing/customers            # Create customer
GET    /api/v1/billing/customers/:id        # Get customer
PUT    /api/v1/billing/customers/:id        # Update customer
DELETE /api/v1/billing/customers/:id        # Soft-delete customer

GET    /api/v1/billing/profiles             # List billing profiles (tax configs)
POST   /api/v1/billing/profiles             # Create profile
GET    /api/v1/billing/profiles/:id         # Get profile
PUT    /api/v1/billing/profiles/:id         # Update profile
```

#### Invoices
```
GET    /api/v1/billing/invoices             # List invoices (paginated)
POST   /api/v1/billing/invoices             # Create invoice (DRAFT)
GET    /api/v1/billing/invoices/:id         # Get invoice
PUT    /api/v1/billing/invoices/:id         # Update invoice (if DRAFT)
POST   /api/v1/billing/invoices/:id/submit-review  # Submit for review
POST   /api/v1/billing/invoices/:id/approve # Approve invoice (to APPROVED state)
POST   /api/v1/billing/invoices/:id/issue   # Issue invoice (generate document, set ISSUED)
POST   /api/v1/billing/invoices/:id/void    # Void issued invoice (with reason)

GET    /api/v1/billing/invoices/:id/lines   # Get invoice line items
POST   /api/v1/billing/invoices/:id/lines   # Add line item
PUT    /api/v1/billing/invoices/:id/lines/:lineId  # Update line item
DELETE /api/v1/billing/invoices/:id/lines/:lineId  # Remove line item
```

#### Invoice Documents & Delivery
```
GET    /api/v1/billing/invoices/:id/documents           # List generated documents
POST   /api/v1/billing/invoices/:id/documents           # Generate document
GET    /api/v1/billing/invoice-documents/:documentId    # Get document detail
GET    /api/v1/billing/delivery-templates               # List delivery templates

POST   /api/v1/billing/invoices/:id/deliveries          # Initiate delivery
GET    /api/v1/billing/invoices/:id/deliveries          # List deliveries
GET    /api/v1/billing/invoice-deliveries/:deliveryId/attempts  # Get retry attempts
POST   /api/v1/billing/invoice-deliveries/:deliveryId/retry     # Retry delivery
```

#### Receivables & Payments
```
GET    /api/v1/billing/receivables          # List receivables (customer-filterable)
GET    /api/v1/billing/receivables/:id      # Get receivable detail
POST   /api/v1/billing/receivables/:id/recalculate  # Force recalculation

GET    /api/v1/billing/payments             # List payments
GET    /api/v1/billing/payments/:id         # Get payment
POST   /api/v1/billing/payments             # Record payment
POST   /api/v1/billing/payments/:id/reverse # Reverse payment (with reason)

GET    /api/v1/billing/payment-allocations  # List allocations
POST   /api/v1/billing/payment-allocations  # Allocate payment to receivable
POST   /api/v1/billing/payment-allocations/:id/reverse  # Reverse allocation
```

#### Accounts Receivable & Reporting
```
GET    /api/v1/billing/receivables/aging              # 6-bucket aging report
GET    /api/v1/billing/receivables/overdue            # Overdue receivables list
GET    /api/v1/billing/receivables/collection-priority # Collection priority ranking
GET    /api/v1/billing/receivables/summary            # AR summary (total outstanding, overdue)

GET    /api/v1/billing/customers/:customerId/statement # Customer statement (date-ranged)
GET    /api/v1/billing/customers/:customerId/balance   # Current customer balance

GET    /api/v1/billing/reconciliation                 # Four-way audit report (invoices vs receivables vs payments vs balances)
```

---

## 6. Multi-Tenant Security & RBAC

### Tenant Isolation (4 Layers)

1. **Database Layer**: All tables enforce `tenant_id UUID NOT NULL` with foreign key constraints and tenant-scoped unique indices.
2. **Repository Layer**: Every query requires `tenantId: string` parameter; all lookups filter by tenant.
3. **Service Layer**: Domain services validate that linked entities belong to the same tenant.
4. **API Layer**: JWT tokens extract immutable `tenantId`; no override via URL params or request body.

### User Roles (9 Total)

| Role | Permissions | Purpose |
|------|-------------|---------|
| **PLATFORM_SUPER_ADMIN** | All 150+ permissions | Platform-wide administration (Google Cloud audit role) |
| **MANAGING_AGENT_ADMIN** | Full CRM, Billing, Ainubis, Governance | Managing agent primary administrator |
| **PORTFOLIO_MANAGER** | CRM lead/opportunity/contact mgmt, read-only view of billing | Portfolio manager across schemes |
| **SCHEME_TRUSTEE** | View scheme, finance, governance; limited CRM visibility | Trustee governance & decision support |
| **PROPERTY_OWNER** | View scheme, create maintenance tickets, vote | Unit owner portal access |
| **RESIDENT_TENANT** | Create maintenance tickets only | Resident/tenant portal access |
| **CONTRACTOR_SERVICE** | View maintenance tickets & quotes | Contractor portal for job assignment |
| **FINANCIAL_AUDITOR** | View finance, billing, CRM for audit purposes | External auditor compliance access |
| **AINUBIS_SERVICE_AGENT** | Trigger AI analysis, view scheme/finance/CRM | Background AI system automation role |

### Permission Categories (150+ Total)

- **Scheme Management**: view, create, edit, delete
- **Finance & Levies**: view, invoice, payment, audit
- **Maintenance**: view, create tickets, dispatch, approve invoices
- **Governance**: meeting management, voting, minutes archival
- **CRM**: lead/contact/organisation/opportunity/activity/task/proposal/contract (CRUD + specialized)
- **Ainubis AI**: observation/recommendation/action/workflow view/create/approve/execute/admin
- **Billing**: customer/invoice/receivable/payment/statement/aging/reconciliation
- **Administration**: tenant config, user management

---

## 7. Workspace Modules (v1.3.0)

### Core CRM Workspaces

| Module | Route | Status | Purpose |
|--------|-------|--------|---------|
| **Dashboard** | `#dashboard` | ✅ Live | Executive overview, KPI cards, tenant switcher |
| **CRM Pipeline** | `#crm` | ✅ Live | Kanban board (DISCOVERY → WON/LOST), stage transitions, deal cards (ZAR formatted) |
| **Leads** | `#leads` | ✅ Live | Lead capture, qualification, status tracking, conversion wizard |
| **Organisations** | `#organisations` | ✅ Live | Commercial entity registry, type & status management, related contacts/opportunities |
| **Scheme Prospects** | `#scheme_prospects` | ✅ Live | Body corporate opportunity registry, unit counts, sectional title data |
| **Activities** | `#activities` | ✅ Live | Interaction logging (calls, emails, meetings), linked to leads/opportunities |
| **Tasks** | `#tasks` | ✅ Live | Action item management, priority/status, linked to CRM entities |
| **Ainubis Intelligence** | `#ainubis` | ✅ Live | AI observations, confidence scores, evidence trees, approval gates |
| **Commercial Billing** | `#billing` | ✅ Live | Invoice lifecycle, AR aging, customer statements, collection priority, reconciliation |
| **Design System** | `#design_system` | ✅ Live | Token showcase, component library, accessibility guide |

### Application Shell

- **Top Bar** (3-zone contract): Identity/logo · Tenant switcher + Global search (Cmd+K) · Ainubis telemetry + Notifications + User menu
- **Sidebar** (9 groups, collapsible): Dashboard, Commercial CRM, Relationships, Finance, Maintenance, Governance, Intelligence, Administration
- **Mobile Navigation**: Accessible drawer for devices < 1024px
- **Global Overlays**: Search modal, notification panel, tenant context, Ainubis drawer, API status modal

---

## 8. Completed Phases (v0.1.0 → v1.3.0)

### Phase 1 — Project Bootstrap (v0.1.0)
- ✅ Monorepo structure (apps/web, apps/api, apps/worker, packages/*)
- ✅ Core infrastructure (Express, React 19, PostgreSQL, Redis, Docker Compose)
- ✅ API health & status endpoints
- ✅ Base design system & UI shell

### Phase 2A — Enterprise Design System (v0.1.0)
- ✅ Centralized design tokens (colors, typography, spacing, borders, shadows, motion, z-index)
- ✅ Dual-theme architecture (dark/light)
- ✅ 30+ UI component library (Button, Input, Modal, Table, Card, Badge, etc.)
- ✅ Accessibility foundation (focus visible, visually hidden, reduced motion)
- ✅ Design System Showcase interactive demo

### Phase 2B — CRM Domain Model & Database (v0.3.0)
- ✅ PostgreSQL migrations (multi-tenant schema, 13 CRM tables)
- ✅ Repository layer with soft-deletion & tenant isolation
- ✅ Domain services (Lead, Opportunity, Proposal, Contract, Activity, Task, etc.)
- ✅ Event bus & audit trail (CRMEventBus, CRMAuditService)
- ✅ Seed fixtures (realistic South African scenarios)

### Phase 2C — CRM API Layer (v0.3.0–v0.5.0)
- ✅ 50+ REST endpoints (leads, organisations, opportunities, contacts, activities, tasks, campaigns, proposals, contracts, scheme prospects)
- ✅ Authentication middleware (JWT token validation, tenant extraction)
- ✅ RBAC middleware (permission checking, role-based access)
- ✅ Validation middleware (Zod schema validation)
- ✅ Idempotency middleware (X-Idempotency-Key support for POST/PATCH)
- ✅ Error handling & structured logging

### Phase 2D — CRM Frontend (v0.4.0–v0.9.0)
- ✅ **CRM Pipeline Kanban** (`#crm`): 6-stage Kanban, deal cards, create/transition/detail modals
- ✅ **Leads Workspace** (`#leads`): Table/card view, filters, search, status modal, detail inspector
- ✅ **Organisations Workspace** (`#organisations`): Commercial entity registry with related contact/opportunity navigation
- ✅ **Scheme Prospects Workspace** (`#scheme_prospects`): Body corporate opportunity tracking
- ✅ **Activities Workspace** (`#activities`): Interaction logging, linked entity navigation
- ✅ **Tasks Workspace** (`#tasks`): Action item management, completion tracking
- ✅ **Lead Conversion Wizard**: 4-step atomic conversion (organisation + contact + scheme prospect + opportunity + activity)
- ✅ CRM query layer (`crm-api.ts`, `crm-types.ts`, `crm-permissions.ts`, `crm-formatters.ts`)
- ✅ Responsive design (desktop table + mobile card views)
- ✅ Permission-aware UI (RBAC enforcement)

### Phase 2E-001 — Ainubis CRM Intelligence Foundation (v1.0.0)
- ✅ Intelligence domain taxonomy (types, enums, confidence levels)
- ✅ AIObservationRepository (in-memory store with tenant isolation)
- ✅ AinubisContextBuilder (safe CRM data assembly with PII masking)
- ✅ First capability: **CRM_PIPELINE_HYGIENE** (stalled deals, overdue tasks, forecast gaps)
- ✅ REST API endpoints (`/api/v1/ai/observations/*`)
- ✅ Human-in-the-loop gates (review, approve, reject, dismiss)
- ✅ Event dispatch (observation.created, recommendation.approved, etc.)
- ✅ Background worker job handler (`ai.ainubis_analysis`)
- ✅ Frontend workspace (`#ainubis`): observation cards, evidence trees, confidence levels

### Phase 2E-003 — Ainubis Continuous Monitoring (v1.0.0)
- ✅ Scheduled & event-driven monitoring across pipeline, leads, organisations
- ✅ Idempotent deduplication (`conditionKey` mapping)
- ✅ Auto-resolution when defects are fixed
- ✅ Tenant isolation for multi-tenant execution safety
- ✅ Capability registry (9+ capabilities catalogued)
- ✅ Monitoring execution repository & API endpoints
- ✅ Manual trigger controls with RBAC security gates

### Phase 2E-005 — Ainubis Actions & Workflow Infrastructure (v1.0.0)
- ✅ AI action proposal, review, approval, execution lifecycle
- ✅ Evidence lineage tracking for actions
- ✅ Workflow trigger-action chain definitions
- ✅ Workflow template system (publish, deprecate, archive, clone)
- ✅ Workflow run execution with timeline & outcome tracking
- ✅ Background job processor for workflow orchestration
- ✅ Human approval gates (state machine)
- ✅ REST API routes (`/api/v1/ai/actions/*`, `/api/v1/ai/workflows/*`)

### Phase 2E-006 — Workflow Templates & Analytics (v1.0.0)
- ✅ Workflow template CRUD & versioning
- ✅ Template validation, publishing, archiving
- ✅ Template cloning & instantiation
- ✅ Workflow analytics dashboard (run history, success rates, performance metrics)
- ✅ Health scoring for active workflows

### Phase 2E-007 — Portfolio Intelligence (v1.0.0)
- ✅ Portfolio snapshot metrics aggregation
- ✅ Risk signal detection (anomalies, threshold breaches)
- ✅ Trend analysis & forecasting
- ✅ Portfolio health scoring
- ✅ Action priority ranking (0–100 scale)
- ✅ Executive insights generation
- ✅ REST API endpoints (`/api/v1/ai/portfolio/*`)

### Phase 2E-008 — Executive Reporting (v1.0.0)
- ✅ Report generation with time-period support
- ✅ Report versioning & publication gates
- ✅ Evidence lineage (what data informed the report)
- ✅ Review/approve/reject workflow
- ✅ Report archival & export (PDF/Excel)
- ✅ REST API endpoints (`/api/v1/ai/reports/*`)

### Phase 3-001 to 003 — Billing Operations Foundation (v1.1.0–v1.2.0)
- ✅ **Customers & Billing Profiles**: Customer registry, tax configuration
- ✅ **Invoice Lifecycle**: DRAFT → REVIEW_REQUIRED → APPROVED → ISSUED → VOIDED
- ✅ **Line Item Management**: Add/edit/remove invoice line items with server-authoritative calculation
- ✅ **Invoice Documents**: PDF/document generation with versioning & SHA-256 checksums
- ✅ **Invoice Delivery**: Email delivery with template resolution, retry logic, attempt tracking
- ✅ **Mock Email Provider**: Simulate SMTP success/temporary/permanent failure paths
- ✅ **Commercial Billing Workspace** (`#billing`): Dashboard, customer management, invoice lifecycle UI

### Phase 3-004 — Invoice Delivery & Communication (v1.1.0)
- ✅ InvoiceDeliveryService (governed dispatch, scheduling, retry logic)
- ✅ Provider abstraction (custom MockEmailDeliveryProvider)
- ✅ Variable mapping & sandboxed rendering (safe placeholder resolution)
- ✅ Frontend communication center (recipient verification, template selection, retry traces)

### Phase 3-005 — Receivables, Payments & Allocations (v1.2.0)
- ✅ ReceivableService (automatic creation on invoice issuance, void triggers)
- ✅ Payment recording & allocation (traceable ledger mappings)
- ✅ Reversal tracking (event audit instead of hard deletion)
- ✅ AR Workspace (receivables views, payment recording wizard, allocation controls)
- ✅ Safe minor-unit monetary calculations

### Phase 3-006 — AR Aging, Statements & Reconciliation (v1.3.0)
- ✅ **Deterministic AR Aging Service**: 6-bucket aging (CURRENT, DAYS_1_30, ..., DAYS_121_PLUS)
- ✅ **Customer AR Balance Aggregation**: Multi-bucket summaries, total outstanding, overdue amounts
- ✅ **Chronological Customer Statements**: Date-ranged statements with opening/closing balances, running ledger
- ✅ **Collection Priority Scoring**: Explainable 0–100 scoring with actionable recommendations (CRITICAL → LOW)
- ✅ **Four-Way Reconciliation**: Cross-audit (Invoices vs Receivables vs Payments vs Balances)
- ✅ **Frontend AR Workspace**: AR Aging views, Customer Statements, Collection Priority, Reconciliation reports
- ✅ **40+ Automated QA Tests**: Boundary dates, customer balances, statement traceability, collection priority

---

## 9. Features & Capabilities Checklist (v1.3.0)

### ✅ Complete & Live

- Multi-tenant architecture with 4-layer isolation
- 150+ granular RBAC permissions across 9 roles
- 80+ REST API endpoints (CRM, Billing, AI)
- 7 full-featured CRM workspaces (leads, organisations, opportunities, activities, tasks, pipeline, conversions)
- Ainubis AI intelligence engine with 9+ capabilities
- Commercial billing module (customers, invoices, AR, reconciliation)
- PostgreSQL migrations & schema versioning
- Background worker job queue (Ainubis analysis, workflow execution)
- JWT authentication & tenant-aware token validation
- Request correlation IDs, structured logging, error handling
- Enterprise design system (30+ components, tokens, theming)
- Responsive shell (desktop sidebar + mobile drawer)
- 30+ automated test modules

### ⏳ Upcoming (Post v1.3.0)

- Scheme & property management module (registers, levies, maintenance)
- Governance & AGM module (voting, minutes, compliance tracking)
- Advanced Ainubis capabilities (reserve fund forecasting, utility anomaly detection)
- Third-party integrations (accounting ERP sync, payment processors)
- Advanced reporting & business intelligence
- Mobile native apps (React Native)

---

## 10. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript 7, Tailwind CSS 4, Vite 8 | Latest |
| **Backend** | Express 4, Node.js 20+, TypeScript 7, ESM | LTS |
| **Database** | PostgreSQL 16, Redis 7 | Latest |
| **API** | REST (OpenAPI 3.0 spec available at `/api/v1/openapi.json`) | v1 |
| **Auth** | JWT (HS256), RBAC, Multi-tenant isolation | Custom |
| **AI** | Google Gemini API, prompt management, guardrails | Integration ready |
| **Testing** | Vitest, Jest, Supertest, @testing-library/react | Latest |
| **Build** | Vite, esbuild, npm workspaces | Latest |
| **Deployment** | Docker, Docker Compose, Node.js standalone | Production-ready |

---

## 11. Project Status & Roadmap

### Current Version: **v1.3.0 — Production-Grade**

| Component | Status | Version |
|-----------|--------|---------|
| **Core Platform** | Production | v1.3.0 |
| **CRM Module** | Production | v1.3.0 |
| **Billing & AR** | Production | v1.3.0 |
| **Ainubis Intelligence** | Production | v1.3.0 |
| **API Endpoints** | 80+ live | v1 |
| **Test Coverage** | 30+ modules | Comprehensive |

### Next Phases (v2.0+)

- [ ] **Scheme & Property Management**: Unit registers, participation quotas, levy rolls, reserve fund compliance
- [ ] **Governance & AGM**: Electronic voting, meeting minutes, statutory compliance tracking
- [ ] **Advanced Integrations**: ERP (accounting) sync, payment processors, utility data feeds
- [ ] **Predictive Analytics**: Reserve fund forecasting, maintenance scheduling optimization
- [ ] **Mobile Apps**: React Native for iOS/Android (tenant portal)
- [ ] **GraphQL API**: Alternative to REST for complex queries
- [ ] **Offline-First**: PWA support for low-bandwidth environments

---

## 12. Getting Help

### Documentation

* **Architecture**: `docs/architecture/README.md`
* **CRM Domain**: `docs/crm/README.md` (domain model, schema, ERD, lifecycle, security)
* **Billing Operations**: `docs/billing/BILLING-ARCHITECTURE.md` (invoice lifecycle, AR operations)
* **Ainubis AI**: `docs/ainubis/README.md` (intelligence model, capabilities, evidence grounding)
* **Design System**: `docs/design-system/README.md` (tokens, components, accessibility)
* **API Spec**: `/api/v1/openapi.json` (live OpenAPI definition)

### Support

* **Issues**: [GitHub Issues](https://github.com/Ainubis-coder/bcip-ainubis-platform/issues)
* **Discussions**: [GitHub Discussions](https://github.com/Ainubis-coder/bcip-ainubis-platform/discussions)
* **Email**: ainubis.bcip@gmail.com

---

## 13. License

Apache License 2.0. See `LICENSE` for details.

---

## 14. Changelog

For detailed version history and release notes, see [`CHANGELOG.md`](./CHANGELOG.md).

**Latest**: v1.3.0 (2026-10-06) — Phase 3 AR Aging, Statements & Reconciliation complete

---

**Built with ❤️ for property intelligence.**

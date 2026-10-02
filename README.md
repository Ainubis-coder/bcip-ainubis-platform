# BCIP — Body Corporate Intelligence Platform

> Multi-tenant property intelligence and operational SaaS for the sectional-title, body-corporate, and property-management ecosystem — powered by the **Ainubis** AI orchestration layer.

---

## 1. What is BCIP?

**BCIP (Body Corporate Intelligence Platform)** is a production-grade, multi-tenant SaaS platform engineered specifically for the sectional-title, strata, and body corporate property management sector. 

BCIP eliminates the fragmented spreadsheet and legacy software workflows used by managing agents and trustees, centralizing:
* **Scheme & Unit Registers**: Sectional title boundaries, participation quota (PQ) schedules, and ownership rosters.
* **Financial Management & Levies**: Automated levy rolls, special levies, 10-year reserve fund compliance, and accounting ERP sync.
* **Maintenance & Work Orders**: Common property tickets, emergency dispatching, and contractor quote approvals.
* **Statutory Governance**: AGMs, electronic proxy voting, conduct rules, and meeting minutes archival.
* **Trustee Decision Support**: Transparent operational dashboards and compliance tracking.

---

## 2. What is Ainubis?

**Ainubis** is BCIP’s future AI intelligence and cognitive orchestration layer. 

Rather than functioning as a cosmetic chatbot, Ainubis operates as an intelligent operating system across platform data:
* **Continuous Monitoring**: Identifies anomalies in utility consumption, levy arrears, and maintenance failure frequencies.
* **Pattern Recognition**: Predicts reserve fund depletion and highlights preventative maintenance schedules before costly failures occur.
* **Governance & Workflow Automation**: Generates statutory compliance reminders, drafts AGM packs, and verifies contractor credential expirations under strict fiduciary rules.
* **Strict Guardrails & Privacy**: Implements tenant isolation and automatic PII masking (bank accounts, national IDs) prior to any model dispatch, with full immutable audit trails.

---

## 3. Repository Architecture

```text
bcip-ainubis-platform/
│
├── apps/
│   ├── web/               # React 19 SPA frontend application
│   ├── api/               # Express backend REST API (/health, /api/v1/*)
│   └── worker/            # Background worker runtime & job queue engine
│
├── packages/
│   ├── ui/                # Shared enterprise design system primitives
│   ├── database/          # PostgreSQL connection, migration manager, and schema models
│   ├── auth/              # RBAC roles, permission maps, and JWT token service
│   ├── ai/                # Ainubis AI Gateway, prompt management, tools, and guardrails
│   ├── integrations/      # Connectors for accounting, payments, and messaging
│   └── workflows/         # Trigger-action workflow automation engine
│
├── docs/
│   ├── architecture/      # High-level system architecture and data flows
│   ├── design-system/     # Design tokens, components, accessibility & theming
│   ├── application-shell/ # Enterprise shell architecture, navigation & responsive docs
│   ├── crm/               # CRM domain model, database schema, ERD, and lifecycle docs
│   ├── ADR/               # Architecture Decision Records (ADR-001)
│   ├── specification/     # Detailed domain specifications and role definitions
│   └── api/               # Version 1 API documentation and contract specifications
│
├── diagrams/              # Architecture diagrams (Mermaid format)
├── schemas/               # Database schema SQL migration previews
├── tests/                 # Automated test suite (API, config, worker, web)
├── infrastructure/        # Docker Compose configuration for PostgreSQL & Redis
├── .github/               # CI/CD workflows (GitHub Actions)
├── .env.example           # Canonical environment configuration blueprint
├── package.json           # Workspace package manifests & scripts
└── tsconfig.json          # Root TypeScript configuration with path aliases
```

---

## 4. Development Setup

### 4.1 Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **Docker & Docker Compose** (for local PostgreSQL and Redis)

### 4.2 Repository Installation
```bash
# Clone the repository
git clone <repository_url>
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
* `DATABASE_URL`: PostgreSQL connection string.
* `REDIS_URL`: Redis host and credentials.
* `AUTH_JWT_SECRET`: Signing secret for token verification.
* `GEMINI_API_KEY`: Model provider key for Ainubis AI Gateway.
* `LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warn`, `error`).

### 4.4 Database Startup (PostgreSQL) & Redis Startup
Launch the local PostgreSQL 16 and Redis 7 containers via Docker Compose:
```bash
# Start PostgreSQL and Redis in the background
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Check health of database and redis
docker compose -f infrastructure/docker/docker-compose.yml ps
```

### 4.5 Development Startup
Start the full-stack platform (React SPA + Express API on port 3000):
```bash
# Runs full-stack server integrating Express API & Vite dev middleware
npm run dev
```

To run individual subsystems independently:
```bash
# Run standalone API server
npm run dev:api

# Run standalone Background Worker
npm run dev:worker
```

### 4.6 Testing
Run the automated test suite verifying configuration parsing, API health endpoints, worker execution, and web shell:
```bash
npm test
```

### 4.7 Linting & Type Checking
Verify code cleanliness and TypeScript strict mode adherence:
```bash
# Strict TypeScript type check
npm run lint
```

### 4.8 Production Build
Compile client application assets for production deployment:
```bash
npm run build
```

---

## 5. Endpoints & Diagnostics

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Service liveness, process uptime, and version |
| `/api/v1/status` | `GET` | Application metadata, environment, and subsystem capability readiness |
| `/` | `GET` | BCIP Web Console & Dashboard |

---

## 6. Architecture & Roadmap Status

- [x] **Phase 1 (Prompt 001)**: Project Bootstrap & Architecture Foundation — COMPLETE
- [x] **Phase 2A (Prompt 002A)**: Enterprise Design System & Centralized Design Tokens — COMPLETE
- [x] **Phase 2B (Prompt 002B)**: CRM Domain Model & Database Schema — COMPLETE
- [ ] **Phase 2C (Prompt 002C)**: BCIP CRM API Layer — UPCOMING
- [ ] **Phase 2D (Prompt 002D)**: CRM User Interface & Sales Workspaces
- [ ] **Prompt 003**: Database Foundation & Multi-Tenant Schemas
- [ ] **Prompt 004**: Authentication & Multi-Tenant Authorization (RBAC)

---

## 7. License
Apache License 2.0. See `LICENSE` for details.
